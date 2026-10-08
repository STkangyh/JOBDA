import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  FLUSH_INTERVAL_MS,
  HEARTBEAT_IDLE_MS,
  HEARTBEAT_MS,
  MODAL_HEARTBEAT_MS,
  VISIT_IDLE_MS,
  __testing,
  markNextScreenVia,
  openView,
  setContext,
  setScreen,
  startAnalytics,
  stopAnalytics,
  track,
  logChat,
  type AnalyticsEvent,
  type ChatLogRow,
  type Table,
} from './analytics'
import type { ViewName } from './views'
import { captureParticipant, currentParticipant } from './participant'

let sent: AnalyticsEvent[]
let chats: ChatLogRow[]
let calls: { table: Table; count: number; keepalive: boolean }[]
let failNext = false
let visibility: DocumentVisibilityState = 'visible'

const transport = vi.fn(async (table: Table, rows: AnalyticsEvent[] | ChatLogRow[], opts: { keepalive: boolean }) => {
  calls.push({ table, count: rows.length, keepalive: opts.keepalive })
  if (failNext) {
    failNext = false
    return false
  }
  if (table === 'events') sent.push(...(rows as AnalyticsEvent[]))
  else chats.push(...(rows as ChatLogRow[]))
  return true
})

const names = () => sent.map((e) => e.name)
const flushTick = async () => {
  await vi.advanceTimersByTimeAsync(FLUSH_INTERVAL_MS)
}
const setVisibility = (v: DocumentVisibilityState) => {
  visibility = v
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  vi.useFakeTimers()
  sent = []
  chats = []
  calls = []
  failNext = false
  visibility = 'visible'
  sessionStorage.clear()
  transport.mockClear()
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
})

afterEach(() => {
  stopAnalytics()
  vi.useRealTimers()
})

