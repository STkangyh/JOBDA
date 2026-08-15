import type { ChatRequest, ChatResponse, Persona } from '../../types'

// 목데이터 응답기 — BACKEND_SPEC_v2.md 9번 섹션 프롬프트 내용을 규칙 기반으로 흉내낸다.
// 백엔드 /api/chat 이 준비되면 src/api/client.ts 의 분기만 바뀌고 이 파일은 필요 없어진다.

interface Rule {
  keywords: string[]
  intent: string
  disclose: string[]
  reply: string
}

const RULES: Record<Persona, Rule[]> = {
  senior: [
    {
      keywords: ['한도', '견본', '컬러칩', '색'],
      intent: 'spec_guidance',
      disclose: ['limit_sample'],
      reply:
        '목재는 컬러칩처럼 "이 색으로 해주세요"가 안 통해요. "이 정도까지는 받겠습니다"를 적어야 하고, 공용 서식 폴더의 한도 견본 판정표 양식을 참고해서 별첨하세요.',
    },
    {
      keywords: ['업체', '외주', '벤더', '납기'],
      intent: 'vendor_guidance',
      disclose: ['vendor_criteria'],
      reply: '업체는 납기일·가능 수량·단가를 기준으로 3개 정도 찾아서 정리해오세요.',
    },
    {
      keywords: ['시방서', '사이즈', '제작', 'cmf', '서식', '형식'],
      intent: 'spec_guidance',
      disclose: ['spec_format'],
      reply: '시방서에는 사이즈·제작 방식·CMF·컬러칩이 모두 들어가야 해요. 빠진 거 없는지 먼저 확인하세요.',
    },
  ],
  engineering: [
    {
      keywords: ['기간', '언제', '소요', '얼마나 걸'],
      intent: 'manufacturing_capability',
      disclose: ['sheet_lead_time'],
      reply: '시트지 래핑으로 진행하면 이번 주 안에 마무리됩니다.',
    },
    {
      keywords: ['가능', '제작', '밴딩', '오일', '목재', '사내', '생산', '마감'],
      intent: 'manufacturing_capability',
      disclose: ['inhouse_capability'],
      reply:
        '우리 공장은 목재 취급 안 합니다. 시트지 래핑은 몰라도 목재 밴딩이나 오일 마감은 불가예요. 어떻게 할지는 디자이너님이 정하세요.',
    },
  ],
  purchasing: [
    {
      keywords: ['예산', '상한', '한도액'],
      intent: 'cost_constraint',
      disclose: ['budget_limit'],
      reply: '목재 파트 예산 상한은 넉넉하지 않아요. 정확한 금액은 시안 확정되면 다시 안내드릴게요.',
    },
    {
      keywords: ['단가', '비용', '가격', '초과'],
      intent: 'cost_constraint',
      disclose: ['cost_impact'],
      reply:
        '목재 밴딩으로 가면 예산 초과 가능성이 있어요. 시트지로 가거나 목재와 비슷한 느낌 내는 대체 재질을 찾는 방법도 있어요.',
    },
    {
      keywords: ['전체', '다른 파트', '총'],
      intent: 'cost_constraint',
      disclose: ['part_cost_share'],
      reply: '다른 파트 제작 비용까지 포함해서 전체 생산 단가를 맞춰야 해요.',
    },
  ],
}

const TOO_VAGUE_REPLY = '조금 더 구체적으로 어떤 부분이 궁금하신 건지 말씀해주시겠어요?'
const IRRELEVANT_REPLY = '지금 진행 중인 공기청정기 목재 파트 건에 집중해주세요.'

const OUT_OF_SCOPE_REDIRECT: Record<Persona, string> = {
  senior: '예산 관련이면 구매팀, 사내 생산 가능 여부는 설계팀에 물어보세요.',
  engineering: '서식·표현 방식은 선임 디자이너에게, 예산은 구매팀에 물어보세요.',
  purchasing: '서식 관련은 선임 디자이너에게, 생산 가능 여부는 설계팀에 물어보세요.',
}

export function mockChat(req: ChatRequest): ChatResponse {
  const msg = req.message.trim()
  if (msg.length === 0) {
    throw new Error('message is empty')
  }
  if (msg.length < 4) {
    return { reply: TOO_VAGUE_REPLY, intent: 'too_vague', disclose: [] }
  }

  const rules = RULES[req.persona]
  const lower = msg.toLowerCase()
  const matched = rules.find((r) => r.keywords.some((k) => lower.includes(k.toLowerCase())))
  if (matched) {
    return { reply: matched.reply, intent: matched.intent, disclose: matched.disclose }
  }

  // 다른 관계자 담당으로 보이는 키워드가 섞여 있으면 안내만 하고 정보는 공개하지 않는다.
  const otherPersonaKeywords = ['예산', '단가', '비용', '가격', '밴딩', '가능', '서식', '한도', '업체']
  if (otherPersonaKeywords.some((k) => lower.includes(k))) {
    return { reply: OUT_OF_SCOPE_REDIRECT[req.persona], intent: 'out_of_scope', disclose: [] }
  }

  return { reply: IRRELEVANT_REPLY, intent: 'irrelevant', disclose: [] }
}
