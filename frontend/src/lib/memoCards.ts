import { PERSONA_SENDER_NAME, type SessionState } from '../types'

// 받침이 있으면 "과", 없으면 "와" — "박책임과의 대화", "고프로와의 대화"
function withGwa(name: string): string {
  const code = name.charCodeAt(name.length - 1) - 0xac00
  const hasBatchim = code >= 0 && code <= 11171 && code % 28 !== 0
  return `${name}${hasBatchim ? '과' : '와'}`
}

interface MemoCard {
  key: string
  title: string
  /** 마지막으로 저장한 시각 */
  t?: number
  lines: string[]
}

// 저장한 답변을 관계자별 카드로 묶는다. 카드는 처음 저장한 순서대로, 줄은 저장한 순서대로 쌓인다.
// 누가 보냈는지 기록이 없는 예전 저장분은 "저장한 답변" 카드 하나로 모은다.
export function groupSavedNotes(notes: string[], meta: SessionState['savedNoteMeta']): MemoCard[] {
  const cards = new Map<string, MemoCard>()
  for (const note of notes) {
    const m = meta[note]
    const key = m?.persona ?? 'unknown'
    const card = cards.get(key) ?? { key, title: m ? `${withGwa(PERSONA_SENDER_NAME[m.persona])}의 대화` : '저장한 답변', lines: [] }
    card.lines.push(...(m?.lines?.length ? m.lines : [note]))
    if (m && (card.t === undefined || m.t > card.t)) card.t = m.t
    cards.set(key, card)
  }
  return [...cards.values()]
}
