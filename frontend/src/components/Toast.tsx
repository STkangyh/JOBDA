import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// 화면 아래쪽에 잠깐 떴다 사라지는 짧은 안내(예: "준비 중이에요"). 화면낭독기에도 읽히게 status 역할을 준다.

const SHOW_MS = 2400

export function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = useCallback((text: string) => {
    clearTimeout(timer.current)
    setMessage(text)
    timer.current = setTimeout(() => setMessage(null), SHOW_MS)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const toast = createPortal(
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4">
      {message && (
        <p className="rounded-[80px] bg-neutral-800 px-6 py-3 text-body-lg font-medium text-neutral-100 shadow-[0_0_16px_rgba(0,0,0,0.24)] motion-safe:animate-story-fade">
          {message}
        </p>
      )}
    </div>,
    document.body,
  )

  return { show, toast }
}
