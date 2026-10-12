import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AFTER_AUTH_PATH, hasAccountSession, resendSignupEmail, signIn, type AuthFailure } from '../../lib/auth'
import { AuthField, AuthLayout, CardHeading, ErrorNotice, RememberCheckbox, SubmitButton, SwitchPrompt } from './AuthUI'

// Figma 로그인 2217:9633 · 로그인 오류 2220:35215. 로딩 화면 다음에 온다.
// 로그인하면 (예정) 온보딩으로 — 디자인이 오기 전까지는 AFTER_AUTH_PATH.
export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Figma 기본값은 체크 해제 — 끄고 로그인하면 브라우저를 닫을 때 로그아웃된다.
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<AuthFailure | null>(null)
  const [busy, setBusy] = useState(false)
  const [resent, setResent] = useState(false)

  // 이미 이메일 계정으로 로그인되어 있으면 로그인 화면을 건너뛴다.
  useEffect(() => {
    let cancelled = false
    hasAccountSession()
      .then((signedIn) => {
        if (signedIn && !cancelled) navigate(AFTER_AUTH_PATH, { replace: true })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [navigate])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setResent(false)
    const result = await signIn(email, password, remember)
    setBusy(false)
    if (result.ok) navigate(AFTER_AUTH_PATH, { replace: true })
    else setError(result.error)
  }

  const resend = async () => {
    const result = await resendSignupEmail(email)
    if (result.ok) setResent(true)
    else setError(result.error)
  }

  // Figma 로그인 오류 화면: 계정 정보가 틀리면 두 입력란 모두 빨간 테두리
  const credentialsInvalid = error?.code === 'invalid_credentials'

  return (
    <AuthLayout>
      <form onSubmit={submit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <CardHeading title="다시 만나 반가워요!" body="로그인하고 멈춰 있던 경험을 이어가세요." />
          {error && <ErrorNotice error={error} />}
          {error?.code === 'email_not_confirmed' && !resent && (
            <button type="button" onClick={resend} className="w-fit rounded text-body-md text-green-400 underline underline-offset-2">
              인증 메일 다시 보내기
            </button>
          )}
          {resent && (
            <p role="status" className="text-body-md text-green-400">
              인증 메일을 다시 보냈어요. 메일함을 확인해 주세요.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <AuthField
            label="이메일"
            kind="email"
            name="email"
            autoComplete="username"
            required
            placeholder="이메일 주소를 입력해 주세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={credentialsInvalid}
          />
          <AuthField
            label="비밀번호"
            kind="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="비밀번호를 입력해 주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={credentialsInvalid}
          />
          <div className="flex items-center justify-between gap-4">
            <RememberCheckbox checked={remember} onChange={setRemember} />
            <Link to="/forgot-password" className="rounded text-body-lg text-neutral-400 focus-visible:outline-2 focus-visible:outline-green-700">
              비밀번호 찾기
            </Link>
          </div>
          <SubmitButton busy={busy}>제출하기</SubmitButton>
        </div>

        <SwitchPrompt question="아직 계정이 없으신가요?" to="/signup" label="회원가입" />
      </form>
    </AuthLayout>
  )
}
