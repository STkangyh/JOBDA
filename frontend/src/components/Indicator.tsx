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

// 세션1 전용 스텝 라벨 — 예전엔 session1/*.tsx 5개 파일에 각각 동일한 배열이 복붙돼 있었음.
export const INDICATOR_STEPS_S1 = ['브리프', '자료탐색', '설계 수정1', '설계 수정2', '설계 확정', '자기 평가', '직무 리포트'] as const

interface IndicatorProps {
  current: string
  /** 세션마다 스텝 라벨이 달라서(예: 세션1은 "설계 수정1/2") 커스텀 스텝 배열을 받을 수 있게 함. */
  steps?: readonly string[]
  className?: string
  /** gray: 세션2 업무 화면(회색 배경, Figma 2217:10065) — 라벨이 밝은 색, 현재 단계는 Green/300 */
  tone?: 'light' | 'gray'
}

// Figma "인디케이터" component (607:12871) — a 7-step journey progress bar with a running
// character marking the current position. The fill uses a diagonal-hatched stripe texture in
// the original (dozens of individually rotated 88px bars in the Figma export); reproduced here
// with a repeating-linear-gradient instead of porting that literal markup. Figma's own fill
// color (Green/75, #f9fef4) sits almost on top of the track color (Neutral/100, #f5f5f5) —
// visible in Figma's flat rendering but nearly invisible against real screens/scaling, so the
// fill background is bumped to Green/100 and the stripes to Green/600 for actual contrast.
export function Indicator({ current, steps = INDICATOR_STEPS, className = '', tone = 'light' }: IndicatorProps) {
  const index = steps.indexOf(current)
  const progress = steps.length > 1 ? (Math.max(index, 0) / (steps.length - 1)) * 100 : 0

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="relative h-[10px] w-full">
        <div
          className={`h-full w-full overflow-hidden rounded-xl shadow-[inset_0_0_6px_rgba(0,0,0,0.1)] ${tone === 'gray' ? 'bg-[rgba(245,245,245,0.75)] backdrop-blur-gnb' : 'bg-neutral-100'}`}
        >
          <div
            className={`h-full transition-[width] ${tone === 'gray' ? 'bg-green-50' : 'bg-green-100'}`}
            style={{
              width: `${progress}%`,
              backgroundImage:
                tone === 'gray'
                  ? 'repeating-linear-gradient(-45deg, var(--color-green-300) 0px, var(--color-green-300) 8px, transparent 8px, transparent 20px)'
                  : 'repeating-linear-gradient(-45deg, var(--color-green-600) 0px, var(--color-green-600) 6px, transparent 6px, transparent 16px)',
            }}
          />
        </div>
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
        {steps.map((step, i) =>
          tone === 'gray' ? (
            <span key={step} className={`text-body-lg ${i === index ? 'font-medium text-green-300' : 'text-neutral-100'}`}>
              {step}
            </span>
          ) : (
            <Text key={step} variant="body-md" emphasis={i === index} className={i === index ? 'text-green-800' : 'text-neutral-400'}>
              {step}
            </Text>
          ),
        )}
      </div>
    </div>
  )
}
