import { Fragment, useMemo, useState } from 'react'
import { FunnelBars } from './charts'
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
  type FunnelStep,
  type UtReview,
  type UtSession,
} from './report'
import { EVIDENCE, ISSUE_SHORT, ISSUE_TYPES, REASONS, isPresumed, reasonLabel, suggestReview } from './utReview'

export interface UtApi {
  loadTimeline: (sessionId: string) => Promise<ActivityRow[]>
  saveReview: (sessionId: string, review: UtReview) => Promise<void>
}

const FLOW_LABELS = { s1: '세션1', s2: '세션2' } as const

const STATUS_STYLES: Record<UtSession['status'], string> = {
  completed: 'bg-green-100 text-green-900',
  in_progress: 'bg-neutral-100 text-neutral-700',
  exited: 'bg-neutral-200 text-neutral-800',
  incomplete: 'bg-error-100 text-error-400',
}

function median(values: number[]) {
  if (values.length === 0) return null
  const v = [...values].sort((a, b) => a - b)
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : null)

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

// 문서 원칙: 자료함·메신저 방문 순서가 아니라 주요 업무 마일스톤으로 퍼널을 만든다.
// 세션1은 피드백·수정 단계가 없어서 그 두 마일스톤을 빼고 그린다.
function milestoneFunnel(sessions: UtSession[], flow: 's1' | 's2'): FunnelStep[] {
  const list = sessions.filter((s) => s.flow === flow)
  const steps: [string, (s: UtSession) => boolean][] = [
    ['미션 시작', () => true],
    ['첫 판단 제출', (s) => s.m_first_judgment],
    ...(flow === 's2'
      ? ([
          ['피드백 수신', (s: UtSession) => s.m_feedback],
          ['수정안 제출', (s: UtSession) => s.m_revision],
        ] as [string, (s: UtSession) => boolean][])
      : []),
    ['자기평가 완료', (s) => s.m_self_eval],
    ['리포트 도달', (s) => s.m_report],
  ]
  // FunnelBars는 stage 값을 단계 이름표로 그대로 보여준다(화면 단계 키가 아니면 원문 표시).
  return steps.map(([label, hit], i) => {
    const n = list.filter(hit).length
    return { ord: i + 1, stage: label, sessions: n, pct_of_start: pct(n, list.length) ?? 0 }
  })
}

interface Props {
  report: AdminReport
  ut: UtApi
}

