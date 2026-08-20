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
// character marking the current position. The fill uses a diagonal-hatched stripe texture in
// the original (dozens of individually rotated 88px bars in the Figma export); reproduced here
// with a repeating-linear-gradient instead of porting that literal markup.
export function Indicator({ current, steps = INDICATOR_STEPS, className = '' }: IndicatorProps) {
  const index = steps.indexOf(current)
  const progress = steps.length > 1 ? (Math.max(index, 0) / (steps.length - 1)) * 100 : 0

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="relative h-[10px] w-full overflow-hidden rounded-xl bg-neutral-100 shadow-[inset_0_0_6px_rgba(0,0,0,0.1)]">
        <div
          className="h-full bg-green-75 transition-[width]"
          style={{
            width: `${progress}%`,
            backgroundImage:
              'repeating-linear-gradient(-45deg, var(--color-green-500) 0px, var(--color-green-500) 7px, transparent 7px, transparent 20px)',
          }}
        />
        <div
          className="absolute top-1/2 size-5 rounded-full border-[3px] border-green-500 bg-neutral-50"
          style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
        />
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
            className={i === index ? 'text-green-800' : 'text-neutral-400'}
          >
            {step}
          </Text>
        ))}
      </div>
    </div>
  )
}
