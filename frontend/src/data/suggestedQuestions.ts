import type { Persona } from '../types'

export const SUGGESTED_QUESTIONS: Record<Persona, string[]> = {
  senior: [
    '시방서에 꼭 들어가야 하는 항목이 뭔가요?',
    '한도 견본 판정표는 어떻게 작성하나요?',
    '외주 업체는 어떤 기준으로 찾아야 하나요?',
  ],
  engineering: [
    '목재 밴딩이 사내에서 가능한가요?',
    '시트지로 진행하면 기간이 얼마나 걸리나요?',
  ],
  purchasing: [
    '목재 파트 예산 상한이 얼마인가요?',
    '목재 밴딩으로 가면 단가가 얼마나 오르나요?',
  ],
}
