import { Text } from './Text'
import runner from '../assets/runner.png'

export const INDICATOR_STEPS = [
  '브리프',
  '자료탐색',
  '관계자 협업',
  '제안서 작성',
  '피드백 수정',
  '자기 평가',
  '직무 리포트',
] as const
export type IndicatorStep = (typeof INDICATOR_STEPS)[number]

interface IndicatorProps {
  current: string
  /** 세션마다 스텝 라벨이 달라서(예: 세션1은 "설계 수정1/2") 커스텀 스텝 배열을 받을 수 있게 함. */
  steps?: readonly string[]
  className?: string
}

// Figma "인디케이터" component (607:12871) — a 7-step journey progress bar with a running
// character marking the current position. The original uses a diagonal-hatched fill texture;
// simplified here to a solid bar since the hatch pattern isn't worth the CSS complexity.
export function Indicator({ current, steps = INDICATOR_STEPS, className = '' }: IndicatorProps) {
  const index = steps.indexOf(current)
  const progress = steps.length > 1 ? (Math.max(index, 0) / (steps.length - 1)) * 100 : 0

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="relative h-2 w-full rounded-full bg-neutral-200">
        <div className="h-full rounded-full bg-green-500 transition-[width]" style={{ width: `${progress}%` }} />
        <img
          src={runner}
          alt=""
          className="absolute top-1/2 size-10"
          style={{ left: `${progress}%`, transform: 'translate(-50%, -85%)' }}
        />
      </div>
      <div className="flex justify-between">
        {steps.map((step, i) => (
          <Text
            key={step}
            variant="body-md"
            emphasis={i === index}
            className={i === index ? 'text-green-700' : 'text-neutral-400'}
          >
            {step}
          </Text>
        ))}
      </div>
    </div>
  )
}
