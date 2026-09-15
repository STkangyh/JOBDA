import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSession } from './session'
import * as client from '../api/client'

vi.mock('../api/client')
const mockedChat = vi.mocked(client.chat)

beforeEach(() => {
  useSession.getState().resetSession()
  mockedChat.mockReset()
})

describe('session store: sendMessage', () => {
  it('appends both the user turn and the reply to that persona\'s chat history', async () => {
    mockedChat.mockResolvedValueOnce({ reply: '알겠습니다', intent: 'other', disclose: [] })

    await useSession.getState().sendMessage('senior', '질문 있어요')

    const history = useSession.getState().chatHistory.senior
    expect(history).toHaveLength(2)
    expect(history[0]).toMatchObject({ role: 'user', content: '질문 있어요' })
    expect(history[1]).toMatchObject({ role: 'assistant', content: '알겠습니다' })
  })

  it('does not touch other personas\' history', async () => {
    mockedChat.mockResolvedValueOnce({ reply: '답변', intent: 'other', disclose: [] })

    await useSession.getState().sendMessage('senior', '질문')

    expect(useSession.getState().chatHistory.engineering).toHaveLength(0)
    expect(useSession.getState().chatHistory.purchasing).toHaveLength(0)
  })

  it('accumulates disclosed keys across calls and de-duplicates repeats', async () => {
    mockedChat.mockResolvedValueOnce({ reply: 'r1', intent: 'other', disclose: ['product_concept'] })
    mockedChat.mockResolvedValueOnce({ reply: 'r2', intent: 'other', disclose: ['product_concept', 'design_direction'] })

    await useSession.getState().sendMessage('senior', 'q1')
    await useSession.getState().sendMessage('senior', 'q2')

    expect(useSession.getState().disclosedInfo.senior).toEqual(['product_concept', 'design_direction'])
  })

  it('flips askedCapability once a capability-related key is disclosed, and it stays true', async () => {
    expect(useSession.getState().askedCapability).toBe(false)

    mockedChat.mockResolvedValueOnce({ reply: 'r1', intent: 'other', disclose: ['inhouse_capability'] })
    await useSession.getState().sendMessage('engineering', 'q1')
    expect(useSession.getState().askedCapability).toBe(true)

    mockedChat.mockResolvedValueOnce({ reply: 'r2', intent: 'other', disclose: [] })
    await useSession.getState().sendMessage('engineering', 'q2')
    expect(useSession.getState().askedCapability).toBe(true)
  })

  it('flips askedBudget for any of the three budget-related disclose keys', async () => {
    mockedChat.mockResolvedValueOnce({ reply: 'r', intent: 'other', disclose: ['part_cost_share'] })

    await useSession.getState().sendMessage('purchasing', 'q')

    expect(useSession.getState().askedBudget).toBe(true)
  })

  it('propagates the rejection when apiChat fails, without corrupting chat history', async () => {
    mockedChat.mockRejectedValueOnce(new Error('llm_unavailable'))

    await expect(useSession.getState().sendMessage('senior', '실패할 질문')).rejects.toThrow('llm_unavailable')

    expect(useSession.getState().chatHistory.senior).toHaveLength(0)
  })
})
