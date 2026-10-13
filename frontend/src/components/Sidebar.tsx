import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import brandLogo from '../assets/brand-logo.png'
import homeIcon from '../assets/gnb/home.svg'
import workIcon from '../assets/gnb/work.svg'
import reportIcon from '../assets/gnb/report.svg'
import profileIcon from '../assets/gnb/profile.svg'

export type SidebarItem = 'home' | 'work' | 'report'

interface SidebarProps {
  active?: SidebarItem
  onSelect?: (item: SidebarItem) => void
  className?: string
}

// 공통 GNB — Figma "첫 방문 · Welcome splash"(2217:9806, 2026-10-13)의 GNB를 기준으로 한다.
// 디자인 시스템 GNB(2006:37878, 라벨 + Library 포함)에서 다시 바뀌어: 위쪽에 로고와 프로필 버튼,
// 가운데에 라벨 없는 아이콘 3개(Home/Work/Report). Library는 빠졌다.
// 아이콘은 Figma SVG를 모양(마스크)으로만 쓰고 색은 토큰으로 칠한다 — 기본/활성 SVG의 path가
// 완전히 같고 fill만 달라서(활성 Green/400 #CFF5AA, 기본 Neutral/600 #8E8E8E) 모양은 원본 그대로다.
const ITEMS: { id: SidebarItem; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: homeIcon },
  { id: 'work', label: 'Work', icon: workIcon },
  { id: 'report', label: 'Report', icon: reportIcon },
]

// 실제 화면이 있는 목적지만 연결한다(가짜 링크를 만들지 않음). Work는 대응 화면이 아직 없어 표시만 한다.
const ROUTE: Partial<Record<SidebarItem, string>> = {
  // 루트(/)는 로그인 상태에 따라 온보딩·로그인으로 보내는 진입 분기라, 앱 안의 홈은 탐색 홈(/explore)으로 바로 간다
  home: '/explore',
  report: '/comprehensive-report',
}

// Vite가 작은 SVG를 data URI로 넣는데 그 안에 공백·따옴표가 있어서 url()을 따옴표로 감싸야 한다.
const maskStyle = (src: string): CSSProperties => ({
  maskImage: `url("${src}")`,
  WebkitMaskImage: `url("${src}")`,
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
})

export function Sidebar({ active = 'home', onSelect, className = '' }: SidebarProps) {
  const navigate = useNavigate()

  return (
    <nav
      aria-label="주 메뉴"
      className={`relative flex w-24 shrink-0 flex-col items-center justify-center overflow-clip rounded-lg bg-[rgba(44,44,44,0.75)] p-5 shadow-gnb backdrop-blur-gnb ${className}`}
    >
      <div className="absolute top-[22px] left-[22px] flex w-[54px] flex-col gap-6">
        <button
          type="button"
          onClick={() => navigate('/explore')}
          aria-label="홈으로"
          className="size-[54px] rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
        >
          <img src={brandLogo} alt="" className="size-[54px] rounded-full bg-neutral-800 object-cover" />
        </button>
        {/* 프로필: 로그인 화면이 나오기 전까지는 모양만 둔다(2026-10-13 결정) */}
        <span className="flex size-[54px] items-center justify-center rounded-full bg-green-400 backdrop-blur-panel" aria-hidden>
          <img src={profileIcon} alt="" width={20} height={20} className="size-5" />
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {ITEMS.map((item) => {
          const isActive = active === item.id
          const href = ROUTE[item.id]
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  onSelect?.(item.id)
                  if (href) navigate(href)
                }}
                className={`block rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-green-700 ${
                  isActive ? 'text-green-400' : 'text-neutral-600 hover:text-neutral-500'
                }`}
              >
                <span className="block size-14 bg-current" style={maskStyle(item.icon)} />
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
