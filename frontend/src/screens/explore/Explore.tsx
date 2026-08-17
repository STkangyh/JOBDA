import illustration from '../../assets/illustrations/illustration-desk-work.svg'
import { Sidebar } from '../../components/Sidebar'
import { Text } from '../../components/Text'
import { SearchIcon, ProfileIcon } from '../../components/icons'

// Figma 탐색 페이지 — 오류 페이지 프레임(652:28355) 배경에서 발견한 실제 콘텐츠 기준.
// 원본은 "New Arrival" 캐로셀 + "인기 직무 Top 10" 그리드로 여러 직무를 보여주지만, 지금 앱엔
// 실제로 만들어진 직무가 하나(생활 가전 제품디자이너)뿐이라 가짜 목록 대신 그 하나만 보여줌.
export function Explore({ onOpenJob }: { onOpenJob: () => void }) {
  return (
    <div className="flex min-h-svh gap-6 bg-neutral-950 p-6">
      <Sidebar active="apps" />

      <div className="flex flex-1 flex-col gap-8">
        <div className="flex items-center justify-end gap-4">
          <div className="flex h-[50px] w-full max-w-[400px] items-center gap-2 rounded-full bg-neutral-800 px-4 text-neutral-300">
            <SearchIcon className="size-5" />
            <span className="text-body-md">직무 검색</span>
          </div>
          <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-green-500 text-neutral-900">
            <ProfileIcon className="size-5" />
          </div>
        </div>

        <div>
          <Text variant="title-lg" emphasis className="mb-4 text-neutral-100">
            New Arrival
          </Text>
          <button
            type="button"
            onClick={onOpenJob}
            className="relative flex h-[310px] w-full max-w-md flex-col justify-end overflow-hidden rounded-lg bg-neutral-800 p-6 text-left transition-opacity hover:opacity-90"
          >
            <img
              src={illustration}
              alt=""
              className="pointer-events-none absolute inset-0 size-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/10 to-transparent" />
            <Text variant="title-lg" emphasis className="relative text-green-50">
              생활 가전 제품디자이너
            </Text>
          </button>
        </div>
      </div>
    </div>
  )
}
