import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { useSession } from './store/session'

// Simulates a narrow viewport by making matchMedia report the narrow-viewport query as
// matching, mirroring how a real narrow browser window would answer App.tsx's
// useIsNarrowViewport().
function mockNarrowViewport() {
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches: true,
    media: '(max-width: 1023px)',
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as MediaQueryList)
}

// App.tsx used to branch on window.location.pathname by hand, tracking a KNOWN_PATHS set in
// lockstep with an if-chain — missing either one for a new screen silently fell through to
// ErrorPage. These tests pin the react-router-dom <Routes> that replaced it: each real path
// still resolves to its screen, and anything else still falls back to the error page.

beforeEach(() => {
  useSession.getState().resetSession()
  // 기존 테스트는 재방문 브라우저 기준(시작 화면을 이미 본 상태) — 첫 방문은 아래 별도 테스트
  localStorage.setItem('jobda-welcome-seen', '1')
})

afterEach(() => {
  vi.restoreAllMocks()
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App routing', () => {
  it('renders Explore at "/"', async () => {
    renderAt('/')
    expect(await screen.findByText('New Arrival')).toBeInTheDocument()
  })

  it('sends a first-time visitor at "/" to the welcome splash, once per browser', async () => {
    const user = userEvent.setup()
    localStorage.removeItem('jobda-welcome-seen')
    renderAt('/')
    expect(await screen.findByText(/직접 경험해 보세요/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '직무 알아보기' }))
    expect(await screen.findByText('New Arrival')).toBeInTheDocument()
    expect(localStorage.getItem('jobda-welcome-seen')).toBe('1')
  })

  it('"체험 시작하기" goes through the loading splash to the login screen', async () => {
    const user = userEvent.setup()
    localStorage.removeItem('jobda-welcome-seen')
    renderAt('/welcome')
    await user.click(await screen.findByRole('button', { name: '체험 시작하기' }))
    expect(await screen.findByText('체험 공간을 준비하고 있어요')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '다시 만나 반가워요!' }, { timeout: 5000 })).toBeInTheDocument()
  })

  it('sends a browser that has signed in before (now logged out) at "/" straight to login, skipping the splash', async () => {
    localStorage.removeItem('jobda-welcome-seen')
    localStorage.setItem('jobda-has-account', '1')
    renderAt('/')
    expect(await screen.findByRole('heading', { name: '다시 만나 반가워요!' })).toBeInTheDocument()
    localStorage.removeItem('jobda-has-account')
  })

  it('renders the onboarding at "/onboarding" and its "체험 시작하기" starts session 2', async () => {
    const user = userEvent.setup()
    renderAt('/onboarding')
    expect(await screen.findByRole('heading', { name: '처음 오셨나요?' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '체험 시작하기' }))
    expect(await screen.findByText(/김기럭 사원님 반가워요/)).toBeInTheDocument()
  })

  it('renders Explore at the "/explore" alias too', async () => {
    renderAt('/explore')
    expect(await screen.findByText('New Arrival')).toBeInTheDocument()
  })

  it('renders JobDetail at "/explore/job"', async () => {
    renderAt('/explore/job')
    expect(await screen.findByText('생활 가전 제품디자이너')).toBeInTheDocument()
  })

  it('falls back to ErrorPage for an unregistered path', async () => {
    renderAt('/this-route-does-not-exist')
    expect(await screen.findByText('Error')).toBeInTheDocument()
  })

  it('ErrorPage\'s confirm button navigates back to "/"', async () => {
    const user = userEvent.setup()
    renderAt('/this-route-does-not-exist')

    await user.click(await screen.findByRole('button', { name: '확인' }))

    expect(await screen.findByText('New Arrival')).toBeInTheDocument()
  })

  it('shows MobileNotice instead of any route on a narrow viewport', async () => {
    mockNarrowViewport()
    renderAt('/')

    expect(await screen.findByText('PC 화면에서 이용해주세요')).toBeInTheDocument()
    expect(screen.queryByText('New Arrival')).not.toBeInTheDocument()
  })
})
