import { Text } from './Text'

interface RatingRowProps<T extends string> {
  label: string
  value: T
  onChange: (v: T) => void
  scale: readonly T[]
  /** work: 세션2 업무 페이지 새 디자인(2217:10818) — 테두리 없는 연두 칸, 선택은 Green/400 */
  tone?: 'default' | 'work'
}

// 5단계 척도 버튼 행 — session1/session2 SelfAssessment.tsx에 동일하게 복붙돼 있던 것을
// 하나로 모음(둘 다 '전혀 아니다'~'매우 그렇다' 5단계라 UI가 완전히 같음). 각 세션이 쓰는
// 척도 타입(S1RatingScale/RatingScale)은 이름만 다른 동일한 값이라 scale을 prop으로 받아
// 어느 쪽 상수든 그대로 넘길 수 있게 했다.
export function RatingRow<T extends string>({ label, value, onChange, scale, tone = 'default' }: RatingRowProps<T>) {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="title-lg" emphasis className="text-green-900">
        {label}
      </Text>
      <div className="flex gap-3">
        {scale.map((option) => {
          const selected = value === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              aria-pressed={selected}
              className={`h-[72px] flex-1 rounded-xl px-3 py-6 text-center text-title-lg transition-colors ${
                tone === 'work'
                  ? selected
                    ? 'bg-green-400 font-semibold text-neutral-900'
                    : 'bg-green-50 text-neutral-500 hover:bg-green-100'
                  : selected
                    ? 'bg-green-300 font-semibold text-neutral-900'
                    : 'border border-green-900 text-neutral-500 hover:bg-green-50'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}