describe('analytics core', () => {
  it('tags every event with the user-test participant code from the ?ut= link, and ?ut=off clears it', async () => {
    captureParticipant('?ut=P07')
    startAnalytics(transport)
    setScreen('session1/brief')
    track('ask')
    expect(__testing.queue().map((e) => e.props.ut)).toEqual(['P07', 'P07'])
    stopAnalytics()

    captureParticipant('?ut=off')
    startAnalytics(transport)
    setScreen('session1/brief')
    expect(__testing.queue()[0].props).not.toHaveProperty('ut')
    stopAnalytics()

    // 코드 형식이 아니면 받지 않는다(주소에 섞인 다른 값이 기록에 들어가지 않게)
    captureParticipant('?ut=<script>')
    expect(currentParticipant()).toBeNull()
  })

  it('does nothing until started (no env → analytics off)', async () => {
    track('click')
    const close = openView('tab', 'messenger:senior')
    close('switch')
    expect(__testing.queue()).toHaveLength(0)
  })

  it('stamps every event with visit, flow, session, screen and an increasing seq, and batches every 5s', async () => {
    startAnalytics(transport)
    setContext('s2', 'session-1')
    setScreen('session2/brief')
    track('submit', { target: 'draft' })

    expect(transport).not.toHaveBeenCalled()
    await flushTick()

    expect(transport).toHaveBeenCalledTimes(1)
    expect(sent.map((e) => [e.name, e.seq])).toEqual([
      ['screen_view', 1],
      ['submit', 2],
    ])
    const e = sent[1]
    expect(e).toMatchObject({ flow: 's2', session_id: 'session-1', screen: 'session2/brief', env: 'dev', props: { target: 'draft' } })
    expect(e.visit_id).toBe(sent[0].visit_id)
    expect(Date.parse(e.client_ts)).not.toBeNaN()
  })

  it('emits screen_view only when the screen changes, and tags dev-tool jumps once', async () => {
    startAnalytics(transport)
    setScreen('session2/brief')
    setScreen('session2/brief')
    markNextScreenVia('jumper')
    setScreen('session2/materials')
    setScreen('session2/workspace')
    await flushTick()

    expect(sent.filter((e) => e.name === 'screen_view').map((e) => [e.screen, e.props.via])).toEqual([
      ['session2/brief', undefined],
      ['session2/materials', 'jumper'],
      ['session2/workspace', undefined],
    ])
  })

  it('attaches the innermost view and full view path, and records how/when a view closed', async () => {
    startAnalytics(transport)
    setScreen('session2/workspace')
    const closeTab = openView('tab', 'messenger:engineering')
    const closeModal = openView('modal', 'round:1' as ViewName)
    track('click')
    vi.advanceTimersByTime(4_000)
    closeModal('esc')
    closeTab('unmount')
    track('after_close')
    await flushTick()

    const click = sent.find((e) => e.name === 'click')!
    expect(click.view).toBe('round:1')
    expect(click.view_path).toBe('tab:messenger:engineering > modal:round:1')
    const modalOpen = sent.find((e) => e.name === 'view_open' && e.props.kind === 'modal')!
    expect(modalOpen.view_path).toBe('tab:messenger:engineering > modal:round:1')
    const modalClose = sent.find((e) => e.name === 'view_close' && e.props.kind === 'modal')!
    expect(modalClose.props).toMatchObject({ how: 'esc', duration_ms: 4_000 })
    const tabClose = sent.find((e) => e.name === 'view_close' && e.props.kind === 'tab')!
    expect(tabClose.view_path).toBe('tab:messenger:engineering')
    expect(sent.at(-1)).toMatchObject({ name: 'after_close', view: null, view_path: null })
  })

  it('beats every 30s, every 10s while a modal is open, and back to 30s after it closes', async () => {
    startAnalytics(transport)
    setScreen('/')
    const beats = () => __testing.queue().filter((e) => e.name === 'heartbeat').length

    vi.advanceTimersByTime(HEARTBEAT_MS)
    expect(beats()).toBe(1)

    const close = openView('modal', 'round:2' as ViewName)
    vi.advanceTimersByTime(MODAL_HEARTBEAT_MS * 3)
    expect(beats()).toBe(4)

    close('button')
    vi.advanceTimersByTime(MODAL_HEARTBEAT_MS * 2)
    expect(beats()).toBe(4)
    vi.advanceTimersByTime(HEARTBEAT_MS - MODAL_HEARTBEAT_MS * 2)
    expect(beats()).toBe(5)
  })

  it('on hide: records visit_hide, sends right away with keepalive, and pauses heartbeats until shown again', async () => {
    startAnalytics(transport)
    setScreen('/explore/job')

    setVisibility('hidden')
    await vi.advanceTimersByTimeAsync(0)
    expect(calls.at(-1)).toMatchObject({ keepalive: true })
    expect(names()).toContain('visit_hide')

    await vi.advanceTimersByTimeAsync(HEARTBEAT_MS * 3)
    expect(names()).not.toContain('heartbeat')

    setVisibility('visible')
    await vi.advanceTimersByTimeAsync(HEARTBEAT_MS)
    await flushTick()
    expect(names()).toEqual(expect.arrayContaining(['visit_show', 'heartbeat']))
  })

  it('keepalive sends are chunked small enough for the browser 64KB limit', async () => {
    startAnalytics(transport)
    setScreen('/')
    for (let i = 0; i < 100; i++) track('click', { i })
    window.dispatchEvent(new Event('pagehide'))
    await vi.advanceTimersByTimeAsync(0)
    expect(calls.every((c) => c.keepalive && c.count <= 40)).toBe(true)
    expect(sent).toHaveLength(102)
  })

  it('starts a new visit after 30 minutes without activity and re-records the current screen', async () => {
    startAnalytics(transport)
    setScreen('session2/vendor_compare')
    track('click')
    await flushTick()
    const firstVisit = sent[0].visit_id

    await vi.advanceTimersByTimeAsync(VISIT_IDLE_MS + 60_000)
    track('click')
    await flushTick()

    const after = sent.filter((e) => e.visit_id !== firstVisit)
    expect(after.map((e) => e.name)).toEqual(['screen_view', 'click'])
    expect(after[0]).toMatchObject({ screen: 'session2/vendor_compare', props: { resumed: true } })
    // 자리를 비운 뒤 5분이 지나면 하트비트를 멈춰서, 탭만 켜둔 30분 동안 60개가 아니라 10개만 쌓인다.
    const idleBeats = sent.filter((e) => e.visit_id === firstVisit && e.name === 'heartbeat')
    expect(idleBeats).toHaveLength(HEARTBEAT_IDLE_MS / HEARTBEAT_MS)
  })

  it('skips heartbeats while other events keep arriving — any event already proves the user is there', async () => {
    startAnalytics(transport)
    setScreen('session2/workspace')
    const beats = () => __testing.queue().filter((e) => e.name === 'heartbeat').length
    for (let i = 0; i < 6; i++) {
      vi.advanceTimersByTime(HEARTBEAT_MS - 5_000)
      track('ask')
    }
    expect(beats()).toBe(0)
    vi.advanceTimersByTime(HEARTBEAT_MS)
    expect(beats()).toBe(1)
  })

  it('stops beating after 5 minutes without input and resumes on the next pointer, key, or scroll', async () => {
    startAnalytics(transport)
    setScreen('session2/materials')
    const beats = () => __testing.queue().filter((e) => e.name === 'heartbeat').length

    vi.advanceTimersByTime(HEARTBEAT_IDLE_MS + HEARTBEAT_MS * 4)
    expect(beats()).toBe(HEARTBEAT_IDLE_MS / HEARTBEAT_MS)

    window.dispatchEvent(new Event('wheel'))
    vi.advanceTimersByTime(HEARTBEAT_MS)
    expect(beats()).toBe(HEARTBEAT_IDLE_MS / HEARTBEAT_MS + 1)
  })

  it('keeps events and retries on the next tick when sending fails', async () => {
    startAnalytics(transport)
    setScreen('/')
    track('click')
    failNext = true
    await flushTick()
    expect(sent).toHaveLength(0)

    await flushTick()
    expect(names()).toEqual(['screen_view', 'click'])
  })

  it('keeps the screen/flow/views the app set before analytics started, and replays them', async () => {
    // main.tsx는 첫 렌더 이후에 비동기로 분석을 켠다 — 그 전에 앱이 정해둔 상태가 지워지면 안 된다.
    setContext('s2', 'session-9')
    setScreen('session2/materials')
    openView('panel', 'materials_doc:spec_form')
    startAnalytics(transport)
    track('click')
    await flushTick()

    expect(sent.map((e) => [e.name, e.screen, e.flow])).toEqual([
      ['screen_view', 'session2/materials', 's2'],
      ['view_open', 'session2/materials', 's2'],
      ['click', 'session2/materials', 's2'],
    ])
    expect(sent[2]).toMatchObject({ session_id: 'session-9', view: 'materials_doc:spec_form' })
  })

  it('closes the previous screen’s views before recording the new screen (next screen still loading)', async () => {
    startAnalytics(transport)
    setScreen('session2/materials')
    const closeLate = openView('panel', 'materials_doc:limit_sample')
    setScreen('session2/workspace')
    closeLate('unmount') // 이전 화면 컴포넌트가 늦게 언마운트돼도 중복 기록되지 않는다
    await flushTick()

    expect(sent.map((e) => [e.name, e.screen, e.props.how])).toEqual([
      ['screen_view', 'session2/materials', undefined],
      ['view_open', 'session2/materials', undefined],
      ['view_close', 'session2/materials', 'navigate'],
      ['screen_view', 'session2/workspace', undefined],
    ])
    expect(sent[3].view_path).toBeNull()
  })

  it('gives side-by-side views the same path regardless of which opened first', async () => {
    startAnalytics(transport)
    setScreen('session2/workspace')
    const a1 = openView('tab', 'messenger:senior')
    const a2 = openView('panel', 'workspace_mode:draft')
    track('first')
    a1('switch')
    const a3 = openView('tab', 'messenger:senior')
    track('second')
    a2('unmount')
    a3('unmount')
    await flushTick()

    const paths = sent.filter((e) => e.name === 'first' || e.name === 'second').map((e) => [e.view_path, e.view])
    expect(paths).toEqual([
      ['panel:workspace_mode:draft > tab:messenger:senior', 'messenger:senior'],
      ['panel:workspace_mode:draft > tab:messenger:senior', 'messenger:senior'],
    ])
  })

  it('queues raw chat rows separately (chat_logs), stamped with the same visit/session/flow', async () => {
    startAnalytics(transport)
    setContext('s2', 'session-2')
    setScreen('session2/workspace')
    logChat({ message_id: 'm-1', persona: 'engineering', message: '목재 밴딩 되나요?', reply: '안 됩니다', intent: 'manufacturing_capability', disclose: ['inhouse_capability'], status: 'ok', latency_ms: 812 })
    await flushTick()

    expect(calls.map((c) => c.table)).toEqual(['events', 'chat_logs'])
    expect(chats).toHaveLength(1)
    expect(chats[0]).toMatchObject({ message: '목재 밴딩 되나요?', reply: '안 됩니다', flow: 's2', session_id: 'session-2', visit_id: sent[0].visit_id, env: 'dev' })
    expect(sent.some((e) => JSON.stringify(e).includes('목재 밴딩'))).toBe(false)
  })

  it('sends chat rows in smaller keepalive chunks than events (answers are large)', async () => {
    startAnalytics(transport)
    setScreen('/')
    for (let i = 0; i < 25; i++) logChat({ message_id: `m-${i}`, persona: 'senior', message: 'q', reply: 'a'.repeat(1500), intent: null, disclose: null, status: 'ok', latency_ms: 1 })
    window.dispatchEvent(new Event('pagehide'))
    await vi.advanceTimersByTimeAsync(0)
    const chatCalls = calls.filter((c) => c.table === 'chat_logs')
    expect(chatCalls.every((c) => c.keepalive && c.count <= 10)).toBe(true)
    expect(chats).toHaveLength(25)
  })

  it('reuses the visit id from sessionStorage after a reload in the same tab', async () => {
    startAnalytics(transport)
    setScreen('/')
    const visit = __testing.visitId()
    stopAnalytics()

    startAnalytics(transport)
    expect(__testing.visitId()).toBe(visit)
  })
})
