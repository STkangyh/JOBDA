import type { ComponentType } from 'react'
import brandLogo from '../assets/brand-logo.png'
import { AppsIcon, SearchIcon, WorkIcon, ClockLoaderIcon, DatabaseIcon, MailIcon, EditIcon, type IconProps } from './icons'

export type SidebarItem = 'apps' | 'search' | 'work' | 'history' | 'data' | 'message' | 'memo'

interface SidebarProps {
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
  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      className={`flex size-14 shrink-0 items-center justify-center transition-colors ${
        active ? 'text-green-500' : 'text-green-50 hover:text-green-200'
      }`}
    >
      <Icon className="size-5" />
    </button>
  )
}

// Figma "GNB" component (494:1633 / 652:17421, 743:...) — dark sidebar nav. get_screenshot 재확인
// 결과 실제로는 7개 아이콘: apps/search/work/history(윗줄 4개) + data/message/memo(divider 아래
// 3개). 이전엔 work/history 2개가 빠져 5개짜리였음. 실제 화면 라우팅은 아직 안 걸려 있음.
export function Sidebar({ active = 'apps', onSelect, className = '' }: SidebarProps) {
  return (
    <nav className={`flex w-[83px] flex-col items-center gap-8 rounded-xl bg-neutral-900 p-2 ${className}`}>
      <img src={brandLogo} alt="JOB:SIM" className="aspect-square w-full shrink-0 rounded-[2px] object-cover" />
      <div className="flex w-full flex-col items-center gap-2">
        <div className="flex flex-col items-center">
          <NavButton item="apps" active={active === 'apps'} onSelect={onSelect} />
          <NavButton item="search" active={active === 'search'} onSelect={onSelect} />
          <NavButton item="work" active={active === 'work'} onSelect={onSelect} />
          <NavButton item="history" active={active === 'history'} onSelect={onSelect} />
        </div>
        <div className="h-px w-full shrink-0 bg-neutral-700" />
        <div className="flex flex-col items-center">
          <NavButton item="data" active={active === 'data'} onSelect={onSelect} />
          <NavButton item="message" active={active === 'message'} onSelect={onSelect} />
          <NavButton item="memo" active={active === 'memo'} onSelect={onSelect} />
        </div>
      </div>
    </nav>
  )
}
