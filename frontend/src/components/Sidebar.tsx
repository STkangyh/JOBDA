import type { ComponentType } from 'react'
import brandLogo from '../assets/brand-logo.png'
import { AppsIcon, SearchIcon, WorkIcon, ClockLoaderIcon, DatabaseIcon, MailIcon, EditIcon, type IconProps } from './icons'

export type SidebarItem = 'apps' | 'search' | 'work' | 'history' | 'data' | 'message' | 'memo'

interface SidebarProps {
  /** 윗줄 아이콘 그룹 — 화면마다 실제로 다름(get_screenshot 재확인 결과). 기본값은 브리프 기준. */
  topItems?: readonly SidebarItem[]
  active?: SidebarItem
  onSelect?: (item: SidebarItem) => void
  className?: string
}

const ICON: Record<SidebarItem, ComponentType<IconProps>> = {
  apps: AppsIcon,
  search: SearchIcon,
  work: WorkIcon,
  history: ClockLoaderIcon,
  data: DatabaseIcon,
  message: MailIcon,
  memo: EditIcon,
}

// 실제 라우트가 있는 목적지만 연결 — 나머지(search/work/data/message/memo)는 대응하는 화면이
// 아직 없어서 시각적 상태만 있고 클릭해도 아무 데도 안 감(가짜 링크를 만들지 않음).
const ROUTE: Partial<Record<SidebarItem, string>> = {
  apps: '/',
  history: '/journey-map',
}

const BOTTOM_ITEMS: readonly SidebarItem[] = ['data', 'message', 'memo']

function NavButton({
  item,
  active,
  onSelect,
}: {
  item: SidebarItem
  active: boolean
  onSelect?: (item: SidebarItem) => void
}) {
  const Icon = ICON[item]
  const href = ROUTE[item]
  return (
    <button
      type="button"
      onClick={() => {
        onSelect?.(item)
        if (href) window.location.href = href
      }}
      className={`flex size-14 shrink-0 items-center justify-center transition-colors ${
        active ? 'text-green-500' : 'text-green-50 hover:text-green-200'
      }`}
    >
      <Icon className="size-5" />
    </button>
  )
}

// Figma "GNB" component — get_screenshot으로 화면별 사이드바를 하나씩 확대 재확인해보니
// 윗줄 구성이 화면마다 실제로 다름(이 섹션 특유의 프레임 간 불일치):
//   브리프(744:15857): apps/search/history
//   자료함(744:17197)·라운드(744:16874)·탐색(744:23143): apps/work/history
//   리포트(744:17446): apps/search/work/history
// 아랫줄(data/message/memo)은 모든 프레임에서 동일해서 고정. 화면마다 topItems로 넘겨서
// 맞추고, 기본값은 가장 먼저 확인했던 브리프 기준.
export function Sidebar({
  topItems = ['apps', 'search', 'history'],
  active = 'apps',
  onSelect,
  className = '',
}: SidebarProps) {
  return (
    <nav className={`flex w-[83px] flex-col items-center gap-8 rounded-xl bg-neutral-900 p-2 ${className}`}>
      <img src={brandLogo} alt="JOB:SIM" className="aspect-square w-full shrink-0 rounded-[2px] object-cover" />
      <div className="flex w-full flex-col items-center gap-2">
        <div className="flex flex-col items-center">
          {topItems.map((item) => (
            <NavButton key={item} item={item} active={active === item} onSelect={onSelect} />
          ))}
        </div>
        <div className="h-px w-full shrink-0 bg-neutral-700" />
        <div className="flex flex-col items-center">
          {BOTTOM_ITEMS.map((item) => (
            <NavButton key={item} item={item} active={active === item} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </nav>
  )
}
