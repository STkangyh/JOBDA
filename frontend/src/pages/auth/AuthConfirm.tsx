import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AFTER_AUTH_PATH, confirmFromLink, isLinkType, type AuthFailure, type LinkType } from '../../lib/auth'
import { AuthLayout, BackToLogin, CardHeading, ErrorNotice, SubmitButton } from './AuthUI'

// 메일 링크가 도착하는 곳: /auth/confirm?token_hash=…&type=signup|recovery (supabase/templates 참고)
// 디자인 없음 — 인증 화면들과 같은 카드 틀을 쓴다.
// 메일 보안 검사기가 링크를 미리 열어 일회용 토큰을 써버리지 않도록, 열리자마자 인증하지 않고 버튼을 눌러야 인증한다.
const COPY: Record<LinkType, { title: string; body: string; action: string }> = {
  signup: { title: '이메일 인증을 완료해 주세요', body: '아래 버튼을 누르면 가입이 완료되고 바로 체험을 시작할 수 있어요.', action: '인증하기' },
  recovery: { title: '비밀번호를 재설정할게요', body: '아래 버튼을 누르면 새 비밀번호를 설정하는 화면으로 이동해요.', action: '계속하기' },
  email_change: { title: '이메일 변경을 완료해 주세요', body: '아래 버튼을 누르면 새 이메일 주소로 변경돼요.', action: '인증하기' },
}

interface LinkState {
  tokenHash: string
  type: LinkType
}

export function AuthConfirm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const fromUrl = params.get('token_hash')
  const typeParam = params.get('type')
  const link: LinkState | null =
    fromUrl && isLinkType(typeParam) ? { tokenHash: fromUrl, type: typeParam } : ((location.state as LinkState | null) ?? null)
  const [error, setError] = useState<AuthFailure | null>(null)
  const [busy, setBusy] = useState(false)

  // 주소창·방문 기록에 토큰이 남지 않도록 쿼리를 지우고 토큰은 라우터 상태로 옮긴다.
  useEffect(() => {
    if (fromUrl && isLinkType(typeParam)) navigate('/auth/confirm', { replace: true, state: { tokenHash: fromUrl, type: typeParam } })
  }, [fromUrl, typeParam, navigate])

  if (!link) {
    return (
      <AuthLayout>
        <div className="flex flex-col gap-8">
          <CardHeading title="링크를 확인할 수 없어요" body="메일에 있는 버튼을 다시 눌러 주세요. 계속 안 되면 메일을 다시 요청해 주세요." />
          <BackToLogin />
        </div>
      </AuthLayout>
    )
  }

  const copy = COPY[link.type]

  const confirm = async () => {
    setBusy(true)
    setError(null)
    const result = await confirmFromLink(link.tokenHash, link.type)
    setBusy(false)
    if (!result.ok) return setError(result.error)
    navigate(link.type === 'recovery' ? '/reset-password' : AFTER_AUTH_PATH, { replace: true })
  }

  return (
    <AuthLayout>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void confirm()
        }}
        className="flex flex-col gap-8"
      >
        <div className="flex flex-col gap-4">
          <CardHeading title={copy.title} body={copy.body} />
          {error && <ErrorNotice error={error} />}
        </div>
        <SubmitButton busy={busy}>{copy.action}</SubmitButton>
        <BackToLogin />
      </form>
    </AuthLayout>
  )
}
