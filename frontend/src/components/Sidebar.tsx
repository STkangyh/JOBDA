import type { ComponentType } from 'react'
import brandLogo from '../assets/brand-logo.png'
import { AppsIcon, SearchIcon, DatabaseIcon, MailIcon, EditIcon, type IconProps } from './icons'

export type SidebarItem = 'apps' | 'search' | 'data' | 'message' | 'memo'

interface SidebarProps {
  active?: SidebarItem
  onSelect?: (item: SidebarItem) => void
  className?: string
}

const ICON: Record<SidebarItem, ComponentType<IconProps>> = {
  apps: AppsIcon,
  search: SearchIcon,
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

// Figma "GNB" component (494:1633 / 652:17421) — dark sidebar nav. 5 destinations map to
// generic slots (apps/search/data/message/memo); actual screen routing isn't wired yet.
export function Sidebar({ active = 'apps', onSelect, className = '' }: SidebarProps) {
  return (
    <nav className={`flex w-[83px] flex-col items-center gap-8 rounded-xl bg-neutral-900 p-2 ${className}`}>
      <img src={brandLogo} alt="JOB:SIM" className="aspect-square w-full shrink-0 rounded-[2px] object-cover" />
      <div className="flex w-full flex-col items-center gap-2">
        <div className="flex flex-col items-center">
          <NavButton item="apps" active={active === 'apps'} onSelect={onSelect} />
          <NavButton item="search" active={active === 'search'} onSelect={onSelect} />
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
