import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AFTER_AUTH_PATH, passwordProblem, PASSWORD_RULE, resendSignupEmail, signUp, type AuthFailure } from '../../lib/auth'
import { AuthField, AuthLayout, BackToLogin, CardHeading, ErrorNotice, InfoBox, SubmitButton, SwitchPrompt } from './AuthUI'
import type { Intro } from './intros'

// Figma 회원가입 2217:9897. 새 계정으로 가입하고(2026-10-13 결정) 메일의 인증 링크(/auth/confirm)를 누르면 완료된다.
const SIGNUP_INTRO: Intro = {
  title: ['나만의 가능성을 찾는,', '첫 번째 여정.'],
  body: ['오늘의 작은 경험을 내일의 가능성으로 만들어 보세요.', '회원가입을 통해 나만의 직무 여정을 시작하세요.'],
}

type Problem = { field: 'password' | 'confirm' | 'server'; error: AuthFailure | { title: string; detail: string } }

export function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [problem, setProblem] = useState<Problem | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [resent, setResent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const weak = passwordProblem(password)
    if (weak) return setProblem({ field: 'password', error: { title: '비밀번호를 다시 확인해 주세요.', detail: weak } })
    if (password !== confirm) {
      return setProblem({ field: 'confirm', error: { title: '비밀번호가 서로 달라요.', detail: '비밀번호 확인란에 같은 비밀번호를 입력해 주세요.' } })
    }
    setBusy(true)
    setProblem(null)
    const result = await signUp(email, password)
    setBusy(false)
    if (!result.ok) return setProblem({ field: 'server', error: result.error })
    if ('signedIn' in result) navigate(AFTER_AUTH_PATH, { replace: true })
    else setSent(true)
  }

  const resend = async () => {
    const result = await resendSignupEmail(email)
    if (result.ok) setResent(true)
    else setProblem({ field: 'server', error: result.error })
  }

  if (sent) {
    // 인증 대기 화면 — 디자인이 없어 비밀번호 찾기 카드의 안내 상자 구성을 그대로 따른다.
    return (
      <AuthLayout intro={SIGNUP_INTRO}>
        <div className="flex flex-col gap-[clamp(16px,2.9svh,32px)]">
          <CardHeading title="메일함을 확인해 주세요" body={<>{email.trim()}(으)로 인증 메일을 보냈어요.<br />메일의 인증 링크를 누르면 가입이 완료돼요.</>} />
          {problem && <ErrorNotice error={problem.error} />}
          <InfoBox
            role="status"
            title={resent ? '인증 메일을 다시 보냈어요.' : '메일이 도착하지 않았나요?'}
            lines={['스팸 메일함을 확인하거나 이메일 주소를 다시 확인해 주세요.', '인증 링크는 가장 최근에 받은 메일의 링크만 쓸 수 있어요.']}
          />
          <button
            type="button"
            onClick={resend}
            className="h-16 w-full rounded-xl border border-[#454545] text-title-md font-medium text-neutral-300 transition-colors hover:border-neutral-500 focus-visible:outline-2 focus-visible:outline-green-700"
          >
            인증 메일 다시 보내기
          </button>
          <BackToLogin />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout intro={SIGNUP_INTRO}>
      <form onSubmit={submit} className="flex flex-col gap-[clamp(16px,2.9svh,32px)]">
        <div className="flex flex-col gap-4">
          <CardHeading title="새로운 여정을 시작하세요" body="회원가입을 통해 나만의 경험을 저장하고, 다양한 직무를 탐색하세요." />
          {problem && <ErrorNotice error={problem.error} />}
        </div>
        <div className="flex flex-col gap-[clamp(10px,2.1svh,24px)]">
          <AuthField
            label="이메일 주소"
            kind="email"
            name="email"
            autoComplete="email"
            required
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={problem?.error && 'code' in problem.error && problem.error.code === 'user_already_exists'}
          />
          <AuthField
            label="비밀번호"
            kind="password"
            name="new-password"
            autoComplete="new-password"
            required
            placeholder="비밀번호를 입력해 주세요"
            title={PASSWORD_RULE}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={problem?.field === 'password'}
          />
          <AuthField
            label="비밀번호 확인"
            kind="password"
            name="confirm-password"
            autoComplete="new-password"
            required
            placeholder="비밀번호를 다시 입력해 주세요"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            invalid={problem?.field === 'confirm'}
          />
          <SubmitButton busy={busy}>제출하기</SubmitButton>
        </div>
        <SwitchPrompt question="이미 계정이 있으신가요?" to="/login" label="로그인" />
      </form>
    </AuthLayout>
  )
}
