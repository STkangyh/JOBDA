import { SearchIcon, ProfileIcon } from './icons'

// 실측 결과(image 234/235) 배너 박스는 Hero 영역에 없어야 하는 요소였음 — 검색+프로필이
// 감싸는 패널/배경 이미지 없이 페이지 배경 위에 바로 떠 있는 형태로 수정.
export function AppHeader() {
  return (
    <div className="flex items-center justify-end gap-4">
      <div className="flex h-[50px] w-full max-w-[400px] items-center gap-2 rounded-full bg-neutral-700/80 px-4 text-neutral-300 backdrop-blur">
        <SearchIcon className="size-5" />
        <span className="text-body-md">직무 검색</span>
      </div>
      <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-green-500 text-neutral-900">
        <ProfileIcon className="size-5" />
      </div>
    </div>
  )
}
