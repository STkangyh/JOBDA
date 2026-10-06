import type { ReactNode } from 'react'
import { DailyColumns, FunnelBars, Meter } from './charts'
import {
  CLOSE_LABELS,
  KIND_LABELS,
  PERIODS,
  actionLabel,
  fillDays,
  formatCount,
  formatDuration,
  formatPct,
  screenLabel,
  viewLabel,
  type AdminReport,
  type Period,
} from './report'

function Section({ title, caption, children, className = '' }: { title: string; caption?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`flex min-w-0 flex-col gap-4 rounded-xl bg-neutral-50 p-6 shadow-[0_0_8px_rgba(0,0,0,0.04)] ${className}`}>
      <div className="flex flex-col gap-1">
        <h2 className="text-title-md font-semibold text-neutral-900">{title}</h2>
        {caption && <p className="text-body-sm text-neutral-500">{caption}</p>}
      </div>
      {children}
    </section>
  )
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl bg-neutral-50 p-5 shadow-[0_0_8px_rgba(0,0,0,0.04)]">
      <span className="text-body-sm text-neutral-600">{label}</span>
      <span className="text-headline-lg font-semibold text-neutral-900">{value}</span>
      {hint && <span className="text-caption-sm text-neutral-500">{hint}</span>}
    </div>
  )
}

interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  numeric?: boolean
}

