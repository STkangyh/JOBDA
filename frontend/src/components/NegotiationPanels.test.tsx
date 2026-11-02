import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Messenger } from './NegotiationPanels'
import { useSession } from '../store/session'
import * as client from '../api/client'
import type { ChatResponse } from '../types'

// apiChat is the only real network boundary here — mocking it lets these tests exercise the
// real store (sendMessage) + real component (Messenger) together, which is what actually broke
// before this session's fix: sendMessage rejecting with nothing catching it.
vi.mock('../api/client')
const mockedChat = vi.mocked(client.chat)

beforeEach(() => {
  useSession.getState().resetSession()
  mockedChat.mockReset()
})

describe('Messenger', () => {
  it('sends a message and renders the reply', async () => {
    mockedChat.mockResolvedValueOnce({ reply: '안녕하세요, 도와드릴게요.', intent: 'other', disclose: [] })
    const user = userEvent.setup()
    render(<Messenger defaultActive="senior" />)

    await user.type(screen.getByPlaceholderText('메시지를 입력하세요'), '테스트 메시지')
    await user.click(screen.getByRole('button', { name: '메시지 보내기' }))

    expect(screen.getByText('테스트 메시지')).toBeInTheDocument()
    expect(await screen.findByText('안녕하세요, 도와드릴게요.')).toBeInTheDocument()
  })

  it('clears the input immediately, before the reply arrives', async () => {
    mockedChat.mockImplementationOnce(() => new Promise(() => {})) // never resolves in this test
    const user = userEvent.setup()
    render(<Messenger defaultActive="senior" />)

    const input = screen.getByPlaceholderText('메시지를 입력하세요')
    await user.type(input, '전송 중 입력창')
    await user.click(screen.getByRole('button', { name: '메시지 보내기' }))

    expect(input).toHaveValue('')
  })

  it('shows the three-dot typing indicator while a reply is in flight', async () => {
    let resolveChat!: (v: ChatResponse) => void
    mockedChat.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveChat = resolve
        }),
    )
    const user = userEvent.setup()
    const { container } = render(<Messenger defaultActive="senior" />)

    await user.type(screen.getByPlaceholderText('메시지를 입력하세요'), '대기 확인')
    await user.click(screen.getByRole('button', { name: '메시지 보내기' }))

    expect(container.querySelectorAll('.animate-bounce')).toHaveLength(3)

    resolveChat({ reply: '응답 도착', intent: 'other', disclose: [] })

    await waitFor(() => expect(container.querySelectorAll('.animate-bounce')).toHaveLength(0))
  })

  it('shows a retry banner on failure, and a successful retry clears it and sends the same text', async () => {
    mockedChat.mockRejectedValueOnce(new Error('network error'))
    mockedChat.mockResolvedValueOnce({ reply: '재시도로 도착한 답변', intent: 'other', disclose: [] })
    const user = userEvent.setup()
    render(<Messenger defaultActive="senior" />)

    await user.type(screen.getByPlaceholderText('메시지를 입력하세요'), '실패할 메시지')
    await user.click(screen.getByRole('button', { name: '메시지 보내기' }))

    expect(await screen.findByText('메시지 전송에 실패했어요.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '재시도' }))

    await waitFor(() => expect(screen.queryByText('메시지 전송에 실패했어요.')).not.toBeInTheDocument())
    expect(await screen.findByText('재시도로 도착한 답변')).toBeInTheDocument()
    expect(screen.getByText('실패할 메시지')).toBeInTheDocument()
    expect(mockedChat).toHaveBeenCalledTimes(2)
    expect(mockedChat.mock.calls[1][0]).toMatchObject({ message: '실패할 메시지' })
  })

  it('does not send an empty or whitespace-only message', async () => {
    const user = userEvent.setup()
    render(<Messenger defaultActive="senior" />)

    await user.type(screen.getByPlaceholderText('메시지를 입력하세요'), '   ')
    await user.click(screen.getByRole('button', { name: '메시지 보내기' }))

    expect(mockedChat).not.toHaveBeenCalled()
  })
})

