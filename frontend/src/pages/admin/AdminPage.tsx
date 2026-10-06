import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ANALYTICS_ENABLED } from '../../lib/analytics'
import { getSupabase } from '../../lib/supabaseClient'
import { AdminDashboard } from './AdminDashboard'
import { periodSince, type AdminReport, type Period } from './report'

type Status = 'checking' | 'signed_out' | 'forbidden' | 'ready' | 'error'

function Shell({ email, onSignOut, children }: { email?: string; onSignOut?: () => void; children: ReactNode }) {
  return (
    <div className="min-h-svh bg-neutral-75 px-6 py-8">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-headline-md font-semibold text-neutral-900">JOBDA 관리자</h1>
            <span className="text-body-sm text-neutral-500">사용자 활동 분석</span>
          </div>
          {email && onSignOut && (
            <div className="flex items-center gap-3 text-body-sm text-neutral-600">
              <span>{email}</span>
              <button type="button" onClick={onSignOut} className="rounded-lg px-3 py-1.5 text-neutral-700 hover:bg-neutral-100">
                로그아웃
              </button>
            </div>
          )}
        </header>
        {children}
      </div>
    </div>
  )
}

function Notice({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="mx-auto mt-16 flex w-full max-w-md flex-col gap-3 rounded-xl bg-neutral-50 p-8 text-center shadow-[0_0_8px_rgba(0,0,0,0.04)]">
      <p className="text-title-md font-semibold text-neutral-900">{title}</p>
      <p className="text-body-sm text-neutral-600">{body}</p>
      {action}
    </div>
  )
}

// 개발 서버에서 /admin?demo 로 열면 샘플 데이터로 화면만 확인한다(운영 빌드에서는 코드째 빠짐).
function useDemoReport() {
  const [demo, setDemo] = useState<AdminReport | null>(null)
  useEffect(() => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('demo')) {
      void import('./demoReport').then((m) => setDemo(m.demoReport()))
    }
  }, [])
  return demo
}

export function AdminPage() {
  const demo = useDemoReport()
  const [demoPeriod, setDemoPeriod] = useState<Period>('30d')

  if (demo) {
    return (
      <Shell>
        <AdminDashboard report={demo} period={demoPeriod} onPeriod={setDemoPeriod} loading={false} />
      </Shell>
    )
  }
  if (!ANALYTICS_ENABLED) {
    return (
      <Shell>
        <Notice title="Supabase가 연결되지 않았어요" body="VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY 환경변수를 설정한 빌드에서만 관리자 페이지를 쓸 수 있어요." />
      </Shell>
    )
  }
  return <ConnectedAdmin />
}

function ConnectedAdmin() {
  const [status, setStatus] = useState<Status>('checking')
  const [email, setEmail] = useState('')
  const [report, setReport] = useState<AdminReport | null>(null)
  const [period, setPeriod] = useState<Period>('7d')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (p: Period) => {
    setLoading(true)
    const { data, error } = await getSupabase().rpc('admin_report', { p_since: periodSince(p) })
    setLoading(false)
    if (error) {
      // 42501 = 로그인은 됐지만 admins 명단에 없는 계정
      setStatus(error.code === '42501' ? 'forbidden' : 'error')
      return
    }
    setReport(data as AdminReport)
    setStatus('ready')
  }, [])

  useEffect(() => {
    let alive = true
    void (async () => {
      const { data } = await getSupabase().auth.getSession()
      if (!alive) return
      const user = data.session?.user
      // 활동 로그용 익명 로그인 세션은 관리자 로그인이 아니다.
      if (!user || user.is_anonymous) {
        setStatus('signed_out')
        return
      }
      setEmail(user.email ?? '')
      await load('7d')
    })()
    return () => {
      alive = false
    }
  }, [load])

  const signOut = async () => {
    await getSupabase().auth.signOut()
    setReport(null)
    setEmail('')
    setStatus('signed_out')
  }

  const changePeriod = (p: Period) => {
    setPeriod(p)
    void load(p)
  }

  if (status === 'checking') return <Shell>{null}</Shell>

  if (status === 'signed_out') {
    return (
      <Shell>
        <LoginForm
          onSignedIn={async (signedInEmail) => {
            setEmail(signedInEmail)
            await load(period)
          }}
        />
      </Shell>
    )
  }

  if (status === 'forbidden') {
    return (
      <Shell email={email} onSignOut={signOut}>
        <Notice title="관리자 권한이 없는 계정이에요" body={`${email} 계정이 관리자 명단(admins)에 없어요. 팀원에게 추가를 요청해주세요.`} />
      </Shell>
    )
  }

  if (status === 'error' || !report) {
    return (
      <Shell email={email} onSignOut={signOut}>
        <Notice
          title="데이터를 불러오지 못했어요"
          body="잠시 후 다시 시도해주세요. 계속되면 Supabase에 관리자 마이그레이션이 적용됐는지 확인해주세요."
          action={
            <button type="button" onClick={() => void load(period)} className="mx-auto rounded-lg bg-neutral-900 px-4 py-2 text-body-sm text-neutral-50">
              다시 시도
            </button>
          }
        />
      </Shell>
    )
  }

  return (
    <Shell email={email} onSignOut={signOut}>
      <AdminDashboard report={report} period={period} onPeriod={changePeriod} loading={loading} />
    </Shell>
  )
}

function LoginForm({ onSignedIn }: { onSignedIn: (email: string) => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { data, error: authError } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password })
    if (authError || !data.user) {
      setBusy(false)
      setError('이메일 또는 비밀번호가 맞지 않아요.')
      return
    }
    await onSignedIn(data.user.email ?? email.trim())
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-16 flex w-full max-w-sm flex-col gap-4 rounded-xl bg-neutral-50 p-8 shadow-[0_0_8px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-1">
        <p className="text-title-md font-semibold text-neutral-900">관리자 로그인</p>
        <p className="text-body-sm text-neutral-500">팀원 계정으로 로그인해주세요.</p>
      </div>
      <label className="flex flex-col gap-1.5 text-body-sm text-neutral-700">
        이메일
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2.5 text-body-md text-neutral-900 focus:border-green-700 focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-body-sm text-neutral-700">
        비밀번호
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2.5 text-body-md text-neutral-900 focus:border-green-700 focus:outline-none"
        />
      </label>
      {error && (
        <p role="alert" className="text-body-sm text-error-300">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-neutral-900 py-2.5 text-body-md font-semibold text-neutral-50 transition-colors hover:bg-neutral-800 disabled:bg-neutral-400"
      >
        {busy ? '로그인 중…' : '로그인'}
      </button>
    </form>
  )
}
