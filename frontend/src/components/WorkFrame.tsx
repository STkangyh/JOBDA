import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import closeIcon from '../assets/work/close.svg'
import { Indicator } from './Indicator'
import { WorkSidebar, type WorkSidebarItem } from './WorkSidebar'
import { AsteriskIcon } from './icons'
import { track } from '../lib/analytics'

// 세션2 업무 화면 공통 틀 — Figma 업무 페이지(2217:10065~11438, 2026-10-13).
// 회색 배경 + 라벨형 GNB + 위쪽 진행 표시 + 오른쪽 위(로딩 표시 · 저장 상태 · 나가기).
// 오른쪽 위 회색 알약은 Figma 자리표시("Text")라 저장 상태 표시로 정했다(2026-10-13 결정).
// TODO: 배경 점 무늬는 디자인 파일에 내보낼 수 있는 이미지가 없어 단색(Neutral/500)으로 둔다.
interface WorkFrameProps {
  step: string
  sidebar: WorkSidebarItem
  onSidebarSelect?: Partial<Record<WorkSidebarItem, () => void>>
  /** 제출·생성 같은 비동기 작업 중이면 별표 로딩 표시를 띄운다(Figma 로딩 화면 2217:10180 등). */
  loading?: boolean
  /** 나가기(✕) 기록에 남길 단계 이름 */
  exitStep: string
  /** 메신저처럼 화면 오른쪽 끝에 붙는 패널이 있으면 오른쪽 여백을 없앤다(Figma 2217:10088) */
  flushRight?: boolean
  children: ReactNode
}

export function WorkFrame({ step, sidebar, onSidebarSelect, loading = false, exitStep, flushRight = false, children }: WorkFrameProps) {
  const navigate = useNavigate()

  // 브리프 Exit와 같은 "명시적 종료" — 관리자 페이지에서 세션 상태가 '명시적 종료'로 집계된다.
  const exit = () => {
    track('session_exit', { step: exitStep })
    navigate('/')
  }

  return (
    // 창 높이에 고정 — 페이지는 세로로 스크롤되지 않고, 긴 내용은 각 칸 안에서 스크롤한다(2026-10-13 결정).
    <div className="flex h-svh overflow-hidden bg-neutral-500">
      <div className="flex h-full w-40 shrink-0 px-8 pt-[clamp(24px,5svh,56px)] pb-[clamp(16px,3svh,32px)]">
        <WorkSidebar active={sidebar} onSelect={onSidebarSelect} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="relative flex h-[clamp(80px,10svh,110px)] shrink-0 items-center justify-end gap-3 px-8 pt-[clamp(24px,5svh,54px)]">
          <Indicator current={step} tone="gray" className="absolute top-[clamp(28px,5.2svh,58px)] left-1/2 w-[min(855px,calc(100%-420px))] -translate-x-[calc(50%+79.5px)]" />
          {loading && (
            <span className="flex size-14 items-center justify-center rounded-full bg-neutral-900 text-green-500" role="status" aria-label="처리 중">
              <AsteriskIcon className="size-6 animate-spin" />
            </span>
          )}
          <span className="flex h-14 items-center rounded-[32px] border-2 border-[rgba(225,225,225,0.5)] bg-[rgba(245,245,245,0.5)] px-6 text-title-md font-semibold text-neutral-500 shadow-gnb backdrop-blur-gnb">
            {loading ? '저장 중' : '자동 저장됨'}
          </span>
          <button type="button" onClick={exit} aria-label="업무 나가기" className="size-14 shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-green-700">
            <img src={closeIcon} alt="" width={56} height={56} className="size-14" />
          </button>
        </header>

        <div className={`flex min-h-0 flex-1 gap-4 pt-[clamp(16px,4svh,44px)] pb-[clamp(16px,3svh,32px)] ${flushRight ? '' : 'pr-8'}`}>{children}</div>
      </div>
    </div>
  )
}

/** 업무 화면의 반투명 흰 카드 (Figma rgba(250,250,250,0.85) + Blur/16) */
export function WorkPanel({ className = '', padded = true, children }: { className?: string; padded?: boolean; children: ReactNode }) {
  return <section className={`rounded-lg bg-[rgba(250,250,250,0.85)] shadow-gnb backdrop-blur-panel ${padded ? 'p-8' : ''} ${className}`}>{children}</section>
}
