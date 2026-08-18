import bannerImg from '../assets/jobs/explore-banner.png'
import { SearchIcon, ProfileIcon } from './icons'

// Figma 배경 배너+검색+프로필 헤더 — Explore/Report 등 다크 풀블리드 화면 공용.
export function AppHeader() {
  return (
    <div
      className="flex items-center justify-end gap-4 rounded-lg bg-neutral-900 bg-cover bg-center px-6 py-5"
      style={{ backgroundImage: `url(${bannerImg})` }}
    >
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
