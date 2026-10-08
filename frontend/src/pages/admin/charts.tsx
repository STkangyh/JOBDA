import { useState } from 'react'
import { formatCount, formatPct, stageLabel, type DailyRow, type FunnelStep } from './report'

// 차트 마크 색 — 브랜드 green-800(#6b8552)은 채도가 낮아 "회색으로 읽힘" 검사에 걸려서, 같은 계열에서
// 밝기·채도·흰 배경 대비(3:1) 검사를 모두 통과하는 가장 가까운 단계로 골랐다(dataviz validate_palette).
const CHART_COLOR = '#5f8a3c'
const CHART_TRACK = '#e8f0e0'

function niceMax(max: number) {
  if (max <= 4) return 4
  const p = 10 ** Math.floor(Math.log10(max))
  return [1, 2, 5, 10].map((m) => m * p).find((v) => v >= max) ?? 10 * p
}

function dayLabel(day: string) {
  const [, m, d] = day.split('-').map(Number)
  return `${m}/${d}`
}

function longDayLabel(day: string) {
  const date = new Date(`${day}T00:00:00+09:00`)
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Seoul' })
}

export function DailyColumns({ rows }: { rows: DailyRow[] }) {
  const [active, setActive] = useState<number | null>(null)
  const top = niceMax(Math.max(0, ...rows.map((r) => r.visits)))
  const ticks = [top, top / 2, 0].filter((t) => Number.isInteger(t))
  const every = Math.ceil(rows.length / 8)
  const last = rows.length - 1

  return (
    <div className="flex gap-2">
      <div className="relative h-[180px] w-8 shrink-0 text-right text-caption-sm tabular-nums text-neutral-500">
        {ticks.map((t) => (
          <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${100 - (t / top) * 100}%` }}>
            {formatCount(t)}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-[180px]" onPointerLeave={() => setActive(null)}>
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 h-px bg-neutral-200" style={{ top: `${100 - (t / top) * 100}%` }} aria-hidden />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {rows.map((r, i) => {
              const h = (r.visits / top) * 100
              return (
                <button
                  key={r.day}
                  type="button"
                  aria-label={`${longDayLabel(r.day)} 방문 ${r.visits}`}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="relative flex h-full flex-1 items-end justify-center outline-none focus-visible:bg-neutral-100"
                >
                  {i === last && r.visits > 0 && (
                    <span
                      className="absolute -translate-y-full pb-1 text-caption-sm font-semibold tabular-nums text-neutral-800"
                      style={{ bottom: `${h}%` }}
                    >
                      {formatCount(r.visits)}
                    </span>
                  )}
                  <span
                    className="block w-full max-w-6 rounded-t-[4px] transition-opacity"
                    style={{
                      height: r.visits > 0 ? `max(${h}%, 2px)` : 0,
                      backgroundColor: CHART_COLOR,
                      opacity: active === null || active === i ? 1 : 0.45,
                    }}
                  />
                </button>
              )
            })}
          </div>
          {active !== null && (
            <div
              role="tooltip"
              className="pointer-events-none absolute top-0 z-10 w-max -translate-x-1/2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
              style={{ left: `${((active + 0.5) / rows.length) * 100}%` }}
            >
              <p className="mb-1 text-caption-sm text-neutral-500">{longDayLabel(rows[active].day)}</p>
              {(
                [
                  ['visits', '방문'],
                  ['users', '사용자'],
                  ['sessions_started', '체험 시작'],
                  ['sessions_completed', '체험 완료'],
                ] as const
              ).map(([key, label]) => (
                <p key={key} className="flex items-baseline gap-2 text-body-sm">
                  <strong className="tabular-nums text-neutral-900">{formatCount(rows[active][key])}</strong>
                  <span className="text-neutral-500">{label}</span>
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="mt-1.5 flex gap-[2px] text-caption-sm tabular-nums text-neutral-500">
          {rows.map((r, i) => (
            <span key={r.day} className="flex-1 text-center">
              {i === last || i % every === 0 ? dayLabel(r.day) : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function FunnelBars({ steps }: { steps: FunnelStep[] }) {
  const base = steps[0]?.sessions ?? 0
  // 이탈이 가장 큰 구간 하나만 짚어준다 — 모든 단계에 감소량을 붙이면 아무것도 안 읽힌다.
  let worst = -1
  let worstDrop = 0
  steps.forEach((s, i) => {
    const drop = i > 0 ? steps[i - 1].sessions - s.sessions : 0
    if (drop > worstDrop) {
      worstDrop = drop
      worst = i
    }
  })

  if (base === 0) return <p className="py-6 text-center text-body-sm text-neutral-500">아직 이 세션을 시작한 체험이 없어요.</p>

  return (
    <ol className="flex flex-col gap-2.5">
      {steps.map((s, i) => {
        // 분모보다 큰 단계가 와도(예전 집계 기준 데이터) 카드 밖으로 넘치지 않게 100%에서 자른다.
        const w = Math.min(100, (s.sessions / base) * 100)
        return (
          <li key={s.stage} className="grid grid-cols-[88px_minmax(0,1fr)_96px] items-center gap-3">
            <span className="truncate text-body-sm text-neutral-700">{stageLabel(s.stage)}</span>
            <span className="relative h-5">
              <span
                className="absolute inset-y-0 left-0 rounded-r-[4px]"
                style={{ width: s.sessions > 0 ? `max(${w}%, 2px)` : 0, backgroundColor: CHART_COLOR }}
              />
            </span>
            <span className="text-right text-body-sm tabular-nums">
              <span className="font-semibold text-neutral-900">{formatCount(s.sessions)}</span>
              <span className="text-neutral-500"> · {formatPct(s.pct_of_start)}</span>
            </span>
            {i === worst && (
              <span className="col-span-3 -mt-1 pl-[100px] text-caption-sm text-neutral-600">
                ↑ 직전 단계에서 {formatCount(worstDrop)}명 이탈 · 가장 큰 이탈 구간
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function Meter({ pct }: { pct: number | null }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative h-1.5 w-14 overflow-hidden rounded-full" style={{ backgroundColor: CHART_TRACK }}>
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, pct ?? 0)}%`, backgroundColor: CHART_COLOR }} />
      </span>
      <span className="w-12 text-right tabular-nums">{formatPct(pct)}</span>
    </span>
  )
}
