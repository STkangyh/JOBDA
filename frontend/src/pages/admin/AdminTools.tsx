import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { formatCount } from './report'

// 관리자 데이터 관리 (2026-11-04, SQL: supabase/migrations/20261104000000_admin_tools.sql)
// 지우는 동작은 되돌릴 수 없어서 확인 문구를 직접 입력해야 버튼이 켜지고, 서버도 같은 문구를 다시 확인한다.
// 계정과 관리자 명단은 지우지 않는다.

export interface DataCounts {
  events_prod: number
  events_dev: number
  chat_logs: number
  ut_reviews: number
  user_progress: number
  participants: string[]
}

export type ResetScope = 'dev' | 'participant' | 'all'

export interface ResetResult {
  events: number
  chat_logs: number
  ut_reviews: number
  user_progress: number
}

export interface AdminToolsApi {
  counts: () => Promise<DataCounts>
  exportData: () => Promise<unknown>
  reset: (scope: ResetScope, confirm: string, participant?: string) => Promise<ResetResult>
}

const RESET_PHRASES = { dev: '개발 기록 삭제', all: '전체 초기화' } as const

function backupFileName(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3_600_000).toISOString() // 파일 이름은 한국 시각
  return `jobda-backup-${kst.slice(0, 10).replaceAll('-', '')}-${kst.slice(11, 16).replace(':', '')}.json`
}

function downloadJson(data: unknown, name: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function resultText(r: ResetResult) {
  const parts = [
    ['활동 기록', r.events],
    ['채팅 원문', r.chat_logs],
    ['관리자 검토', r.ut_reviews],
    ['진행 기록', r.user_progress],
  ].filter(([, n]) => Number(n) > 0)
  return parts.length ? `${parts.map(([l, n]) => `${l} ${formatCount(Number(n))}건`).join(', ')}을 지웠어요.` : '지울 기록이 없었어요.'
}

function Count({ label, value, hint }: { label: string; value: number | undefined; hint: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-neutral-75 p-4">
      <span className="text-body-sm text-neutral-600">{label}</span>
      <span className="text-headline-md font-semibold tabular-nums text-neutral-900">{value === undefined ? '—' : formatCount(value)}</span>
      <span className="text-caption-sm text-neutral-500">{hint}</span>
    </div>
  )
}

function DangerCard({
  title,
  body,
  phrase,
  children,
  disabled = false,
  onRun,
}: {
  title: string
  body: string
  /** 입력해야 하는 확인 문구 */
  phrase: string
  children?: ReactNode
  disabled?: boolean
  onRun: () => Promise<ResetResult>
}) {
  const [typed, setTyped] = useState('')
  const [state, setState] = useState<{ kind: 'idle' | 'running' } | { kind: 'done'; text: string } | { kind: 'error' }>({ kind: 'idle' })
  const ready = !disabled && phrase !== '' && typed === phrase && state.kind !== 'running'

  const run = async () => {
    setState({ kind: 'running' })
    try {
      const r = await onRun()
      setTyped('')
      setState({ kind: 'done', text: resultText(r) })
    } catch {
      setState({ kind: 'error' })
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-error-100 p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-body-md font-semibold text-neutral-900">{title}</h3>
        <p className="text-body-sm text-neutral-600">{body}</p>
      </div>
      {children}
      <label className="mt-auto flex flex-col gap-1.5 text-body-sm text-neutral-600">
        <span>
          확인하려면 <strong className="font-semibold text-neutral-900">{phrase || '…'}</strong>을(를) 입력하세요
        </span>
        <input
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value)
            if (state.kind !== 'running') setState({ kind: 'idle' })
          }}
          disabled={disabled}
          aria-label={`${title} 확인 문구`}
          className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-body-md text-neutral-900 focus:border-error-300 focus:outline-none disabled:bg-neutral-100"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!ready}
          onClick={() => void run()}
          className="rounded-lg bg-error-300 px-4 py-2 text-body-sm font-semibold text-neutral-50 hover:bg-error-400 disabled:bg-neutral-300"
        >
          {state.kind === 'running' ? '지우는 중…' : title}
        </button>
        {state.kind === 'done' && (
          <span role="status" className="text-body-sm text-green-900">
            {state.text}
          </span>
        )}
        {state.kind === 'error' && (
          <span role="alert" className="text-body-sm text-error-300">
            지우지 못했어요. 관리자 마이그레이션(20261104)이 적용됐는지 확인해주세요.
          </span>
        )}
      </div>
    </div>
  )
}

