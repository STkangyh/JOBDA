import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import brandLogo from '../assets/brand-logo.png'
import homeIcon from '../assets/gnb/home.svg'
import workIcon from '../assets/gnb/work.svg'
import reportIcon from '../assets/gnb/report.svg'
import libraryIcon from '../assets/gnb/library.svg'

export type WorkSidebarItem = 'home' | 'work' | 'report' | 'library'

// 업무 화면 전용 GNB — 라벨이 있는 이전 디자인(Figma "Component 231", 업무 페이지 2217:10065 등).
// 다른 화면은 라벨 없는 공통 GNB(Sidebar.tsx)를 쓰고, 업무 화면만 이 GNB를 쓴다(2026-10-13 결정).
// 아이콘 모양은 공통 GNB와 같은 Figma SVG를 마스크로 쓰고 색만 토큰으로 칠한다.
const ITEMS: { id: WorkSidebarItem; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: homeIcon },
  { id: 'work', label: 'Work', icon: workIcon },
  { id: 'report', label: 'Report', icon: reportIcon },
  { id: 'library', label: 'Library', icon: libraryIcon },
]

const maskStyle = (src: string): CSSProperties => ({
  maskImage: `url("${src}")`,
  WebkitMaskImage: `url("${src}")`,
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
})

interface WorkSidebarProps {
  active: WorkSidebarItem
  /** 화면마다 다르게 동작하는 항목(예: 자료함에서 Work → 업무 시작). 없으면 Home/Report만 기본 이동한다. */
  onSelect?: Partial<Record<WorkSidebarItem, () => void>>
}

const DEFAULT_ROUTE: Partial<Record<WorkSidebarItem, string>> = { home: '/', report: '/comprehensive-report' }

export function WorkSidebar({ active, onSelect = {} }: WorkSidebarProps) {
  const navigate = useNavigate()
  return (
    <nav
      aria-label="주 메뉴"
      className="flex h-full w-24 shrink-0 flex-col items-center gap-[clamp(12px,2.2svh,24px)] overflow-y-auto rounded-lg [scrollbar-width:none] bg-[rgba(1,1,1,0.75)] p-5 shadow-gnb backdrop-blur-gnb"
    >
      <img src={brandLogo} alt="JOB:DA" className="size-[54px] rounded-full object-cover" />
      <ul className="flex flex-col items-center gap-[clamp(4px,1.4svh,16px)]">
        {ITEMS.map((item) => {
          const isActive = active === item.id
          const handler = onSelect[item.id]
          const route = DEFAULT_ROUTE[item.id]
          const clickable = Boolean(handler || route) && !isActive
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={isActive ? 'page' : undefined}
                disabled={!clickable && !isActive}
                onClick={() => {
                  if (!clickable) return
                  if (handler) handler()
                  else if (route) navigate(route)
                }}
                className={`flex flex-col items-center rounded-lg text-body-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-green-700 disabled:cursor-default ${
                  isActive ? 'text-green-300' : clickable ? 'text-neutral-700 hover:text-neutral-500' : 'text-neutral-700'
                }`}
              >
                <span className="-mb-2 block size-14 bg-current" style={maskStyle(item.icon)} />
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