describe('Messenger — what I sent shows up right away', () => {
  it('shows my message before the reply arrives, once, and keeps it when sending fails', async () => {
    let resolveChat!: (v: ChatResponse) => void
    mockedChat.mockImplementationOnce(() => new Promise((resolve) => (resolveChat = resolve)))
    const user = userEvent.setup()
    render(<Messenger defaultActive="engineering" />)

    await user.type(screen.getByPlaceholderText('메시지를 입력하세요'), '목재 가공 가능한가요?')
    await user.click(screen.getByRole('button', { name: '메시지 보내기' }))
    expect(screen.getByText('목재 가공 가능한가요?')).toBeInTheDocument()

    resolveChat({ reply: '사내에서는 불가능해요.', intent: 'manufacturing_capability', disclose: [] })
    expect(await screen.findByText('사내에서는 불가능해요.')).toBeInTheDocument()
    expect(screen.getAllByText('목재 가공 가능한가요?')).toHaveLength(1)

    mockedChat.mockRejectedValueOnce(new Error('503'))
    await user.type(screen.getByPlaceholderText('메시지를 입력하세요'), '언제 끝나요?')
    await user.click(screen.getByRole('button', { name: '메시지 보내기' }))
    expect(await screen.findByText('메시지 전송에 실패했어요.')).toBeInTheDocument()
    expect(screen.getByText('언제 끝나요?')).toBeInTheDocument()
  })
})

describe('Messenger — saving an answer to the notes', () => {
  const mockedNote = vi.mocked(client.note)
  const reply = '우리 공장 목재는 취급 안 합니다. 확인했어요?'

  async function askAndGetReply() {
    mockedChat.mockResolvedValueOnce({ reply, intent: 'manufacturing_capability', disclose: [] })
    const user = userEvent.setup()
    render(<Messenger defaultActive="engineering" />)
    await user.type(screen.getByPlaceholderText('메시지를 입력하세요'), '목재 되나요?')
    await user.click(screen.getByRole('button', { name: '메시지 보내기' }))
    await screen.findByText(reply)
    return user
  }

  beforeEach(() => mockedNote.mockReset())

  it('saves the summarized lines, sending who said it and what was asked', async () => {
    mockedNote.mockResolvedValueOnce(['목재는 자사 공장에서 취급하지 않음'])
    const user = await askAndGetReply()
    await user.click(screen.getByRole('button', { name: '답변 내용 노트에 저장' }))

    expect(await screen.findByRole('button', { name: '노트에 저장됨' })).toBeDisabled()
    expect(mockedNote).toHaveBeenCalledWith({ speaker: '박책임', team: '설계팀', question: '목재 되나요?', reply, existing: [] })
    expect(useSession.getState().savedNoteMeta[reply]).toMatchObject({ persona: 'engineering', lines: ['목재는 자사 공장에서 취급하지 않음'] })
  })

  it('does not save when there is nothing to note, and says so', async () => {
    mockedNote.mockResolvedValueOnce([])
    const user = await askAndGetReply()
    await user.click(screen.getByRole('button', { name: '답변 내용 노트에 저장' }))

    expect(await screen.findByRole('button', { name: '저장할 내용이 없어요' })).toBeDisabled()
    expect(useSession.getState().savedNotes).toEqual([])
  })

  it('still saves the reply as it is when the note API cannot be reached', async () => {
    mockedNote.mockRejectedValueOnce(new Error('offline'))
    const user = await askAndGetReply()
    await user.click(screen.getByRole('button', { name: '답변 내용 노트에 저장' }))

    await screen.findByRole('button', { name: '노트에 저장됨' })
    expect(useSession.getState().savedNoteMeta[reply].lines).toEqual([reply])
  })
})

describe('Messenger — login required', () => {
  it('asks to log in instead of offering a retry when the API wants a signed-in account', async () => {
    mockedChat.mockRejectedValueOnce(new client.LoginRequiredError())
    const user = userEvent.setup()
    render(<Messenger defaultActive="engineering" />)
    await user.type(screen.getByPlaceholderText('메시지를 입력하세요'), '목재 되나요?')
    await user.click(screen.getByRole('button', { name: '메시지 보내기' }))

    expect(await screen.findByText('로그인해야 관계자와 대화할 수 있어요.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '로그인하기' })).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('button', { name: '재시도' })).not.toBeInTheDocument()
  })
})
