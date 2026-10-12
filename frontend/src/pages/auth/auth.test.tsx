import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

// 서버 기능이 켜진 환경을 흉내 낸다 — lib/auth가 모듈을 읽을 때 환경변수를 확인하므로 import 전에 넣는다.
vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')

const auth = {
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  resend: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  verifyOtp: vi.fn(),
  updateUser: vi.fn(),
}
vi.mock('../../lib/supabaseClient', () => ({ getSupabase: () => ({ auth }) }))

const track = vi.fn()
vi.mock('../../lib/analytics', async (orig) => ({ ...(await orig<typeof import('../../lib/analytics')>()), track: (...a: unknown[]) => track(...a) }))

const { Login } = await import('./Login')
const { Signup } = await import('./Signup')
const { ForgotPassword } = await import('./ForgotPassword')
const { ResetPassword } = await import('./ResetPassword')
const { AuthConfirm } = await import('./AuthConfirm')
const { consumeExpiredSessionFlag, passwordProblem, resolveEntry, AFTER_AUTH_PATH } = await import('../../lib/auth')

function Where() {
  const location = useLocation()
  return <p data-testid="where">{location.pathname + location.search}</p>
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/onboarding" element={<p>온보딩</p>} />
      </Routes>
      <Where />
    </MemoryRouter>,
  )
}

const anonymousSession = { data: { session: { user: { is_anonymous: true } } } }
const accountSession = { data: { session: { user: { is_anonymous: false } } } }
const EMAIL = 'designer@example.com'
const allTrackedProps = () => JSON.stringify(track.mock.calls)

beforeEach(() => {
  Object.values(auth).forEach((fn) => fn.mockReset())
  auth.getSession.mockResolvedValue(anonymousSession)
  track.mockClear()
  localStorage.clear()
  sessionStorage.clear()
})

afterAll(() => vi.unstubAllEnvs())

describe('login', () => {
  async function fillLogin(password = 'wrong-pass1!') {
    const user = userEvent.setup()
    renderAt('/login')
    await user.type(screen.getByLabelText('이메일'), EMAIL)
    await user.type(screen.getByLabelText('비밀번호'), password)
    return user
  }

  it('shows the design error notice and marks both fields when the credentials are wrong, without logging the email', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { code: 'invalid_credentials', message: 'Invalid login credentials', status: 400 } })
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('이메일 또는 비밀번호가 올바르지 않습니다.')
    expect(screen.getByLabelText('이메일')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('aria-invalid', 'true')
    expect(track).toHaveBeenCalledWith('login_error', { code: 'invalid_credentials' })
    expect(allTrackedProps()).not.toContain(EMAIL)
  })

  it('signs in and moves on; with "로그인 상태 유지" off (the default) the session ends when the browser is reopened', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null })
    const user = await fillLogin('right-pass1!')
    expect(screen.getByRole('checkbox', { name: '로그인 상태 유지' })).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    expect(await screen.findByText('온보딩')).toBeInTheDocument()
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: EMAIL, password: 'right-pass1!' })
    expect(consumeExpiredSessionFlag()).toBe(false) // 같은 브라우저 세션에서는 유지
    sessionStorage.clear() // 브라우저를 닫았다 다시 연 상태
    expect(consumeExpiredSessionFlag()).toBe(true)
  })

  it('keeps the session after reopening the browser when "로그인 상태 유지" is checked', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null })
    const user = await fillLogin('right-pass1!')
    await user.click(screen.getByRole('checkbox', { name: '로그인 상태 유지' }))
    await user.click(screen.getByRole('button', { name: '제출하기' }))
    await screen.findByText('온보딩')
    sessionStorage.clear()
    expect(consumeExpiredSessionFlag()).toBe(false)
  })

  it('offers to resend the verification mail when the account is not confirmed yet', async () => {
    auth.signInWithPassword.mockResolvedValue({ error: { code: 'email_not_confirmed', message: 'Email not confirmed', status: 400 } })
    auth.resend.mockResolvedValue({ error: null })
    const user = await fillLogin()
    await user.click(screen.getByRole('button', { name: '제출하기' }))
    await user.click(await screen.findByRole('button', { name: '인증 메일 다시 보내기' }))
    expect(auth.resend).toHaveBeenCalledWith(expect.objectContaining({ type: 'signup', email: EMAIL }))
    expect(screen.getByRole('status')).toHaveTextContent('인증 메일을 다시 보냈어요')
  })

  it('skips the form when an email account is already signed in', async () => {
    auth.getSession.mockResolvedValue(accountSession)
    renderAt('/login')
    expect(await screen.findByText('온보딩')).toBeInTheDocument()
  })
})

