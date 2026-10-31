import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { track } from '../lib/analytics'

// 처음 들어온 업무 화면에서 영역을 하나씩 짚어주는 안내(코치 마크) — Figma 자료 탐색 코치 마크(2344:18783~2346:19131),
// 시방서 초안 작성 코치 마크(2349:31979~2350:20643), 말풍선 컴포넌트(디자인 시스템 Component 250·255), 2026-10-31.
// 짚는 영역만 또렷하게 두고 나머지는 흐리게 덮는다. 영역은 data-coach="이름" 속성으로 찾는다.
// 브라우저당 한 번만 보여준다(Skip이나 마지막 Next로 끝내면 다시 안 나옴).

export interface CoachStep {
  /** 짚을 요소의 data-coach 값 */
  target: string
  title: string
  body: string
  /** 말풍선이 영역의 어느 쪽에 붙는지 */
  side: 'top' | 'bottom' | 'left' | 'right'
  /** 이 단계를 보여주기 전에 화면을 맞출 일(예: 업무 노트 탭 열기) */
  onEnter?: () => void
}

const seenKey = (id: string) => `jobda-coach-${id}`

function hasSeen(id: string) {
  try {
    return localStorage.getItem(seenKey(id)) === '1'
  } catch {
    return true
  }
}

function markSeen(id: string) {
  try {
    localStorage.setItem(seenKey(id), '1')
  } catch {
    // 저장소가 막히면 이번 방문에서만 닫힌다
  }
}

const TOOLTIP_WIDTH = 369
const GAP = 16

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

// 테스트에서는 기본으로 끈다 — 화면 전체를 덮어 다른 테스트의 조작을 가리므로. 전용 테스트는 enabled로 켠다.
export function CoachTour({ id, steps, enabled = import.meta.env.MODE !== 'test' }: { id: string; steps: CoachStep[]; enabled?: boolean }) {
  const [active, setActive] = useState(() => enabled && !hasSeen(id))
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const step = steps[index]

  const finish = useCallback(
    (action: 'skip' | 'done') => {
      track('coach', { tour: id, action, step: index + 1 })
      markSeen(id)
      setActive(false)
    },
    [id, index],
  )

  useEffect(() => {
    if (active) step?.onEnter?.()
  }, [active, step])

  // 대상 요소 위치를 따라간다(창 크기 변화·패널 펼침 등)
  useLayoutEffect(() => {
    if (!active || !step) return
    let frame = 0
    const measure = () => {
      const el = document.querySelector(`[data-coach="${step.target}"]`)
      if (!el) return setRect(null)
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }
    const loop = () => {
      measure()
      frame = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(frame)
  }, [active, step])

  useEffect(() => {
    if (!active) return
    nextRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish('skip')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, index, finish])

  if (!active || !step) return null

  const next = () => {
    if (index === steps.length - 1) return finish('done')
    track('coach', { tour: id, action: 'next', step: index + 1 })
    setIndex(index + 1)
  }

  const vw = window.innerWidth
  const vh = window.innerHeight
  const r = rect ?? { top: vh / 2, left: vw / 2, width: 0, height: 0 }
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const clampX = (x: number) => Math.min(Math.max(x, GAP), vw - TOOLTIP_WIDTH - GAP)

  const pos: React.CSSProperties =
    step.side === 'bottom'
      ? { top: r.top + r.height + GAP, left: clampX(cx - TOOLTIP_WIDTH / 2) }
      : step.side === 'top'
        ? { bottom: vh - r.top + GAP, left: clampX(cx - TOOLTIP_WIDTH / 2) }
        : step.side === 'left'
          ? { right: vw - r.left + GAP, top: cy, transform: 'translateY(-50%)' }
          : { left: r.left + r.width + GAP, top: cy, transform: 'translateY(-50%)' }

  // 말풍선 꼬리: 영역 쪽을 가리킨다
  const arrowX = Math.min(Math.max(cx - (typeof pos.left === 'number' ? pos.left : 0), 24), TOOLTIP_WIDTH - 24)
  const arrow: React.CSSProperties =
    step.side === 'bottom'
      ? { top: -7, left: arrowX - 7 }
      : step.side === 'top'
        ? { bottom: -7, left: arrowX - 7 }
        : step.side === 'left'
          ? { right: -7, top: 'calc(50% - 7px)' }
          : { left: -7, top: 'calc(50% - 7px)' }

  const veil = 'fixed bg-[rgba(160,160,160,0.35)] backdrop-blur-[6px]'

  return createPortal(
    <div className="fixed inset-0 z-50" aria-live="polite">
      {/* 짚는 영역을 뺀 네 면을 흐리게 덮고, 영역 자체는 또렷하되 누르지 못하게 투명 막을 둔다 */}
      <div className={veil} style={{ top: 0, left: 0, right: 0, height: Math.max(r.top, 0) }} />
      <div className={veil} style={{ top: r.top + r.height, left: 0, right: 0, bottom: 0 }} />
      <div className={veil} style={{ top: r.top, left: 0, width: Math.max(r.left, 0), height: r.height }} />
      <div className={veil} style={{ top: r.top, left: r.left + r.width, right: 0, height: r.height }} />
      <div className="fixed" style={{ top: r.top, left: r.left, width: r.width, height: r.height }} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coach-title"
        aria-describedby="coach-body"
        className="fixed rounded-2xl bg-neutral-100 shadow-[0_0_16px_rgba(0,0,0,0.12)]"
        style={{ width: TOOLTIP_WIDTH, ...pos }}
      >
        <span aria-hidden className="absolute size-3.5 rotate-45 bg-neutral-100" style={arrow} />
        <div className="relative flex flex-col gap-2 px-6 pt-6 pb-4">
          <p id="coach-title" className="text-title-md font-semibold text-neutral-900">
            {step.title}
          </p>
          <p id="coach-body" className="text-body-md text-neutral-600">
            {step.body}
          </p>
        </div>
        <div className="relative flex overflow-hidden rounded-b-2xl bg-neutral-50">
          <button type="button" onClick={() => finish('skip')} className="h-12 flex-1 text-body-lg font-medium text-neutral-500 hover:text-neutral-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-green-700">
            Skip
          </button>
          <button
            ref={nextRef}
            type="button"
            onClick={next}
            className="h-12 flex-1 text-body-lg font-medium text-neutral-500 hover:text-neutral-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-green-700"
          >
            Next
          </button>
        </div>
        <span className="sr-only">
          {index + 1} / {steps.length}
        </span>
      </div>
    </div>,
    document.body,
  )
}
