import { useState, type FormEvent } from 'react'
import { requestPasswordReset, type AuthFailure } from '../../lib/auth'
import { AuthField, AuthLayout, BackToLogin, CardHeading, ErrorNotice, InfoBox, SubmitButton } from './AuthUI'

// Figma 비밀번호 찾기 2217:9847. 가입 여부와 상관없이 같은 안내를 보여준다(계정 존재 여부를 드러내지 않음).
export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<AuthFailure | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await requestPasswordReset(email)
    setBusy(false)
    if (result.ok) setSent(true)
    else setError(result.error)
  }

  return (
    <AuthLayout>
      <form onSubmit={submit} className="flex flex-col gap-[clamp(16px,2.9svh,32px)]">
        <div className="flex flex-col gap-4">
          <CardHeading
            title="비밀번호를 잊으셨나요?"
            body={
              <>
                가입한 이메일 주소를 입력해 주세요.
                <br />
                비밀번호를 재설정할 수 있는 링크를 보내드릴게요.
              </>
            }
          />
          {error && <ErrorNotice error={error} />}
        </div>
        <div className="flex flex-col gap-[clamp(10px,2.1svh,24px)]">
          <AuthField
            label="이메일"
            kind="email"
            name="email"
            autoComplete="username"
            required
            placeholder="가입한 이메일 주소를 입력해 주세요"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setSent(false)
            }}
          />
          <SubmitButton busy={busy}>제출하기</SubmitButton>
        </div>
        <InfoBox
          role="status"
          title={sent ? '재설정 메일을 보냈어요. 메일함을 확인해 주세요.' : '메일이 도착하지 않았나요?'}
          lines={['스팸 메일함을 확인하거나 이메일 주소를 다시 확인해 주세요.', '재설정 링크는 발송 후 30분 동안 유효합니다.']}
        />
        <BackToLogin />
      </form>
    </AuthLayout>
  )
}
