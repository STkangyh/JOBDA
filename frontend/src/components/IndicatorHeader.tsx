import { Indicator } from './Indicator'
import { AsteriskIcon, CloudSavedIcon, ProfileIcon } from './icons'

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
  /** 제출/리포트 생성 같은 비동기 작업이 진행 중일 때 저장상태 아이콘 왼쪽에 도는 별표 아이콘을
   *  하나 더 보여줌(Figma 823:55379 "Component 220" — 로딩 중에만 나타나는 세 번째 아이콘).
   *  icons=false인 화면(Report/SelfAssessment)에서도 로딩 표시는 필요해서 icons와 별개로 동작. */
  loading?: boolean
}

// 세션1·세션2 전 화면이 공유하는 "인디케이터 + 저장상태·프로필 아이콘" 3분할 헤더 행.
// 예전엔 화면마다 이 블록을 통째로 복붙해서, 인디케이터 폭이 화면마다 들쭉날쭉해지는 버그가
// 반복적으로 났었음(Report.tsx/JourneyMap.tsx에서 각각 따로 발견해 수정) — 한 곳으로 모아서
// 같은 실수가 다시 나기 어렵게 함.
//
// 기본값은 원래 grid-cols-3(3등분)이었는데, 1400px 기준 가운데 칸이 ~400px밖에 안 돼서
// 7단계 라벨("브리프"~"직무 리포트")이 거의 붙어 보였다(라벨 사이 간격 1px 수준) — Brief.tsx가
// 이미 body 그리드에 맞춰 쓰고 있던 300px_1fr_300px로 기본값을 올려서 해결. 이 기본값을 쓰는
// 화면들(JourneyMap/Report/SelfAssessment/BranchSelect 등, 자기 body에 맞출 고정폭 사이드
// 컬럼이 없는 화면)은 전부 같은 기본값을 공유해야 서로 진행률 바 길이가 통일된다 — 개별
// 화면에 값을 박지 말 것. Messenger/WorkNotesCard처럼 340px 고정폭 사이드 패널이 있는 화면만
// 그 폭에 맞춰 gridCols를 개별 지정한다(Workspace/SeniorFeedback/FinalFeedback/VendorCompare).
export function IndicatorHeader({
  current,
  steps,
  gridCols = 'grid-cols-1 lg:grid-cols-[300px_1fr_300px]',
  icons = true,
  iconBg = 'bg-neutral-900',
  loading = false,
}: IndicatorHeaderProps) {
  return (
    <div className={`grid gap-x-6 gap-y-4 ${gridCols}`}>
      <div className="hidden lg:block" />
      <Indicator current={current} steps={steps} />
      {icons || loading ? (
        <div className="hidden items-center justify-end gap-[18px] lg:flex">
          {loading && (
            <div className={`flex size-[50px] shrink-0 items-center justify-center rounded-full ${iconBg} text-green-500`}>
              <AsteriskIcon className="size-6 animate-spin" />
            </div>
          )}
          {icons && (
            <>
              <div className={`flex size-[50px] shrink-0 items-center justify-center rounded-full ${iconBg} text-neutral-50`}>
                <CloudSavedIcon className="size-5" />
              </div>
              <div className={`flex size-[50px] shrink-0 items-center justify-center rounded-full ${iconBg} text-neutral-50`}>
                <ProfileIcon className="size-5" />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="hidden lg:block" />
      )}
    </div>
  )
}
