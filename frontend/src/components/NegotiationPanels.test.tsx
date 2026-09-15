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

    await user.type(screen.getByPlaceholderText('Message'), '테스트 메시지')
    await user.click(screen.getByRole('button', { name: '메시지 보내기' }))

    expect(screen.getByText('테스트 메시지')).toBeInTheDocument()
    expect(await screen.findByText('안녕하세요, 도와드릴게요.')).toBeInTheDocument()
  })

  it('clears the input immediately, before the reply arrives', async () => {
    mockedChat.mockImplementationOnce(() => new Promise(() => {})) // never resolves in this test
    const user = userEvent.setup()
    render(<Messenger defaultActive="senior" />)

    const input = screen.getByPlaceholderText('Message')
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

    await user.type(screen.getByPlaceholderText('Message'), '대기 확인')
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

    await user.type(screen.getByPlaceholderText('Message'), '실패할 메시지')
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

    await user.type(screen.getByPlaceholderText('Message'), '   ')
    await user.click(screen.getByRole('button', { name: '메시지 보내기' }))

    expect(mockedChat).not.toHaveBeenCalled()
  })
})
