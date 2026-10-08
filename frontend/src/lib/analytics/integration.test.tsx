import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { useState } from 'react'
import App from '../../App'
import { useSession } from '../../store/session'
import * as client from '../../api/client'
import { flush, startAnalytics, stopAnalytics, type AnalyticsEvent, type ChatLogRow, type Table } from './analytics'
import { useSession1 } from '../../store/session1'
import { useTrackView } from './useTrackView'
import type { ViewName } from './views'

vi.mock('../../api/client')
const mockedChat = vi.mocked(client.chat)

let sent: AnalyticsEvent[]
let chats: ChatLogRow[]
const transport = async (table: Table, rows: AnalyticsEvent[] | ChatLogRow[]) => {
  if (table === 'events') sent.push(...(rows as AnalyticsEvent[]))
  else chats.push(...(rows as ChatLogRow[]))
  return true
}
const drain = async () => {
  await act(async () => {
    await flush()
  })
  return sent
}
const byName = (name: string) => sent.filter((e) => e.name === name)

beforeEach(() => {
  sent = []
  chats = []
  sessionStorage.clear()
  useSession.getState().resetSession()
  mockedChat.mockReset()
  startAnalytics(transport)
})

afterEach(() => {
  stopAnalytics()
})

function Tab({ name }: { name: ViewName }) {
  useTrackView({ kind: 'tab', name })
  return null
}

function Modal() {
  const [open, setOpen] = useState(true)
  const markClose = useTrackView({ kind: 'modal', name: 'round:9' as ViewName, open })
  return (
    <button
      onClick={() => {
        markClose('esc')
        setOpen(false)
      }}
    >
      close
    </button>
  )
}

describe('useTrackView', () => {
  it('closes the previous tab as "switch" on change and as "unmount" when the screen goes away', async () => {
    const { rerender, unmount } = render(<Tab name="messenger:senior" />)
    rerender(<Tab name="messenger:engineering" />)
    unmount()
    await drain()

    expect(byName('view_open').map((e) => e.props.view)).toEqual(['messenger:senior', 'messenger:engineering'])
    expect(byName('view_close').map((e) => [e.props.view, e.props.how])).toEqual([
      ['messenger:senior', 'switch'],
      ['messenger:engineering', 'unmount'],
    ])
  })

  it('records the close reason a modal reports (e.g. ESC)', async () => {
    const user = userEvent.setup()
    render(<Modal />)
    await user.click(screen.getByRole('button', { name: 'close' }))
    await drain()
    expect(byName('view_close')[0].props).toMatchObject({ kind: 'modal', view: 'round:9', how: 'esc' })
  })
})

describe('screen tracking in the real app', () => {
  it('names session screens by route + stage, and tags dev stage-jumper moves', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/session2']}>
        <App />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByText('🧭 단계 이동')).toBeInTheDocument())

    await user.click(screen.getByText('🧭 단계 이동'))
    await user.click(screen.getByRole('button', { name: '자료탐색' }))
    await screen.findByText('시방서 양식 폴더')
    await drain()

    const views = byName('screen_view')
    expect(views.map((e) => [e.screen, e.props.via])).toEqual([
      ['session2/brief', undefined],
      ['session2/materials', 'jumper'],
    ])
    expect(views[0]).toMatchObject({ flow: 's2', session_id: useSession.getState().sessionId })
    // 자료탐색 화면이 기본 문서를 패널 뷰로 연다 → 이후 이벤트에 자동으로 붙는다.
    expect(byName('view_open').map((e) => e.props.view)).toContain('materials_doc:spec_form')
  })
})

describe('screen tracking for unknown addresses', () => {
  it('records an unregistered path as not_found, never the typed path itself', async () => {
    render(
      <MemoryRouter initialEntries={['/someone@example.com']}>
        <App />
      </MemoryRouter>,
    )
    await drain()
    expect(byName('screen_view').map((e) => e.screen)).toEqual(['not_found'])
    expect(JSON.stringify(sent)).not.toContain('example.com')
  })
})

describe('store events', () => {
  it('sends each chat as an "ask" with a message_id and length — never the message text', async () => {
    mockedChat.mockResolvedValueOnce({ reply: '네', intent: 'other', disclose: [] })
    await act(async () => {
      await useSession.getState().sendMessage('engineering', '목재 밴딩 가능한가요?')
    })
    await drain()

    const ask = byName('ask')[0]
    expect(ask.props).toMatchObject({ actor: 'engineering', intent: 'other', length: '목재 밴딩 가능한가요?'.length })
    expect(ask.props.message_id).toMatch(/^[0-9a-f-]{36}$/)
    expect(JSON.stringify(sent)).not.toContain('목재 밴딩')
  })

  it('records a chat_error with the same message_id when the chat request fails', async () => {
    mockedChat.mockRejectedValueOnce(new Error('503'))
    await act(async () => {
      await expect(useSession.getState().sendMessage('senior', '안녕하세요')).rejects.toThrow()
    })
    await drain()
    expect(byName('chat_error')[0].props).toMatchObject({ actor: 'senior', length: 5 })
    expect(byName('ask')).toHaveLength(0)
    // 실패한 질문도 원문이 남아야 "AI가 못 받은 질문"을 볼 수 있다.
    expect(chats).toHaveLength(1)
    expect(chats[0]).toMatchObject({ persona: 'senior', message: '안녕하세요', reply: null, status: 'llm_error' })
    expect(chats[0].message_id).toBe(byName('chat_error')[0].props.message_id)
  })

  it('stores the raw question and answer in chat_logs, linked to the ask event by message_id', async () => {
    mockedChat.mockResolvedValueOnce({ reply: '사내 공장은 목재 접합이 안 돼요.', intent: 'manufacturing_capability', disclose: ['inhouse_capability'] })
    await act(async () => {
      await useSession.getState().sendMessage('engineering', '목재 접합 가능한가요?')
    })
    await drain()

    expect(chats).toHaveLength(1)
    expect(chats[0]).toMatchObject({
      persona: 'engineering',
      message: '목재 접합 가능한가요?',
      reply: '사내 공장은 목재 접합이 안 돼요.',
      intent: 'manufacturing_capability',
      disclose: ['inhouse_capability'],
      status: 'ok',
    })
    expect(chats[0].latency_ms).toBeGreaterThanOrEqual(0)
    expect(chats[0].message_id).toBe(byName('ask')[0].props.message_id)
  })

  it('stores session1 questions too (scripted replies, but the questions are the signal)', async () => {
    act(() => {
      useSession1.getState().sendMessage('purchasing', '예산이 얼마인가요?')
    })
    await drain()
    expect(chats[0]).toMatchObject({ persona: 'purchasing', message: '예산이 얼마인가요?', status: 'ok' })
    expect(chats[0].reply).toEqual(expect.any(String))
    expect(chats[0].message_id).toBe(byName('ask')[0].props.message_id)
  })
})
