import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EXIT_NOTE_MAX, EXIT_REASONS, type ExitReasonId } from '../data/exitReasons'
import checkedIcon from '../assets/work/exit-reason-on.svg'
import uncheckedIcon from '../assets/work/exit-reason-off.svg'

export interface ExitAnswer {
  /** 고른 이유(여러 개, 안 골라도 나갈 수 있다) */
  reasons: ExitReasonId[]
  /** "기타"를 골랐을 때 직접 쓴 이유 */
  note: string
}

// 업무 중 나가기 확인 창 (2026-11-02 결정, 이유 선택은 Figma 2454:18645·18649·18690)
// ✕를 실수로 눌러도 바로 나가지 않게 한 번 묻고, 그만두는 이유를 고르게 한다.
// "나가기"를 눌렀을 때만 UT 기록의 '명시적 종료'로 남는다.
export function ExitConfirm({ open, onStay, onLeave }: { open: boolean; onStay: () => void; onLeave: (answer: ExitAnswer) => void }) {
  if (!open) return null
  // 열 때마다 새로 그려서 지난번 선택이 남지 않게 한다
  return createPortal(<ExitConfirmCard onStay={onStay} onLeave={onLeave} />, document.body)
}

function ExitConfirmCard({ onStay, onLeave }: { onStay: () => void; onLeave: (answer: ExitAnswer) => void }) {
  const stayRef = useRef<HTMLButtonElement>(null)
  const [reasons, setReasons] = useState<ExitReasonId[]>([])
  const [note, setNote] = useState('')
  const otherChecked = reasons.includes('other')

  useEffect(() => {
    stayRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onStay])

  const toggle = (id: ExitReasonId) =>
    setReasons((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : EXIT_REASONS.map((r) => r.id).filter((r) => r === id || prev.includes(r))))

  const leave = () => onLeave({ reasons, note: otherChecked ? note.trim() : '' })

  const button =
    'h-12 flex-1 bg-neutral-50 text-title-md font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-green-700'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(160,160,160,0.35)] px-4 backdrop-blur-[6px]" onClick={onStay}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="exit-title"
        aria-describedby="exit-body"
        onClick={(e) => e.stopPropagation()}
        className="flex w-[369px] max-w-full flex-col gap-6 overflow-hidden rounded-2xl bg-neutral-100 shadow-[0_0_16px_rgba(0,0,0,0.12)]"
      >
        <div className="flex flex-col gap-2.5 px-6 pt-6">
          <p id="exit-title" className="text-title-lg font-semibold text-neutral-900">
            체험을 그만둘까요?
          </p>
          <p id="exit-body" className="text-body-lg text-neutral-700">
            지금까지 한 내용은 저장돼요.
            <br />
            탐색 홈에서 언제든 이어갈 수 있어요.
            <br />
            체험을 그만두는 이유를 알려주세요.
          </p>
        </div>

        <fieldset className="flex flex-col gap-1.5 px-6">
          <legend className="sr-only">체험을 그만두는 이유</legend>
          {EXIT_REASONS.map((r) => {
            const checked = reasons.includes(r.id)
            return (
              <label key={r.id} className="group flex w-fit cursor-pointer items-center gap-2">
                <input type="checkbox" checked={checked} onChange={() => toggle(r.id)} className="peer sr-only" />
                <img
                  src={checked ? checkedIcon : uncheckedIcon}
                  alt=""
                  width={28}
                  height={28}
                  className="size-7 shrink-0 rounded-sm peer-focus-visible:outline-2 peer-focus-visible:outline-green-700"
                />
                <span className="text-body-lg text-neutral-800">{r.label}</span>
              </label>
            )
          })}
          {otherChecked && (
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={EXIT_NOTE_MAX}
              aria-label="기타 이유"
              autoFocus
              className="mx-1 h-[25px] border-b-3 border-neutral-500 bg-transparent text-body-lg text-neutral-800 outline-none focus:border-neutral-700"
            />
          )}
        </fieldset>

        <div className="flex">
          <button ref={stayRef} type="button" onClick={onStay} className={`${button} text-neutral-500 hover:text-neutral-700`}>
            계속하기
          </button>
          <button type="button" onClick={leave} className={`${button} text-error-200 hover:text-error-300`}>
            나가기
          </button>
        </div>
      </div>
    </div>
  )
}
