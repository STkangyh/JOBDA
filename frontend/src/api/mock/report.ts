import { PERSONA_HEADLINE_FIXED, type Finding, type FindingCode, type ProfileAxis, type ReportRequest, type ReportResponse } from '../../types'

// finding code -> 문장 매핑을 프론트 목데이터로 재현. 버킷 분류는 client.ts의 FINDING_BUCKET과
// 동일하게 맞춰서(이슈 #1 / 백엔드 API.md 기준) 오프라인 목데이터와 실제 API가 같은 카테고리를 쓴다.
// 실제 /api/report 는 이 findings 를 LLM으로 다듬지만, 목데이터는 고정 문장을 그대로 쓴다.

const SENTENCE: Record<FindingCode, { bucket: 'strengths' | 'cautions' | 'missed'; text: string }> = {
  asked_capability_before_final: {
    bucket: 'strengths',
    text: '사내 생산 가능 여부를 최종본 제출 전에 확인해 재작업을 줄였습니다.',
  },
  vendor_compared_three: {
    bucket: 'strengths',
    text: '외주 업체 3개사를 납기·수량·단가 기준으로 비교했습니다.',
  },
  limit_sample_missing_in_draft: {
    bucket: 'cautions',
    text: '초안에 한도 견본 판정표를 별첨하지 않아 선임 디자이너의 재요청이 발생했습니다.',
  },
  vendor_criteria_incomplete: {
    bucket: 'cautions',
    text: '업체 비교 시 납기·수량·단가 중 일부만 검토했습니다.',
  },
  revisited_after_branch: {
    bucket: 'cautions',
    text: '목재를 포기한 뒤 시방서를 다시 작성하며 일정이 지연되었습니다.',
  },
  spec_field_missing: {
    bucket: 'cautions',
    text: '시방서 필수 항목 중 일부(사이즈/제작 방식/CMF/컬러칩)가 비어 있었습니다.',
  },
  capability_never_asked: {
    bucket: 'missed',
    text: '설계팀에 사내 생산 가능 여부를 확인하지 않았습니다.',
  },
  budget_never_asked: {
    bucket: 'missed',
    text: '구매팀에 목재 파트 예산을 확인하지 않았습니다.',
  },
  concept_abandoned: {
    bucket: 'cautions',
    text: '목재 하우징 콘셉트를 유지할 다른 방법을 더 탐색하지 않고 포기했습니다.',
  },
  deadline_margin_ignored: {
    bucket: 'missed',
    text: '12일 발주 일정을 고려한 흔적이 결과물에 드러나지 않았습니다.',
  },
}

// 이슈 #2 (백엔드 #14): work_overview/job_meaning은 항상 채워지는 서술 문자열.
// branch에 따라 실제로 뭘 했는지가 달라지므로 work_overview만 branch별로 분기.
const WORK_OVERVIEW: Record<ReportRequest['branch'], string> = {
  outsourcing: '오크 원목 하우징의 CMF 시방서를 작성하고 외주 업체를 비교해 목재 파트 실현 방법을 선택했습니다.',
  sheet_wrap: '오크 원목 하우징의 CMF 시방서를 작성하고 시트지 래핑으로 목재 파트 실현 방법을 선택했습니다.',
  wood_dropped: '오크 원목 하우징의 CMF 시방서를 작성했지만 목재 파트를 포기하고 다른 재질로 방향을 바꿨습니다.',
}

const JOB_MEANING = '제약 속에서 디자인 의도와 현실의 타협점을 찾는 실무 감각을 경험했습니다.'

// "내 직무 이해 프로필" — 새 축을 위해 별도 입력을 새로 받지 않고, 이미 계산된
// scores/branch/findings(부록 A 판정 근거)만으로 4축을 도출한다. 실제 백엔드(v4) 응답에는
// 아직 이 필드가 없어서 client.ts에서도 이 함수로 채워 넣는다(경계에서 갭 흡수).
export function computeProfile(req: ReportRequest): ProfileAxis[] {
  const hasFinding = (code: FindingCode) => req.findings.some((f) => f.code === code)

  const revisited = hasFinding('revisited_after_branch')
  const askedCapability = !hasFinding('capability_never_asked')
  const askedBudget = !hasFinding('budget_never_asked')

  return [
    {
      leftLabel: '품질 우선',
      rightLabel: '일정 우선',
      caption: '결과물 완성도 vs 제출 속도',
      value: ((3 - req.scores.intent_delivery) / 2) * 100,
    },
    {
      leftLabel: '수용형',
      rightLabel: '대안 제시형',
      caption: '이해관계자 설득 선호도',
      value: ((req.scores.concept_retention - 1) / 2) * 100,
    },
    {
      leftLabel: '수용적',
      rightLabel: '부담 경험',
      caption: '반복 수정에 대한 반응',
      value: revisited ? 80 : 20,
    },
    {
      leftLabel: '수용적',
      rightLabel: '근거 요구형',
      caption: '피드백 후 판단 수정 성향',
      value: (askedCapability ? 50 : 0) + (askedBudget ? 50 : 0),
    },
  ]
}

export function mockReport(req: ReportRequest): ReportResponse {
  const strengths: string[] = []
  const cautions: string[] = []
  const missed: string[] = []

  const push = (f: Finding) => {
    const s = SENTENCE[f.code]
    if (!s) return
    if (s.bucket === 'strengths' && strengths.length < 2) strengths.push(s.text)
    if (s.bucket === 'cautions' && cautions.length < 2) cautions.push(s.text)
    if (s.bucket === 'missed' && missed.length < 3) missed.push(s.text)
  }

  req.findings.forEach(push)

  if (strengths.length === 0) strengths.push('시방서 초안부터 최종본까지 제출 흐름을 끝까지 완료했습니다.')

  return {
    work_overview: WORK_OVERVIEW[req.branch],
    strengths,
    cautions,
    missed,
    job_meaning: JOB_MEANING,
    profile: computeProfile(req),
    // ReportRequest에 selfAssessment가 없어 burdenNote는 여기서 알 수 없다 — store(session.ts)의
    // finishAssessment가 실제 자기평가 텍스트로 덮어쓴다. personaHeadline은 고정 문구라 여기서도
    // 채워두지만 마찬가지로 finishAssessment에서 다시 덮어쓴다.
    personaHeadline: PERSONA_HEADLINE_FIXED,
    burdenNote: '',
  }
}