function DataTable<T>({ rows, columns, empty }: { rows: T[]; columns: Column<T>[]; empty: string }) {
  if (rows.length === 0) return <p className="py-6 text-center text-body-sm text-neutral-500">{empty}</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500">
            {columns.map((c) => (
              <th key={c.header} scope="col" className={`whitespace-nowrap px-3 py-2 font-medium ${c.numeric ? 'text-right' : 'text-left'}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-75">
              {columns.map((c) => (
                <td key={c.header} className={`whitespace-nowrap px-3 py-2.5 text-neutral-800 ${c.numeric ? 'text-right tabular-nums' : ''}`}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface Props {
  report: AdminReport
  period: Period
  onPeriod: (p: Period) => void
  loading: boolean
}

export function AdminDashboard({ report, period, onPeriod, loading }: Props) {
  const { overview } = report
  const completion = overview.sessions_started ? (overview.sessions_completed / overview.sessions_started) * 100 : null
  const daily = fillDays(report.daily, period)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="기간">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={period === p.id}
            onClick={() => onPeriod(p.id)}
            className={`rounded-full px-4 py-2 text-body-sm font-medium transition-colors ${
              period === p.id ? 'bg-neutral-900 text-neutral-50' : 'bg-neutral-50 text-neutral-700 shadow-[0_0_8px_rgba(0,0,0,0.04)] hover:bg-neutral-100'
            }`}
          >
            {p.label}
          </button>
        ))}
        {loading && <span className="ml-2 text-caption-sm text-neutral-500">불러오는 중…</span>}
      </div>

      {/* 다시 불러오는 동안 화면을 비우지 않고 흐리게만 — 레이아웃이 흔들리지 않게 */}
      <div className={`flex flex-col gap-6 transition-opacity ${loading ? 'opacity-50' : ''}`}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatTile label="방문" value={formatCount(overview.visits)} hint="탭 하나, 30분 무활동이면 새 방문" />
          <StatTile label="사용자" value={formatCount(overview.users)} hint="익명 브라우저 기준" />
          <StatTile label="체험 시작" value={formatCount(overview.sessions_started)} hint="세션1·2 브리프 도달" />
          <StatTile label="체험 완료" value={formatCount(overview.sessions_completed)} hint="리포트 생성까지" />
          <StatTile label="완료율" value={formatPct(completion == null ? null : Math.round(completion * 10) / 10)} hint="완료 ÷ 시작" />
        </div>

        <Section title="일별 방문" caption="막대에 마우스를 올리면 그날의 사용자·체험 수를 볼 수 있어요.">
          <DailyColumns rows={daily} />
          <details className="text-body-sm text-neutral-600">
            <summary className="cursor-pointer select-none">표로 보기</summary>
            <div className="mt-3">
              <DataTable
                rows={[...daily].reverse()}
                empty="데이터가 없어요."
                columns={[
                  { header: '날짜', cell: (r) => r.day },
                  { header: '방문', cell: (r) => formatCount(r.visits), numeric: true },
                  { header: '사용자', cell: (r) => formatCount(r.users), numeric: true },
                  { header: '체험 시작', cell: (r) => formatCount(r.sessions_started), numeric: true },
                  { header: '체험 완료', cell: (r) => formatCount(r.sessions_completed), numeric: true },
                ]}
              />
            </div>
          </details>
        </Section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Section title="세션2 퍼널" caption="브리프에 들어온 체험 중 각 단계까지 간 비율">
            <FunnelBars steps={report.funnel_s2} />
          </Section>
          <Section title="세션1 퍼널" caption="브리프에 들어온 체험 중 각 단계까지 간 비율">
            <FunnelBars steps={report.funnel_s1} />
          </Section>
        </div>

        <Section title="화면별 이탈률" caption="이탈률 = 그 화면이 방문의 마지막 화면이었던 비율">
          <DataTable
            rows={report.screens}
            empty="아직 화면 기록이 없어요."
            columns={[
              { header: '화면', cell: (r) => screenLabel(r.screen) },
              { header: '조회', cell: (r) => formatCount(r.views), numeric: true },
              { header: '이탈', cell: (r) => formatCount(r.exits), numeric: true },
              { header: '이탈률', cell: (r) => <Meter pct={r.exit_rate_pct} />, numeric: true },
              { header: '체류 시간(중앙값)', cell: (r) => formatDuration(r.median_duration_s), numeric: true },
            ]}
          />
        </Section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Section title="첫 화면별 반송률" caption="첫 화면 하나만 보고 아무 행동 없이 나간 방문">
            <DataTable
              rows={report.bounce}
              empty="아직 방문 기록이 없어요."
              columns={[
                { header: '첫 화면', cell: (r) => screenLabel(r.landing) },
                { header: '방문', cell: (r) => formatCount(r.visits), numeric: true },
                { header: '반송', cell: (r) => formatCount(r.bounces), numeric: true },
                { header: '반송률', cell: (r) => <Meter pct={r.bounce_rate_pct} />, numeric: true },
              ]}
            />
          </Section>
          <Section title="이탈 직전 행동" caption="체험을 끝내지 않고 떠난 방문의 마지막 행동 (상위 20)">
            <DataTable
              rows={report.exits}
              empty="아직 이탈 기록이 없어요."
              columns={[
                { header: '화면', cell: (r) => screenLabel(r.screen) },
                { header: '뷰', cell: (r) => viewLabel(r.view) },
                { header: '마지막 행동', cell: (r) => actionLabel(r.last_action) },
                { header: '방문', cell: (r) => formatCount(r.visits), numeric: true },
              ]}
            />
          </Section>
        </div>

        <Section title="화면 안 탭·패널·모달" caption="열어본 비율 = 그 화면에 온 방문 중 이 뷰를 연 비율">
          <DataTable
            rows={report.views}
            empty="아직 뷰 기록이 없어요."
            columns={[
              { header: '화면', cell: (r) => screenLabel(r.screen) },
              { header: '뷰', cell: (r) => viewLabel(r.view) },
              { header: '종류', cell: (r) => KIND_LABELS[r.kind] ?? r.kind },
              { header: '열람', cell: (r) => formatCount(r.opens), numeric: true },
              { header: '열어본 비율', cell: (r) => formatPct(r.open_rate_pct), numeric: true },
              { header: '체류(중앙값)', cell: (r) => formatDuration(r.median_duration_s), numeric: true },
              {
                header: '닫은 방식',
                cell: (r) =>
                  r.close_how
                    ? Object.entries(r.close_how)
                        .sort((a, b) => b[1] - a[1])
                        .map(([how, n]) => `${CLOSE_LABELS[how] ?? how} ${n}`)
                        .join(' · ')
                    : '—',
              },
              { header: '여기서 이탈', cell: (r) => formatCount(r.exits_in_view), numeric: true },
            ]}
          />
        </Section>
      </div>
    </div>
  )
}
