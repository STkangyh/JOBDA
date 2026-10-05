import type { CloseHow, ViewKind, ViewName } from './views'

export type Flow = 'explore' | 's1' | 's2'

export interface AnalyticsEvent {
  visit_id: string
  session_id: string | null
  flow: Flow
  screen: string | null
  view: string | null
  view_path: string | null
  name: string
  props: Record<string, unknown>
  seq: number
  client_ts: string
  env: 'prod' | 'dev'
}

// 채팅 원문 — 백엔드 레포는 DB를 쓰지 않는 규칙이라(girugi CLAUDE.md 규칙 2) 프론트가 응답을
// 받은 뒤 직접 저장한다. events의 ask 이벤트와 message_id로 1:1 연결된다.
export interface ChatLogInput {
  message_id: string
  persona: string
  message: string
  reply: string | null
  intent: string | null
  disclose: string[] | null
  status: 'ok' | 'llm_error'
  latency_ms: number | null
}

export interface ChatLogRow extends ChatLogInput {
  visit_id: string
  session_id: string | null
  flow: Flow
  client_ts: string
  env: 'prod' | 'dev'
}

export type Table = 'events' | 'chat_logs'

// true면 전송 성공. false/throw면 큐 앞으로 되돌려 다음 주기에 다시 보낸다.
export type Transport = (table: Table, rows: AnalyticsEvent[] | ChatLogRow[], opts: { keepalive: boolean }) => Promise<boolean>

export const ANALYTICS_ENABLED = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

export const FLUSH_INTERVAL_MS = 5_000
export const HEARTBEAT_MS = 30_000
export const MODAL_HEARTBEAT_MS = 10_000
export const VISIT_IDLE_MS = 30 * 60_000
const MAX_QUEUE = 1_000
// keepalive 요청은 브라우저가 본문 합계 64KB로 제한하므로 닫히는 순간엔 작게 나눠 보낸다.
// 채팅 행은 AI 답변 원문이 들어 있어 이벤트보다 훨씬 커서 더 작게 자른다.
const BATCH_SIZE: Record<Table, { normal: number; keepalive: number }> = {
  events: { normal: 200, keepalive: 40 },
  chat_logs: { normal: 50, keepalive: 10 },
}
const VISIT_KEY = 'jobda-visit'

// 하트비트·탭 숨김/표시·뷰 열고 닫기는 사용자의 "행동"이 아니다 — 반송률과 30분 유휴 판정에서 뺀다.
export const PASSIVE_EVENTS = new Set(['heartbeat', 'visit_hide', 'visit_show', 'screen_view', 'view_open', 'view_close'])

interface OpenView {
  id: number
  kind: ViewKind
  name: ViewName
  openedAt: number
  closed: boolean
}

interface State {
  transport: Transport | null
  queue: AnalyticsEvent[]
  chatQueue: ChatLogRow[]
  seq: number
  flow: Flow
  sessionId: string | null
  screen: string | null
  nextScreenVia: string | null
  views: OpenView[]
  viewSeq: number
  visitId: string | null
  lastActive: number
  hidden: boolean
  flushing: boolean
  flushTimer: ReturnType<typeof setInterval> | null
  heartbeatTimer: ReturnType<typeof setTimeout> | null
  cleanup: (() => void) | null
}

const fresh = (): State => ({
  transport: null,
  queue: [],
  chatQueue: [],
  seq: 0,
  flow: 'explore',
  sessionId: null,
  screen: null,
  nextScreenVia: null,
  views: [],
  viewSeq: 0,
  visitId: null,
  lastActive: 0,
  hidden: false,
  flushing: false,
  flushTimer: null,
  heartbeatTimer: null,
  cleanup: null,
})

let s = fresh()

const env: 'prod' | 'dev' = import.meta.env.PROD ? 'prod' : 'dev'

function readVisit(): { id: string; lastActive: number } | null {
  try {
    const raw = sessionStorage.getItem(VISIT_KEY)
    return raw ? (JSON.parse(raw) as { id: string; lastActive: number }) : null
  } catch {
    return null
  }
}

function writeVisit() {
  try {
    sessionStorage.setItem(VISIT_KEY, JSON.stringify({ id: s.visitId, lastActive: s.lastActive }))
  } catch {
    // 저장소 접근이 막힌 환경(일부 사생활 보호 모드)에서도 메모리 값으로 계속 동작한다.
  }
}

