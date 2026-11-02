import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import closeIcon from '../assets/work/close.svg'
import { Indicator } from './Indicator'
import { WorkSidebar, type WorkSidebarItem } from './WorkSidebar'
import { ArrowBackIosIcon } from './icons'
import { LoadingSpinner } from './LoadingSpinner'
import { stageNeighbors, useSession } from '../store/session'
import { track } from '../lib/analytics'

// 세션2 업무 화면 공통 틀 — Figma 업무 페이지(2217:10065~11438, 2026-10-13).
// 회색 배경 + 라벨형 GNB + 위쪽 진행 표시 + 오른쪽 위(로딩 표시 · 저장 상태 · 나가기).
// 오른쪽 위: 로딩 표시 · 이전/다음 단계 이동(◀ ▶) · 나가기(✕) — 업무 페이지 새 디자인(2342:15295 등, 2026-10-31).
// 예전 자리표시("Text") 자리에 두었던 저장 상태 알약은 새 디자인에서 빠져 지웠다.
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
  /** 세션2 단계 사이 ◀ ▶ 이동을 보여줄지(세션 밖 화면인 체험맵은 false) */
  stageNav?: boolean
  children: ReactNode
}

export function WorkFrame({ step, sidebar, onSidebarSelect, loading = false, exitStep, flushRight = false, stageNav = true, children }: WorkFrameProps) {
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
          <div data-coach="progress" className="absolute top-[clamp(28px,5.2svh,58px)] left-1/2 w-[min(855px,calc(100%-420px))] -translate-x-[calc(50%+79.5px)]">
            <Indicator current={step} tone="gray" />
          </div>
          {loading && <LoadingSpinner />}
          <div data-coach="stage-nav" className="flex items-center gap-3">
            {stageNav && <StageNav disabled={loading} />}
            <button type="button" onClick={exit} aria-label="업무 나가기" className="size-14 shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-green-700">
              <img src={closeIcon} alt="" width={56} height={56} className="size-14" />
            </button>
          </div>
        </header>

        <div className={`flex min-h-0 flex-1 gap-4 pt-[clamp(16px,4svh,44px)] pb-[clamp(16px,3svh,32px)] ${flushRight ? '' : 'pr-8'}`}>{children}</div>
      </div>
    </div>
  )
}

// ◀ 이전 단계 / ▶ 다음 단계 — 이미 도달한 단계 안에서만 오간다(store stageNeighbors).
function StageNav({ disabled }: { disabled: boolean }) {
  // 객체를 돌려주는 선택자는 매번 새 값이라 무한 렌더링이 나서, 단계 이름(문자열)만 따로 고른다
  const prev = useSession((s) => stageNeighbors(s).prev)
  const next = useSession((s) => stageNeighbors(s).next)
  const neighbors = { prev, next }
  const goTo = useSession((s) => s.goTo)
  const move = (dir: 'prev' | 'next') => {
    const to = neighbors[dir]
    if (!to) return
    track('stage_nav', { dir, to })
    goTo(to)
  }
  const half = 'flex size-14 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-700 disabled:cursor-default disabled:text-neutral-400 focus-visible:outline-2 focus-visible:outline-green-700'
  return (
    <div className="flex h-14 items-center overflow-hidden rounded-full border-2 border-[rgba(225,225,225,0.5)] bg-[rgba(245,245,245,0.5)] shadow-gnb backdrop-blur-gnb">
      <button type="button" aria-label="이전 단계" disabled={disabled || !neighbors.prev} onClick={() => move('prev')} className={half}>
        <ArrowBackIosIcon className="h-5 w-3" />
      </button>
      <span aria-hidden className="h-full w-0.5 bg-neutral-400" />
      <button type="button" aria-label="다음 단계" disabled={disabled || !neighbors.next} onClick={() => move('next')} className={half}>
        <ArrowBackIosIcon className="h-5 w-3 rotate-180" />
      </button>
    </div>
  )
}

/** 업무 화면의 반투명 흰 카드 (Figma rgba(250,250,250,0.85) + Blur/16) */
export function WorkPanel({ className = '', padded = true, coach, children }: { className?: string; padded?: boolean; coach?: string; children: ReactNode }) {
  return (
    <section data-coach={coach} className={`rounded-lg bg-[rgba(250,250,250,0.85)] shadow-gnb backdrop-blur-panel ${padded ? 'p-8' : ''} ${className}`}>
      {children}
    </section>
  )
}

