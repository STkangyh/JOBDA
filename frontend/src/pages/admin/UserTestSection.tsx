import { Fragment, useState } from 'react'
import {
  UT_STATUS_LABELS,
  activityDetail,
  activityLabel,
  formatCount,
  formatDuration,
  formatPct,
  screenLabel,
  stageOrder,
  type ActivityRow,
  type AdminReport,
  type UtSession,
} from './report'

const FLOW_LABELS = { s1: '세션1', s2: '세션2' } as const

const STATUS_STYLES: Record<UtSession['status'], string> = {
  completed: 'bg-green-100 text-green-900',
  in_progress: 'bg-neutral-100 text-neutral-700',
  exited: 'bg-error-100 text-error-400',
}

function median(values: number[]) {
  if (values.length === 0) return null
  const v = [...values].sort((a, b) => a - b)
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}

function kstTime(ts: string) {
  return new Date(ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Seoul' })
}

function kstDateTime(ts: string) {
  return new Date(ts).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' })
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-neutral-75 p-4">
      <span className="text-body-sm text-neutral-600">{label}</span>
      <span className="text-headline-md font-semibold tabular-nums text-neutral-900">{value}</span>
      <span className="text-caption-sm text-neutral-500">{hint}</span>
    </div>
  )
}

interface Props {
  report: AdminReport
  loadTimeline: (sessionId: string) => Promise<ActivityRow[]>
}

export function UserTestSection({ report, loadTimeline }: Props) {
  const sessions = report.ut_sessions ?? []
  const stages = [...(report.ut_stages ?? [])].sort((a, b) => stageOrder(a.flow, a.screen) - stageOrder(b.flow, b.screen))
  const [openId, setOpenId] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<ActivityRow[] | 'loading' | 'error'>('loading')

  const finished = sessions.filter((s) => s.status !== 'in_progress')
  const completed = sessions.filter((s) => s.status === 'completed')
  const completionPct = finished.length ? Math.round((completed.length / finished.length) * 1000) / 10 : null
  const participants = new Set(sessions.map((s) => s.participant)).size

  const toggle = async (id: string) => {
    if (openId === id) {
      setOpenId(null)
      return
    }
    setOpenId(id)
    setTimeline('loading')
    try {
      setTimeline(await loadTimeline(id))
    } catch {
      setTimeline('error')
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-xl bg-neutral-50 p-6 shadow-[0_0_8px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-title-md font-semibold text-neutral-900">유저 테스트</h2>
        <p className="text-body-sm text-neutral-500">참가자 코드 링크(주소 끝에 ?ut=P07)로 들어온 세션만 집계해요.</p>
      </div>

      {sessions.length === 0 ? (
        <p className="py-6 text-center text-body-sm text-neutral-500">아직 참가자 세션이 없어요. 테스트 링크에 ?ut=참가자코드 를 붙여 보내주세요.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="참가자" value={formatCount(participants)} hint={`세션 ${formatCount(sessions.length)}개`} />
            <Tile label="참가자 완료율" value={formatPct(completionPct)} hint="진행 중인 세션 제외" />
            <Tile label="완료까지 걸린 시간(중앙값)" value={formatDuration(median(completed.map((s) => s.time_on_task_s)))} hint="세션 시작부터 완료까지" />
            <Tile label="시스템 오류" value={formatCount(sessions.reduce((a, s) => a + s.system_errors, 0))} hint="채팅 실패·재시도, 리포트 생성 실패" />
          </div>
          <p className="text-caption-sm text-neutral-500">
            진행자 개입 횟수와 직무 이해 변화는 기록 방식이 정해지면 추가돼요. 지금 완료율은 진행자 도움 여부를 구분하지 않아요.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  {['참가자', '세션', '시작', '상태', '소요 시간', '질문', '시스템 오류', ''].map((h, i) => (
                    <th key={i} scope="col" className={`whitespace-nowrap px-3 py-2 font-medium ${i >= 4 && i <= 6 ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <Fragment key={s.session_id}>
                    <tr className="border-b border-neutral-100 hover:bg-neutral-75">
                      <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-neutral-900">{s.participant}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-neutral-800">{FLOW_LABELS[s.flow]}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-neutral-600">{kstDateTime(s.started_at)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-caption-sm font-medium ${STATUS_STYLES[s.status]}`}>{UT_STATUS_LABELS[s.status]}</span>
                        {s.exit_screen && s.status === 'exited' && <span className="ml-2 text-neutral-600">{screenLabel(s.exit_screen)}에서</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-neutral-800">{formatDuration(s.time_on_task_s)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-neutral-800">{formatCount(s.messages)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-neutral-800">{formatCount(s.system_errors)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <button
                          type="button"
                          aria-expanded={openId === s.session_id}
                          onClick={() => void toggle(s.session_id)}
                          className="rounded-lg px-2.5 py-1 text-neutral-700 hover:bg-neutral-100"
                        >
                          {openId === s.session_id ? '기록 닫기' : '활동 기록'}
                        </button>
                      </td>
                    </tr>
                    {openId === s.session_id && (
                      <tr className="border-b border-neutral-100 bg-neutral-75">
                        <td colSpan={8} className="px-3 py-3">
                          <Timeline rows={timeline} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-body-md font-semibold text-neutral-900">단계별 소요 시간</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500">
                    <th scope="col" className="px-3 py-2 text-left font-medium">단계</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">세션 수</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">중앙값</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map((t) => (
                    <tr key={`${t.flow}-${t.screen}`} className="border-b border-neutral-100 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2.5 text-neutral-800">{screenLabel(t.screen)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-neutral-800">{formatCount(t.sessions)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-neutral-800">{formatDuration(t.median_s)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function Timeline({ rows }: { rows: ActivityRow[] | 'loading' | 'error' }) {
  if (rows === 'loading') return <p className="text-body-sm text-neutral-500">불러오는 중…</p>
  if (rows === 'error') return <p className="text-body-sm text-error-300">활동 기록을 불러오지 못했어요.</p>
  if (rows.length === 0) return <p className="text-body-sm text-neutral-500">기록된 활동이 없어요.</p>
  return (
    <ol className="flex flex-col gap-1.5" aria-label="활동 기록">
      {rows.map((r, i) => (
        <li key={i} className="grid grid-cols-[72px_120px_minmax(0,1fr)] gap-3 text-body-sm">
          <span className="tabular-nums text-neutral-500">{kstTime(r.ts)}</span>
          <span className={`font-medium ${r.activity === 'session_exit' ? 'text-error-300' : 'text-neutral-900'}`}>{activityLabel(r.activity)}</span>
          <span className="truncate text-neutral-600">{activityDetail(r)}</span>
        </li>
      ))}
    </ol>
  )
}
