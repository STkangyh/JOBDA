import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// 업무 중 나가기 확인 창 (2026-11-02 결정) — ✕를 실수로 눌러도 바로 나가지 않게 한 번 묻는다.
// "나가기"를 눌렀을 때만 UT 기록의 '명시적 종료'로 남는다. 디자인이 없어 코치 마크와 같은 말풍선 카드 모양을 쓴다.
export function ExitConfirm({ open, onStay, onLeave }: { open: boolean; onStay: () => void; onLeave: () => void }) {
  const stayRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    stayRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onStay])

  if (!open) return null

  const button = 'h-12 flex-1 text-body-lg font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-green-700'

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(160,160,160,0.35)] px-4 backdrop-blur-[6px]" onClick={onStay}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="exit-title"
        aria-describedby="exit-body"
        onClick={(e) => e.stopPropagation()}
        className="w-[369px] max-w-full overflow-hidden rounded-2xl bg-neutral-100 shadow-[0_0_16px_rgba(0,0,0,0.12)]"
      >
        <div className="flex flex-col gap-2 px-6 pt-6 pb-4">
          <p id="exit-title" className="text-title-md font-semibold text-neutral-900">
            체험을 그만둘까요?
          </p>
          <p id="exit-body" className="text-body-md text-neutral-600">
            지금까지 한 내용은 저장돼요. 탐색 홈에서 언제든 이어서 할 수 있어요.
          </p>
        </div>
        <div className="flex bg-neutral-50">
          <button ref={stayRef} type="button" onClick={onStay} className={`${button} text-neutral-700 hover:text-neutral-900`}>
            계속하기
          </button>
          <button type="button" onClick={onLeave} className={`${button} text-error-300 hover:text-error-200`}>
            나가기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