// 방문 = 탭 하나에서 30분 넘게 아무 행동이 없을 때까지. 끊겼다 돌아오면 새 방문으로 보고,
// 이탈률이 "방문의 마지막 화면"으로 계산되므로 새 방문의 첫 화면을 다시 기록한다.
function ensureVisit(now: number) {
  if (s.visitId && now - s.lastActive <= VISIT_IDLE_MS) return
  const stored = s.visitId ? null : readVisit()
  if (stored && now - stored.lastActive <= VISIT_IDLE_MS) {
    s.visitId = stored.id
    s.lastActive = stored.lastActive
    return
  }
  const resumed = s.visitId !== null
  s.visitId = crypto.randomUUID()
  s.lastActive = now
  writeVisit()
  if (resumed && s.screen) enqueue('screen_view', { resumed: true }, now)
}

function touch(now: number) {
  s.lastActive = now
  writeVisit()
}

// 나란히 열린 뷰(예: 메신저 탭 + 시방서 패널)는 열린 순서와 상관없이 같은 경로가 나와야 SQL에서
// 같은 상태로 묶인다 — 종류(패널 → 탭 → 드로어 → 모달) 다음 이름 순으로 고정 정렬한다.
const KIND_ORDER: Record<ViewKind, number> = { panel: 0, tab: 1, drawer: 2, modal: 3 }

function orderedViews() {
  return [...s.views].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.name.localeCompare(b.name))
}

function viewPath() {
  return s.views.length ? orderedViews().map((v) => `${v.kind}:${v.name}`).join(' > ') : null
}

function enqueue(name: string, props: Record<string, unknown>, now: number) {
  s.seq += 1
  s.queue.push({
    visit_id: s.visitId!,
    session_id: s.sessionId,
    flow: s.flow,
    screen: s.screen,
    view: orderedViews().at(-1)?.name ?? null, // 가장 세밀한 뷰(모달 > 드로어 > 탭 > 패널)
    view_path: viewPath(),
    name,
    props,
    seq: s.seq,
    client_ts: new Date(now).toISOString(),
    env,
  })
  if (s.queue.length > MAX_QUEUE) s.queue.splice(0, s.queue.length - MAX_QUEUE)
}

export function track(name: string, props: Record<string, unknown> = {}) {
  if (!s.transport) return
  const now = Date.now()
  ensureVisit(now)
  enqueue(name, props, now)
  if (!PASSIVE_EVENTS.has(name)) touch(now)
}

export function logChat(input: ChatLogInput) {
  if (!s.transport) return
  const now = Date.now()
  ensureVisit(now)
  s.chatQueue.push({ ...input, visit_id: s.visitId!, session_id: s.sessionId, flow: s.flow, client_ts: new Date(now).toISOString(), env })
  if (s.chatQueue.length > MAX_QUEUE) s.chatQueue.splice(0, s.chatQueue.length - MAX_QUEUE)
  touch(now)
}

export function setContext(flow: Flow, sessionId: string | null) {
  s.flow = flow
  s.sessionId = sessionId
}

export function setScreen(screen: string) {
  if (screen === s.screen) return
  // 다음 화면 코드가 아직 로딩 중이면 이전 화면이 잠깐 마운트된 채로 남아서, 그 뷰의 닫힘이
  // 새 화면 소속으로 기록된다 — 화면이 바뀌는 시점에 이전 화면의 뷰를 먼저 닫아 순서를 맞춘다.
  for (const v of [...s.views].reverse()) closeView(v, 'navigate')
  s.screen = screen
  const via = s.nextScreenVia
  s.nextScreenVia = null
  track('screen_view', via ? { via } : {})
}

// 개발용 단계 이동 버튼(StageJumper)처럼 실제 사용자 흐름이 아닌 이동을 표시 — 분석에서 걸러낸다.
export function markNextScreenVia(via: string) {
  s.nextScreenVia = via
}

export function openView(kind: ViewKind, name: ViewName): (how: CloseHow) => void {
  const view: OpenView = { id: ++s.viewSeq, kind, name, openedAt: Date.now(), closed: false }
  s.views.push(view)
  track('view_open', { kind, view: name })
  if (kind === 'modal') scheduleHeartbeat()
  return (how: CloseHow) => closeView(view, how)
}

