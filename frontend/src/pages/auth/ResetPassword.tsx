import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AFTER_AUTH_PATH, passwordProblem, PASSWORD_RULE, updatePassword, type AuthFailure } from '../../lib/auth'
import { AuthField, AuthLayout, BackToLogin, CardHeading, ErrorNotice, InfoBox, SubmitButton } from './AuthUI'

// Figma 비밀번호 재설정 2223:36129. 메일의 재설정 링크 → /auth/confirm(인증) → 이 화면.
type Problem = { field: 'password' | 'confirm' | 'server'; error: AuthFailure | { title: string; detail: string } }

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [problem, setProblem] = useState<Problem | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const weak = passwordProblem(password)
    if (weak) return setProblem({ field: 'password', error: { title: '비밀번호를 다시 확인해 주세요.', detail: weak } })
    if (password !== confirm) {
      return setProblem({ field: 'confirm', error: { title: '비밀번호가 서로 달라요.', detail: '새 비밀번호 확인란에 같은 비밀번호를 입력해 주세요.' } })
    }
    setBusy(true)
    setProblem(null)
    const result = await updatePassword(password)
    setBusy(false)
    if (result.ok) setDone(true)
    else setProblem({ field: 'server', error: result.error })
  }

  if (done) {
    return (
      <AuthLayout>
        <div className="flex flex-col gap-[clamp(16px,2.9svh,32px)]">
          <CardHeading title="비밀번호를 바꿨어요" body="새 비밀번호로 로그인되어 있어요. 멈춰 있던 경험을 이어가세요." />
          <button
            type="button"
            onClick={() => navigate(AFTER_AUTH_PATH, { replace: true })}
            className="flex h-[72px] w-full items-center justify-center rounded-xl border-2 border-[rgba(225,225,225,0.5)] bg-green-500 text-headline-md font-semibold text-neutral-900 hover:bg-green-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
          >
            체험 이어가기
          </button>
        </div>
      </AuthLayout>
    )
  }

  const expired = problem?.field === 'server' && 'code' in problem.error && problem.error.code === 'no_session'

  return (
    <AuthLayout>
      <form onSubmit={submit} className="flex flex-col gap-[clamp(16px,2.9svh,32px)]">
        <div className="flex flex-col gap-4">
          <CardHeading
            title="새 비밀번호를 설정해 주세요"
            body={
              <>
                안전한 비밀번호로 계정을 보호해 주세요.
                <br />새 비밀번호로 나만의 직무 여정을 이어가세요.
              </>
            }
          />
          {problem && <ErrorNotice error={problem.error} />}
          {expired && (
            <Link to="/forgot-password" className="w-fit rounded text-body-md text-green-400 underline underline-offset-2">
              재설정 메일 다시 요청하기
            </Link>
          )}
        </div>
        <div className="flex flex-col gap-[clamp(10px,2.1svh,24px)]">
          <AuthField
            label="새 비밀번호"
            kind="password"
            name="new-password"
            autoComplete="new-password"
            required
            placeholder="새 비밀번호를 입력해 주세요"
            title={PASSWORD_RULE}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={problem?.field === 'password'}
          />
          <AuthField
            label="새 비밀번호 확인"
            kind="password"
            name="confirm-password"
            autoComplete="new-password"
            required
            placeholder="새 비밀번호를 한 번 더 입력해 주세요"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            invalid={problem?.field === 'confirm'}
          />
          <InfoBox title="안전한 비밀번호를 위한 안내" lines={[PASSWORD_RULE, '이전에 사용한 비밀번호는 피하는 것이 좋아요.']} />
          {/* Figma 버튼 라벨은 자리표시자("Text")라 동작에 맞는 문구를 넣었다. 이 화면만 테두리가 있다. */}
          <SubmitButton busy={busy} outlined>
            비밀번호 변경하기
          </SubmitButton>
        </div>
        <BackToLogin />
      </form>
    </AuthLayout>
  )
}
