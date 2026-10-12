import markerIcon from '../assets/report/marker.svg'
import type { ProfileAxis } from '../types'

// "내 직무 이해 프로필" 막대 — 탐색 홈(2217:13409)·종합 리포트(2219:39273) 새 디자인(2026-10-13).
// 세션1 리포트는 이전 디자인(ProfileSpectrum)을 그대로 쓴다. value 0~100.
export function ProfileMeter({ leftLabel, rightLabel, caption, value }: ProfileAxis) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex items-center justify-between text-body-lg whitespace-nowrap">
        <span className="tracking-[-0.48px] text-neutral-700">{leftLabel}</span>
        <span className="absolute left-1/2 -translate-x-1/2 font-medium text-neutral-500">{caption}</span>
        <span className="tracking-[-0.48px] text-neutral-700">{rightLabel}</span>
      </div>
      <div
        role="meter"
        aria-label={`${caption}: ${leftLabel}–${rightLabel}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        className="relative h-3 w-full rounded-xl bg-[#1b1b1b]"
      >
        <img
          src={markerIcon}
          alt=""
          width={20}
          height={20}
          className="absolute -top-1 size-5 -translate-x-1/2"
          style={{ left: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
