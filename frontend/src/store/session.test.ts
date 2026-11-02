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

// 기획 확정(2026-11-01)으로 평가 기준이 10개가 되면서, 네 가지 행동이 "챙겼으면 강점 /
// 안 챙겼으면 주의점·놓친 요소" 짝으로 바뀌었다. 짝 중 하나만 나오는지, 그리고 평가에서
// 빠진 code 가 더는 안 나오는지를 고정한다. computeFindings 는 export 되어 있지 않아
// finishAssessment 가 apiReport 로 넘기는 findings 로 확인한다.
describe('session store: computeFindings (기획 확정 평가 기준 10개)', () => {
  const mockedReport = vi.mocked(client.report)
  const mockedSessionLog = vi.mocked(client.sessionLog)

  const codesAfterFinish = async (): Promise<string[]> => {
    mockedReport.mockResolvedValueOnce({
      work_overview: '', strengths: [], cautions: [], missed: [], job_meaning: '',
      profile: [], personaHeadline: '', burdenNote: '',
    })
    mockedSessionLog.mockResolvedValueOnce(undefined)
    await useSession.getState().finishAssessment()
    return mockedReport.mock.calls.at(-1)![0].findings.map((f) => f.code)
  }

  beforeEach(() => {
    mockedReport.mockReset()
    mockedSessionLog.mockReset()
  })

  it('아무것도 안 챙긴 경우 네 짝 모두 아쉬운 쪽으로 나온다', async () => {
    const codes = await codesAfterFinish()

    expect(codes).toContain('limit_sample_missing_in_draft')
    expect(codes).toContain('capability_never_asked')
    expect(codes).toContain('budget_never_asked')
    expect(codes).toContain('deadline_margin_ignored')

    expect(codes).not.toContain('limit_sample_attached_in_draft')
    expect(codes).not.toContain('asked_capability_before_final')
    expect(codes).not.toContain('cost_impact_checked')
    expect(codes).not.toContain('deadline_margin_considered')
  })

  it('한도 견본을 붙였으면 강점 쪽만 나온다', async () => {
    useSession.setState((s) => ({ draft: { ...s.draft, limitSampleAttached: true } }))

    const codes = await codesAfterFinish()

    expect(codes).toContain('limit_sample_attached_in_draft')
    expect(codes).not.toContain('limit_sample_missing_in_draft')
  })

  it('생산 가능 여부와 단가를 물었으면 강점 쪽만 나온다', async () => {
    useSession.setState({ askedCapability: true, askedBudget: true })

    const codes = await codesAfterFinish()

    expect(codes).toContain('asked_capability_before_final')
    expect(codes).toContain('cost_impact_checked')
    expect(codes).not.toContain('capability_never_asked')
    expect(codes).not.toContain('budget_never_asked')
  })

  it('발주 일정을 언급했으면 강점 쪽만 나온다', async () => {
    useSession.setState((s) => ({
      chatHistory: {
        ...s.chatHistory,
        purchasing: [{ role: 'user', content: '발주 일정 12일 안에 가능한가요?', t: 0 }],
      },
    }))

    const codes = await codesAfterFinish()

    expect(codes).toContain('deadline_margin_considered')
    expect(codes).not.toContain('deadline_margin_ignored')
  })

  it('평가에서 빠진 code 는 어떤 상태에서도 나오지 않는다', async () => {
    useSession.setState({ branch: 'wood_dropped', revisitCount: 2 })

    const codes = await codesAfterFinish()

    expect(codes).not.toContain('concept_abandoned')
    expect(codes).not.toContain('revisited_after_branch')
    expect(codes).not.toContain('vendor_compared_three')
  })
})
