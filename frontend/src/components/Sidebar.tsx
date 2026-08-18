import type { ComponentType } from 'react'
import brandLogo from '../assets/brand-logo.png'
import { AppsIcon, SearchIcon, ClockLoaderIcon, DatabaseIcon, MailIcon, EditIcon, type IconProps } from './icons'

export type SidebarItem = 'apps' | 'search' | 'history' | 'data' | 'message' | 'memo'

interface SidebarProps {
  active?: SidebarItem
  onSelect?: (item: SidebarItem) => void
  className?: string
}

const ICON: Record<SidebarItem, ComponentType<IconProps>> = {
  apps: AppsIcon,
  search: SearchIcon,
  history: ClockLoaderIcon,
  data: DatabaseIcon,
  message: MailIcon,
  memo: EditIcon,
}

// 실제 라우트가 있는 목적지만 연결 — 나머지(search/data/message/memo)는 대응하는 화면이
// 아직 없어서 시각적 상태만 있고 클릭해도 아무 데도 안 감(가짜 링크를 만들지 않음).
const ROUTE: Partial<Record<SidebarItem, string>> = {
  apps: '/',
  history: '/journey-map',
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

// Figma "GNB" component — get_screenshot으로 744:15857(브리프) 사이드바를 확대 재확인한 결과
// 실제 아이콘은 6개: apps/search/history(윗줄 3개, history는 원형 로더=data_usage) +
// data/message/memo(divider 아래 3개). 이전에 다른 프레임(리포트, 744:17446) 기준으로
// 추가했던 7번째 아이콘(work/브리프케이스)은 이 프레임엔 없어서 제거함 — 두 프레임의
// 사이드바 구성이 서로 다른, 이 Figma 섹션 특유의 불일치로 보임(브리프 쪽을 기준으로 통일).
// apps(탐색 페이지)/history(체험맵)는 실제 라우트가 있어 클릭 시 이동, 나머지 3개는 대응
// 화면이 없어 시각적 상태만 유지.
export function Sidebar({ active = 'apps', onSelect, className = '' }: SidebarProps) {
  return (
    <nav className={`flex w-[83px] flex-col items-center gap-8 rounded-xl bg-neutral-900 p-2 ${className}`}>
      <img src={brandLogo} alt="JOB:SIM" className="aspect-square w-full shrink-0 rounded-[2px] object-cover" />
      <div className="flex w-full flex-col items-center gap-2">
        <div className="flex flex-col items-center">
          <NavButton item="apps" active={active === 'apps'} onSelect={onSelect} />
          <NavButton item="search" active={active === 'search'} onSelect={onSelect} />
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
