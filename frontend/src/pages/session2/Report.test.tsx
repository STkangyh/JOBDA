import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Report } from './Report'
import { useSession } from '../../store/session'
import { computeJourney, mockReport } from '../../api/mock/report'
import type { ReportResponse } from '../../types'

const baseReport: ReportResponse = {
  work_overview: '개요',
  strengths: ['강점 문장'],
  cautions: [],
  missed: [],
  job_meaning: '의미',
  journey: ['초안 단계 설명', '2차 단계 설명', '3차 단계 설명'],
  profile: [],
  personaHeadline: '헤드라인',
  burdenNote: '',
}

function renderReport(report: Partial<ReportResponse>) {
  useSession.setState({ currentStage: 'report', report: { ...baseReport, ...report } })
  return render(
    <MemoryRouter>
      <Report />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useSession.getState().resetSession()
})

describe('session 2 job report', () => {
  it('pairs each journey line with its stage name under 업무 진행 과정', () => {
    renderReport({})
    const items = within(screen.getByRole('region', { name: '업무 진행 과정' })).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual(['시방서 초안 작성초안 단계 설명', '2차 협상2차 단계 설명', '3차 협상3차 단계 설명'])
  })

  it('falls back to the default journey for reports saved before journey existed', () => {
    renderReport({ journey: undefined as unknown as string[] })
    expect(screen.getByText('부품별 디자인 시방서 초안 작성')).toBeInTheDocument()
  })

  it('shows every behavior line without a cap, inside a list that scrolls on its own', () => {
    const many = Array.from({ length: 6 }, (_, i) => `주의 ${i + 1}`)
    renderReport({ cautions: many })
    const list = screen.getByTestId('behavior-list')
    expect(list).toHaveClass('overflow-y-auto')
    many.forEach((text) => expect(within(list).getByText(`“${text}”`)).toBeInTheDocument())
  })
})

describe('offline report data', () => {
  it('writes the third journey line from the chosen direction', () => {
    const base = { findings: [], action_logs: [], scores: { intent_delivery: 3, concept_retention: 3, cost_control: 2 } as const }
    expect(computeJourney({ ...base, branch: 'sheet_wrap' })[2]).toBe('시트지 래핑으로 결정, 외주 없이 마무리')
    expect(computeJourney({ ...base, branch: 'outsourcing', findings: [{ code: 'limit_sample_missing_in_draft', evidence: {} }] })[0]).toBe(
      '한도 견본 판정표 누락으로 보완 요청',
    )
  })

  it('keeps every finding sentence instead of cutting at two or three', () => {
    const res = mockReport({
      findings: [
        { code: 'limit_sample_missing_in_draft', evidence: {} },
        { code: 'spec_field_missing', evidence: {} },
        { code: 'vendor_criteria_incomplete', evidence: {} },
      ],
      action_logs: [],
      scores: { intent_delivery: 1, concept_retention: 3, cost_control: 2 },
      branch: 'outsourcing',
    })
    expect(res.cautions).toHaveLength(3)
  })
})
