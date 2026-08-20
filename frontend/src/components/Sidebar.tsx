import type { ComponentType } from 'react'
import brandLogo from '../assets/brand-logo.png'
import { AppsIcon, SearchIcon, HomeRepairServiceIcon, DataUsageIcon, DatabaseIcon, MailIcon, EditIcon, type IconProps } from './icons'
import { useSession } from '../store/session'

export type SidebarItem = 'apps' | 'search' | 'work' | 'history' | 'data' | 'message' | 'memo'

interface SidebarProps {
  /** 윗줄 아이콘 그룹 — 화면마다 실제로 다름(get_screenshot 재확인 결과). 기본값은 브리프 기준. */
  topItems?: readonly SidebarItem[]
  active?: SidebarItem
  onSelect?: (item: SidebarItem) => void
  className?: string
}

// Figma 컴포넌트 시트(703:34358)의 실제 glyph 이름: work="home_repair_service"(공구가방),
// history="data_usage"(원형 링). 예전엔 다른 곳(Explore 배지)에서 쓰던 WorkIcon/ClockLoaderIcon을
// 그대로 재사용했는데 모양이 달라서 여기 전용으로 정확한 path를 다시 만듦.
const ICON: Record<SidebarItem, ComponentType<IconProps>> = {
  apps: AppsIcon,
  search: SearchIcon,
  work: HomeRepairServiceIcon,
  history: DataUsageIcon,
  data: DatabaseIcon,
  message: MailIcon,
  memo: EditIcon,
}

// 실제 라우트가 있는 목적지만 연결 — 나머지(search/work/message/memo)는 대응하는 화면이
// 아직 없어서 시각적 상태만 있고 클릭해도 아무 데도 안 감(가짜 링크를 만들지 않음).
// data는 Figma 823:57686(Desktop-116, 세션2 자료함)에서 Pressed 상태로 확인돼 세션2의
// materials 스테이지로 연결(아래 NavButton의 data 특수 처리 참고). history(네비게이션바
// 세번째 아이콘)는 진행 상태와 무관하게 항상 종합 리포트 탭으로 연결 — 아직 아무 세션도
// 안 끝났으면 ComprehensiveReport 자체가 안내/이어하기 화면을 보여준다(체험맵으로 대신
// 보내지 않음, 사용자 명시적 요청).
const ROUTE: Partial<Record<SidebarItem, string>> = {
  apps: '/',
  history: '/comprehensive-report',
  data: '/session2',
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
  // 세션2 스토어를 여기서 직접 건드리는 유일한 예외 — data는 세션2 자료함(materials
  // 스테이지)으로 가는 지름길이라, 다른 화면(세션1/탐색)에서 눌러도 세션2 진행 중이던
  // 스테이지를 덮어쓰고 이동한다(재입장 시 자료함부터 다시 보게 됨, 되돌릴 방법 있음).
  const goToMaterials = useSession((s) => s.goTo)
  return (
    <button
      type="button"
      onClick={() => {
        onSelect?.(item)
        if (item === 'data') goToMaterials('materials')
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
