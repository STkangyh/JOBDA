import { useState } from 'react'

// 임시 개발용 도구 — 세션 플로우를 처음부터 다시 밟지 않고 특정 단계로 바로 점프해서
// 테스트/데모하기 위한 버튼. Figma 근거 없음, 나중에 필요 없어지면 통째로 지우면 됨.
interface StageJumperProps<T extends string> {
  stages: { value: T; label: string }[]
  current: T
  onJump: (stage: T) => void
}

export function StageJumper<T extends string>({ stages, current, onJump }: StageJumperProps<T>) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50 hidden">
      {open && (
        <div className="flex max-w-[220px] flex-col gap-1 rounded-lg border border-dashed border-amber-400 bg-neutral-900/95 p-2 shadow-xl">
          {stages.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                onJump(s.value)
                setOpen(false)
              }}
              className={`rounded px-3 py-1.5 text-left text-sm transition-colors ${
                s.value === current
                  ? 'bg-amber-400 text-neutral-900'
                  : 'text-neutral-200 hover:bg-neutral-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-dashed border-amber-400 bg-neutral-900/95 px-4 py-2 text-sm text-amber-300 shadow-xl"
      >
        🧭 단계 이동
      </button>
    </div>
  )
}