export function UserTestSection({ report, ut }: Props) {
  const [round, setRound] = useState<string>('all')
  const [reviews, setReviews] = useState<Record<string, UtReview>>({})
  const rounds = useMemo(() => [...new Set((report.ut_sessions ?? []).map((s) => s.ut_round).filter((r): r is string => !!r))].sort(), [report.ut_sessions])
  const sessions = (report.ut_sessions ?? [])
    .filter((s) => round === 'all' || s.ut_round === round)
    .map((s) => (reviews[s.session_id] ? { ...s, review: reviews[s.session_id] } : s))
  const stages = [...(report.ut_stages ?? [])].sort((a, b) => stageOrder(a.flow, a.screen) - stageOrder(b.flow, b.screen))
  const [openId, setOpenId] = useState<string | null>(null)
  const [timeline, setTimeline] = useState<ActivityRow[] | 'loading' | 'error'>('loading')

  const completed = sessions.filter((s) => s.status === 'completed')
  const withFeedback = sessions.filter((s) => s.m_feedback)

  const toggle = async (id: string) => {
    if (openId === id) {
      setOpenId(null)
      return
    }
    setOpenId(id)
    setTimeline('loading')
    try {
      setTimeline(await ut.loadTimeline(id))
    } catch {
      setTimeline('error')
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-xl bg-neutral-50 p-6 shadow-[0_0_8px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-title-md font-semibold text-neutral-900">유저 테스트</h2>
          <p className="text-body-sm text-neutral-500">참가자 코드 링크(주소 끝에 ?ut=UT_001&round=V1)로 들어온 세션만 집계해요.</p>
        </div>
        {rounds.length > 0 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="UT 회차">
            {['all', ...rounds].map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={round === r}
                onClick={() => setRound(r)}
                className={`rounded-full px-3 py-1 text-caption-sm font-medium ${round === r ? 'bg-neutral-900 text-neutral-50' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
              >
                {r === 'all' ? '전체 회차' : r}
              </button>
            ))}
          </div>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="py-6 text-center text-body-sm text-neutral-500">아직 참가자 세션이 없어요. 테스트 링크에 ?ut=참가자코드 를 붙여 보내주세요.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="참가자" value={formatCount(new Set(sessions.map((s) => s.participant)).size)} hint={`세션 ${formatCount(sessions.length)}개`} />
            <Tile label="전체 완주율" value={formatPct(pct(completed.length, sessions.length))} hint="체험 완료 ÷ 시작한 세션" />
            <Tile label="리포트 도달률" value={formatPct(pct(sessions.filter((s) => s.m_report).length, sessions.length))} hint="리포트 화면까지 간 세션" />
            <Tile label="미완료 세션" value={formatCount(sessions.filter((s) => s.status === 'incomplete').length)} hint="마지막 기록 후 30일간 복귀 없음" />
            <Tile label="AI 협업 참여율" value={formatPct(pct(sessions.filter((s) => s.messages > 0).length, sessions.length))} hint="관계자에게 실제로 질문한 세션" />
            <Tile label="수정안 제출률" value={formatPct(pct(withFeedback.filter((s) => s.m_revision).length, withFeedback.length))} hint="피드백을 받은 뒤 수정안을 낸 세션" />
            <Tile label="완료까지 걸린 시간(중앙값)" value={formatDuration(median(completed.map((s) => s.time_on_task_s)))} hint="세션 시작부터 완료까지" />
            <Tile
              label="반복 탐색"
              value={formatCount(sessions.reduce((a, s) => a + s.repeat_opens, 0))}
              hint="같은 자료·관계자 재진입 합계 (많다고 나쁜 것은 아님)"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {(['s2', 's1'] as const)
              .filter((f) => sessions.some((s) => s.flow === f))
              .map((f) => (
                <div key={f} className="flex flex-col gap-3">
                  <h3 className="text-body-md font-semibold text-neutral-900">{FLOW_LABELS[f]} 업무 마일스톤</h3>
                  <FunnelBars steps={milestoneFunnel(sessions, f)} />
                </div>
              ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  {['참가자', '회차', '세션', '시작', '마지막 활동', '마지막 단계', '상태', '총 소요', '검토', ''].map((h, i) => (
                    <th key={i} scope="col" className={`whitespace-nowrap px-3 py-2 font-medium ${i === 7 ? 'text-right' : 'text-left'}`}>
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
                      <td className="whitespace-nowrap px-3 py-2.5 text-neutral-600">{s.ut_round ?? '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-neutral-800">{FLOW_LABELS[s.flow]}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-neutral-600">{kstDateTime(s.started_at)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-neutral-800">
                        {s.last_activity ? activityLabel(s.last_activity) : '—'}
                        {s.last_activity_at && <span className="ml-1.5 tabular-nums text-neutral-500">{kstDateTime(s.last_activity_at)}</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-neutral-800">{s.last_screen ? screenLabel(s.last_screen) : '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-caption-sm font-medium ${STATUS_STYLES[s.status]}`}>{UT_STATUS_LABELS[s.status]}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-neutral-800">{formatDuration(s.time_on_task_s)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {s.review ? (
                          <span className="text-neutral-800">
                            {ISSUE_SHORT[s.review.issue_type]}
                            {isPresumed(s.review) && <span className="ml-1 text-caption-sm text-neutral-500">(추정)</span>}
                          </span>
                        ) : (
                          <span className="text-neutral-400">미검토</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <button
                          type="button"
                          aria-expanded={openId === s.session_id}
                          onClick={() => void toggle(s.session_id)}
                          className="rounded-lg px-2.5 py-1 text-neutral-700 hover:bg-neutral-100"
                        >
                          {openId === s.session_id ? '닫기' : '기록·검토'}
                        </button>
                      </td>
                    </tr>
                    {openId === s.session_id && (
                      <tr className="border-b border-neutral-100 bg-neutral-75">
                        <td colSpan={10} className="px-3 py-4">
                          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                            <Timeline rows={timeline} />
                            <ReviewPanel
                              key={s.session_id}
                              session={s}
                              onSave={async (r) => {
                                await ut.saveReview(s.session_id, r)
                                setReviews((prev) => ({ ...prev, [s.session_id]: { ...r, updated_at: new Date().toISOString() } }))
                              }}
                            />
                          </div>
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

const REPEAT_LABELS: Record<string, string> = { material_open: '재열람', stakeholder_open: '재진입', step_enter: '재진입' }

function Timeline({ rows }: { rows: ActivityRow[] | 'loading' | 'error' }) {
  if (rows === 'loading') return <p className="text-body-sm text-neutral-500">불러오는 중…</p>
  if (rows === 'error') return <p className="text-body-sm text-error-300">활동 기록을 불러오지 못했어요.</p>
  if (rows.length === 0) return <p className="text-body-sm text-neutral-500">기록된 활동이 없어요.</p>
  // 마지막 행동 = 단계 진입·완료 표시를 뺀 마지막 기록
  const lastIndex = rows.findLastIndex((r) => r.activity !== 'step_enter' && r.activity !== 'step_complete')
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h3 className="text-body-md font-semibold text-neutral-900">행동 타임라인</h3>
      <ol className="flex flex-col gap-1" aria-label="활동 기록">
        {rows.map((r, i) => {
          const repeat = (r.nth ?? 1) > 1 ? REPEAT_LABELS[r.activity] : undefined
          if (r.activity === 'step_enter') {
            return (
              <li key={i} className="mt-2 flex items-center gap-2 text-caption-sm text-neutral-500 first:mt-0">
                <span className="tabular-nums">{kstTime(r.ts)}</span>
                <span className="font-semibold text-neutral-700">{activityDetail(r)} 단계</span>
                {repeat && <span className="rounded bg-neutral-200 px-1.5 text-neutral-700">{repeat}</span>}
                <span className="h-px flex-1 bg-neutral-200" aria-hidden />
              </li>
            )
          }
          const isLast = i === lastIndex
          const isError = r.activity === 'error_occurred'
          return (
            <li
              key={i}
              className={`grid grid-cols-[72px_128px_minmax(0,1fr)] items-baseline gap-3 rounded px-1 py-0.5 text-body-sm ${isLast ? 'bg-neutral-50 ring-1 ring-neutral-300' : ''}`}
            >
              <span className="tabular-nums text-neutral-500">{kstTime(r.ts)}</span>
              <span className={`font-medium ${isError ? 'text-error-300' : r.activity === 'step_complete' ? 'text-green-900' : 'text-neutral-900'}`}>
                {activityLabel(r.activity)}
              </span>
              <span className="flex min-w-0 items-baseline gap-2 text-neutral-600">
                <span className="truncate">{activityDetail(r)}</span>
                {repeat && <span className="shrink-0 rounded bg-neutral-200 px-1.5 text-caption-sm text-neutral-700">{repeat}</span>}
                {isLast && <span className="shrink-0 rounded bg-neutral-900 px-1.5 text-caption-sm text-neutral-50">마지막 행동</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Radio<T extends string>({ name, value, options, onChange }: { name: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-col gap-1.5" role="radiogroup">
      {options.map((o) => (
        <label key={o.id} className="flex cursor-pointer items-center gap-2 text-body-sm text-neutral-800">
          <input type="radio" name={name} checked={value === o.id} onChange={() => onChange(o.id)} className="size-4 accent-neutral-900" />
          {o.label}
        </label>
      ))}
    </div>
  )
}

function ReviewPanel({ session, onSave }: { session: UtSession; onSave: (r: UtReview) => Promise<void> }) {
  const saved = session.review
  const [draft, setDraft] = useState<UtReview>(saved ?? suggestReview(session))
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const set = (patch: Partial<UtReview>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setState('idle')
  }

  const save = async () => {
    setState('saving')
    try {
      await onSave(draft)
      setState('saved')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-neutral-50 p-4 shadow-[0_0_8px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-body-md font-semibold text-neutral-900">로그로 확인된 사실</h3>
        <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-1 text-body-sm">
          <dt className="text-neutral-500">상태</dt>
          <dd className="text-neutral-800">{UT_STATUS_LABELS[session.status]}</dd>
          <dt className="text-neutral-500">마지막 단계</dt>
          <dd className="text-neutral-800">{session.last_screen ? screenLabel(session.last_screen) : '—'}</dd>
          <dt className="text-neutral-500">마지막 행동</dt>
          <dd className="text-neutral-800">{session.last_activity ? activityLabel(session.last_activity) : '—'}</dd>
          <dt className="text-neutral-500">오류</dt>
          <dd className="text-neutral-800">{formatCount(session.system_errors)}회</dd>
          <dt className="text-neutral-500">반복 탐색</dt>
          <dd className="text-neutral-800">{formatCount(session.repeat_opens)}회</dd>
        </dl>
      </div>

      <div className="flex flex-col gap-4 border-t border-neutral-200 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-body-md font-semibold text-neutral-900">관리자 검토</h3>
          {!saved && state !== 'saved' && <span className="text-caption-sm text-neutral-500">자동 제안 — 확인 후 저장하세요</span>}
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-body-sm text-neutral-600">문제 유형</legend>
          <Radio name={`issue-${session.session_id}`} value={draft.issue_type} options={ISSUE_TYPES} onChange={(v) => set({ issue_type: v })} />
        </fieldset>
        <label className="flex flex-col gap-1.5 text-body-sm text-neutral-600">
          원인 분류
          <select
            value={draft.reason}
            onChange={(e) => set({ reason: e.target.value })}
            className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-body-md text-neutral-900 focus:border-green-700 focus:outline-none"
          >
            {/* 저장된 값이 현재 목록에 없으면(목록이 바뀐 경우) 그대로 보여준다 */}
            {!REASONS.some((r) => r.id === draft.reason) && <option value={draft.reason}>{reasonLabel(draft.reason)}</option>}
            {REASONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-body-sm text-neutral-600">분석 근거</legend>
          <Radio name={`evidence-${session.session_id}`} value={draft.evidence} options={EVIDENCE} onChange={(v) => set({ evidence: v })} />
          {isPresumed(draft) && <p className="text-caption-sm text-neutral-600">근거가 로그뿐이라 이 원인은 "추정"으로 표시돼요.</p>}
        </fieldset>
        <label className="flex flex-col gap-1.5 text-body-sm text-neutral-600">
          관리자 메모
          <textarea
            value={draft.note}
            maxLength={4000}
            rows={4}
            onChange={(e) => set({ note: e.target.value })}
            placeholder="관찰된 행동, 원인 판단의 근거, 개선 제안"
            className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-body-md text-neutral-900 focus:border-green-700 focus:outline-none"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={state === 'saving'}
            onClick={() => void save()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-body-sm font-semibold text-neutral-50 hover:bg-neutral-800 disabled:bg-neutral-400"
          >
            {state === 'saving' ? '저장 중…' : '검토 저장'}
          </button>
          {state === 'saved' && <span className="text-body-sm text-green-900">저장했어요</span>}
          {state === 'error' && (
            <span role="alert" className="text-body-sm text-error-300">
              저장하지 못했어요. 다시 시도해주세요.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