export function AdminTools({ api, onChanged }: { api: AdminToolsApi; onChanged?: () => void }) {
  const [counts, setCounts] = useState<DataCounts | null>(null)
  const [countsError, setCountsError] = useState(false)
  const [participant, setParticipant] = useState('')
  const [backup, setBackup] = useState<'idle' | 'running' | 'error'>('idle')

  const refresh = useCallback(async () => {
    try {
      setCounts(await api.counts())
      setCountsError(false)
    } catch {
      setCountsError(true)
    }
  }, [api])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const after = async (r: ResetResult) => {
    await refresh()
    onChanged?.()
    return r
  }

  const runBackup = async () => {
    setBackup('running')
    try {
      downloadJson(await api.exportData(), backupFileName())
      setBackup('idle')
    } catch {
      setBackup('error')
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-xl bg-neutral-50 p-6 shadow-[0_0_8px_rgba(0,0,0,0.04)]" aria-labelledby="admin-tools-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="admin-tools-title" className="text-title-md font-semibold text-neutral-900">
            데이터 관리
          </h2>
          <p className="text-body-sm text-neutral-500">기간 선택과 관계없이 전체 데이터를 다뤄요. 지운 기록은 되돌릴 수 없으니 먼저 백업하세요.</p>
        </div>
        <button type="button" onClick={() => void refresh()} className="rounded-lg px-3 py-1.5 text-body-sm text-neutral-700 hover:bg-neutral-100">
          새로고침
        </button>
      </div>

      {countsError && (
        <p role="alert" className="text-body-sm text-error-300">
          건수를 불러오지 못했어요. Supabase에 관리자 마이그레이션(20261104)이 적용됐는지 확인해주세요.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Count label="활동 기록 (운영)" value={counts?.events_prod} hint="관리자 지표의 원본" />
        <Count label="활동 기록 (개발)" value={counts?.events_dev} hint="로컬 개발 서버에서 쌓인 기록" />
        <Count label="채팅 원문" value={counts?.chat_logs} hint="30일 지나면 자동 삭제" />
        <Count label="관리자 검토" value={counts?.ut_reviews} hint="UT 세션 검토" />
        <Count label="계정 진행 기록" value={counts?.user_progress} hint="로그인 계정별 이어 하기" />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-neutral-75 p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-body-md font-semibold text-neutral-900">백업 내려받기</h3>
          <p className="text-body-sm text-neutral-600">활동 기록과 관리자 검토를 JSON 파일로 받아요. 채팅 원문과 계정 진행 기록은 들어가지 않아요.</p>
        </div>
        <button
          type="button"
          disabled={backup === 'running'}
          onClick={() => void runBackup()}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-body-sm font-semibold text-neutral-50 hover:bg-neutral-800 disabled:bg-neutral-400"
        >
          {backup === 'running' ? '준비 중…' : '백업 내려받기'}
        </button>
        {backup === 'error' && (
          <span role="alert" className="w-full text-body-sm text-error-300">
            백업을 만들지 못했어요. 다시 시도해주세요.
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DangerCard
          title="개발 기록 삭제"
          body="로컬 개발 서버에서 쌓인 활동 기록과 채팅 원문만 지워요. 운영 기록은 그대로예요."
          phrase={RESET_PHRASES.dev}
          onRun={async () => after(await api.reset('dev', RESET_PHRASES.dev))}
        />
        <DangerCard
          key={participant}
          title="참가자 기록 삭제"
          body="UT 참가자 코드 하나의 활동 기록, 채팅 원문, 관리자 검토를 지워요. 같은 코드로 다시 테스트할 때 써요."
          phrase={participant}
          disabled={!participant}
          onRun={async () => {
            const r = await after(await api.reset('participant', participant, participant))
            setParticipant('')
            return r
          }}
        >
          <label className="flex flex-col gap-1.5 text-body-sm text-neutral-600">
            참가자 코드
            <select
              value={participant}
              onChange={(e) => setParticipant(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-body-md text-neutral-900 focus:border-green-700 focus:outline-none"
            >
              <option value="">선택하세요</option>
              {(counts?.participants ?? []).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </DangerCard>
        <DangerCard
          title="전체 초기화"
          body="활동 기록, 채팅 원문, 관리자 검토, 계정 진행 기록을 모두 지워요. 계정과 관리자 명단은 남아요."
          phrase={RESET_PHRASES.all}
          onRun={async () => after(await api.reset('all', RESET_PHRASES.all))}
        />
      </div>
    </section>
  )
}