function closeView(view: OpenView, how: CloseHow) {
  if (view.closed) return
  view.closed = true
  track('view_close', { kind: view.kind, view: view.name, how, duration_ms: Date.now() - view.openedAt })
  s.views = s.views.filter((v) => v.id !== view.id)
  if (view.kind === 'modal') scheduleHeartbeat()
}

// 모달은 열려 있는 시간이 짧아서 그 안에서 이탈하면 30초 간격으로는 체류 시간 오차가 크다 —
// 모달이 하나라도 열려 있는 동안만 10초로 촘촘하게 보낸다.
export function currentHeartbeatMs() {
  return s.views.some((v) => v.kind === 'modal') ? MODAL_HEARTBEAT_MS : HEARTBEAT_MS
}

function scheduleHeartbeat() {
  if (s.heartbeatTimer) clearTimeout(s.heartbeatTimer)
  s.heartbeatTimer = null
  if (!s.transport || s.hidden) return
  s.heartbeatTimer = setTimeout(() => {
    // 30분 넘게 아무 행동이 없으면 화면만 켜둔 상태로 보고 하트비트를 멈춘다(끝없이 이어지는 방문 방지).
    if (Date.now() - s.lastActive <= VISIT_IDLE_MS) track('heartbeat')
    scheduleHeartbeat()
  }, currentHeartbeatMs())
}

async function flushTable<T extends AnalyticsEvent | ChatLogRow>(table: Table, queue: T[], keepalive: boolean) {
  const size = BATCH_SIZE[table][keepalive ? 'keepalive' : 'normal']
  while (queue.length > 0 && s.transport) {
    const batch = queue.splice(0, size)
    let ok = false
    try {
      ok = await s.transport(table, batch as AnalyticsEvent[] | ChatLogRow[], { keepalive })
    } catch {
      ok = false
    }
    if (!ok) {
      queue.unshift(...batch)
      return
    }
  }
}

export async function flush({ keepalive = false } = {}) {
  if (!s.transport || s.flushing || (s.queue.length === 0 && s.chatQueue.length === 0)) return
  s.flushing = true
  try {
    await flushTable('events', s.queue, keepalive)
    await flushTable('chat_logs', s.chatQueue, keepalive)
  } finally {
    s.flushing = false
  }
}

function onVisibility() {
  if (document.visibilityState === 'hidden') {
    if (s.hidden) return
    s.hidden = true
    track('visit_hide')
    scheduleHeartbeat()
    void flush({ keepalive: true })
  } else {
    if (!s.hidden) return
    s.hidden = false
    track('visit_show')
    scheduleHeartbeat()
  }
}

function onPageHide() {
  if (!s.hidden) {
    s.hidden = true
    track('visit_hide')
  }
  void flush({ keepalive: true })
}

function onUserInput() {
  if (s.visitId) touch(Date.now())
}

// main.tsx는 첫 렌더 뒤에 비동기로 분석을 켠다 — 그 사이 앱이 이미 정해둔 화면·흐름·열린 뷰는
// 지우지 않고, 시작 전이라 버려졌던 screen_view/view_open을 지금 다시 기록한다.
export function startAnalytics(transport: Transport): () => void {
  stopTransport()
  s.transport = transport
  s.hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden'
  const now = Date.now()
  ensureVisit(now)
  if (s.screen) enqueue('screen_view', {}, now)
  s.views.forEach((v) => enqueue('view_open', { kind: v.kind, view: v.name }, now))
  s.flushTimer = setInterval(() => void flush(), FLUSH_INTERVAL_MS)
  scheduleHeartbeat()
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', onPageHide)
  window.addEventListener('pointerdown', onUserInput, { passive: true })
  window.addEventListener('keydown', onUserInput, { passive: true })
  s.cleanup = () => {
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('pagehide', onPageHide)
    window.removeEventListener('pointerdown', onUserInput)
    window.removeEventListener('keydown', onUserInput)
  }
  return stopTransport
}

function stopTransport() {
  if (s.flushTimer) clearInterval(s.flushTimer)
  if (s.heartbeatTimer) clearTimeout(s.heartbeatTimer)
  s.cleanup?.()
  Object.assign(s, { transport: null, queue: [], chatQueue: [], flushing: false, flushTimer: null, heartbeatTimer: null, cleanup: null })
}

export function stopAnalytics() {
  stopTransport()
  s = fresh()
}

export const __testing = {
  queue: () => s.queue,
  chatQueue: () => s.chatQueue,
  visitId: () => s.visitId,
}