describe('signup', () => {
  async function fillSignup(password: string, confirm = password) {
    const user = userEvent.setup()
    renderAt('/signup')
    await user.type(screen.getByLabelText('이메일 주소'), EMAIL)
    await user.type(screen.getByLabelText('비밀번호'), password)
    await user.type(screen.getByLabelText('비밀번호 확인'), confirm)
    await user.click(screen.getByRole('button', { name: '제출하기' }))
    return user
  }

  it('checks the password rule and the confirmation before calling the server', async () => {
    await fillSignup('short1!')
    expect(screen.getByRole('alert')).toHaveTextContent('8~20자')
    expect(screen.getByLabelText('비밀번호')).toHaveAttribute('aria-invalid', 'true')
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('rejects a confirmation that does not match', async () => {
    await fillSignup('goodpass1!', 'goodpass2!')
    expect(screen.getByRole('alert')).toHaveTextContent('비밀번호가 서로 달라요')
    expect(screen.getByLabelText('비밀번호 확인')).toHaveAttribute('aria-invalid', 'true')
    expect(auth.signUp).not.toHaveBeenCalled()
  })

  it('creates a new account and asks to check the mailbox', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { identities: [{}] }, session: null }, error: null })
    await fillSignup('goodpass1!')
    expect(await screen.findByRole('heading', { name: '메일함을 확인해 주세요' })).toBeInTheDocument()
    expect(auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({ email: EMAIL, password: 'goodpass1!', options: { emailRedirectTo: `${window.location.origin}/auth/confirm` } }),
    )
    expect(track).toHaveBeenCalledWith('signup_email_sent')
    expect(allTrackedProps()).not.toContain(EMAIL)
  })

  it('tells the visitor when the email is already registered', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { identities: [] }, session: null }, error: null })
    await fillSignup('goodpass1!')
    expect(await screen.findByRole('alert')).toHaveTextContent('이미 가입된 이메일이에요.')
  })
})

describe('forgot password', () => {
  it('shows the same "sent" guidance whether or not the address is registered', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderAt('/forgot-password')
    await user.type(screen.getByLabelText('이메일'), EMAIL)
    await user.click(screen.getByRole('button', { name: '제출하기' }))
    expect(await screen.findByText('재설정 메일을 보냈어요. 메일함을 확인해 주세요.')).toBeInTheDocument()
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(EMAIL, { redirectTo: `${window.location.origin}/auth/confirm` })
  })
})

describe('mail link confirmation', () => {
  it('does not use the token until the button is pressed, hides it from the address, and continues to the reset screen', async () => {
    auth.verifyOtp.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderAt('/auth/confirm?token_hash=abc123&type=recovery')

    expect(await screen.findByRole('heading', { name: '비밀번호를 재설정할게요' })).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/auth\/confirm$/)
    expect(auth.verifyOtp).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '계속하기' }))
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'abc123', type: 'recovery' })
    expect(await screen.findByRole('heading', { name: '새 비밀번호를 설정해 주세요' })).toBeInTheDocument()
  })

  it('explains an expired link', async () => {
    auth.verifyOtp.mockResolvedValue({ error: { code: 'otp_expired', message: 'Email link is invalid or has expired', status: 403 } })
    const user = userEvent.setup()
    renderAt('/auth/confirm?token_hash=old&type=signup')
    await user.click(await screen.findByRole('button', { name: '인증하기' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('링크가 만료됐거나 이미 사용됐어요.')
  })
})

describe('reset password', () => {
  async function fillReset() {
    const user = userEvent.setup()
    renderAt('/reset-password')
    await user.type(screen.getByLabelText('새 비밀번호'), 'newpass1!')
    await user.type(screen.getByLabelText('새 비밀번호 확인'), 'newpass1!')
    await user.click(screen.getByRole('button', { name: '비밀번호 변경하기' }))
    return user
  }

  it('saves the new password in the recovery session', async () => {
    auth.getSession.mockResolvedValue(accountSession)
    auth.updateUser.mockResolvedValue({ error: null })
    await fillReset()
    expect(await screen.findByRole('heading', { name: '비밀번호를 바꿨어요' })).toBeInTheDocument()
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'newpass1!' })
  })

  it('asks for a new mail when there is no recovery session', async () => {
    await fillReset()
    expect(await screen.findByRole('alert')).toHaveTextContent('링크가 만료됐거나 이미 사용됐어요.')
    expect(screen.getByRole('link', { name: '재설정 메일 다시 요청하기' })).toHaveAttribute('href', '/forgot-password')
    expect(auth.updateUser).not.toHaveBeenCalled()
  })
})

describe('entry at "/"', () => {
  async function signInWith(remember: boolean) {
    auth.signInWithPassword.mockResolvedValue({ error: null })
    const user = userEvent.setup()
    renderAt('/login')
    await user.type(screen.getByLabelText('이메일'), EMAIL)
    await user.type(screen.getByLabelText('비밀번호'), 'right-pass1!')
    if (remember) await user.click(screen.getByRole('checkbox', { name: '로그인 상태 유지' }))
    await user.click(screen.getByRole('button', { name: '제출하기' }))
    await screen.findByText('온보딩')
    auth.getSession.mockResolvedValue(accountSession) // 로그인 세션이 저장된 상태
  }

  it('a new visitor keeps the normal splash/home entry', async () => {
    expect(await resolveEntry()).toBeNull()
  })

  it('"로그인 상태 유지"로 로그인한 사람은 브라우저를 다시 열어도 온보딩으로 바로 간다', async () => {
    await signInWith(true)
    sessionStorage.clear()
    expect(await resolveEntry()).toBe(AFTER_AUTH_PATH)
  })

  it('유지하지 않고 로그인한 사람은 브라우저를 다시 열면 시작 화면 없이 로그인으로 간다', async () => {
    await signInWith(false)
    expect(await resolveEntry()).toBe(AFTER_AUTH_PATH) // 브라우저를 닫기 전에는 아직 로그인 상태
    sessionStorage.clear()
    expect(await resolveEntry()).toBe('/login')
  })
})

describe('password rule', () => {
  it('requires 8-20 characters mixing letters, digits and symbols', () => {
    expect(passwordProblem('abcdefg1!')).toBeNull()
    expect(passwordProblem('abcdefgh1')).not.toBeNull()
    expect(passwordProblem('a1!')).not.toBeNull()
    expect(passwordProblem('a1!'.repeat(7))).not.toBeNull()
  })
})
