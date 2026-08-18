import type { ProfileAxis } from '../types'
import { Text } from './Text'

// Figma "내 직무 이해 프로필" 스펙트럼 바. value 0~100, 트랙 위 마커 위치로 표시.
export function ProfileSpectrum({ leftLabel, rightLabel, caption, value }: ProfileAxis) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex items-center justify-between text-body-lg text-neutral-400">
        <span>{leftLabel}</span>
        <Text as="span" variant="body-lg" emphasis className="absolute left-1/2 -translate-x-1/2 text-neutral-300">
          {caption}
        </Text>
        <span>{rightLabel}</span>
      </div>
      <div className="relative h-3 w-full rounded-full bg-neutral-950">
        <div
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-neutral-900 bg-green-500"
          style={{ left: `${value}%` }}
        />
      </div>
    </div>
  )
}
