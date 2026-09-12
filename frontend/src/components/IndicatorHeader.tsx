import { Indicator } from './Indicator'
import { CloudSavedIcon, ProfileIcon } from './icons'

interface IndicatorHeaderProps {
  current: string
  /** 세션1 화면은 커스텀 스텝 배열(INDICATOR_STEPS_S1)을 넘김. */
  steps?: readonly string[]
  /** grid-cols 유틸리티만 교체 — 화면마다 가운데 컬럼 폭 기준이 다름(3등분 vs 고정폭 340/300px). */
  gridCols?: string
  /** 저장상태/프로필 아이콘 쌍을 보여줄지. false면 세 번째 칸도 비워둠(Report/SelfAssessment). */
  icons?: boolean
  /** 아이콘 원 배경색 — 화면 대부분 neutral-900, session1/Report만 neutral-800. */
  iconBg?: string
}

// 세션1·세션2 전 화면이 공유하는 "인디케이터 + 저장상태·프로필 아이콘" 3분할 헤더 행.
// 예전엔 화면마다 이 블록을 통째로 복붙해서, 인디케이터 폭이 화면마다 들쭉날쭉해지는 버그가
// 반복적으로 났었음(Report.tsx/JourneyMap.tsx에서 각각 따로 발견해 수정) — 한 곳으로 모아서
// 같은 실수가 다시 나기 어렵게 함.
export function IndicatorHeader({
  current,
  steps,
  gridCols = 'grid-cols-1 lg:grid-cols-3',
  icons = true,
  iconBg = 'bg-neutral-900',
}: IndicatorHeaderProps) {
  return (
    <div className={`grid gap-x-6 gap-y-4 ${gridCols}`}>
      <div className="hidden lg:block" />
      <Indicator current={current} steps={steps} />
      {icons ? (
        <div className="hidden items-center justify-end gap-[18px] lg:flex">
          <div className={`flex size-[50px] shrink-0 items-center justify-center rounded-full ${iconBg} text-neutral-50`}>
            <CloudSavedIcon className="size-5" />
          </div>
          <div className={`flex size-[50px] shrink-0 items-center justify-center rounded-full ${iconBg} text-neutral-50`}>
            <ProfileIcon className="size-5" />
          </div>
        </div>
      ) : (
        <div className="hidden lg:block" />
      )}
    </div>
  )
}
