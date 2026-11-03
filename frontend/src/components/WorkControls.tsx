// 업무 화면 양식 오른쪽 위의 조작 — 업무 페이지 새 디자인(2342:15295·2266:14344 등, 2026-10-31).
// 큰 "제출" 버튼 자리에 모범답안 칩 + 둥근 보내기 버튼(디자인 시스템 Send)이 들어갔다.

function PaperPlaneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3 3.5 17.5 10 3 16.5l2.2-6.5L3 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M5.2 10H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/** 제출(보내기). 다 채우면 연두색으로 켜진다. label은 화면낭독기용 동작 이름(예: "초안 제출"). */
export function SendRoundButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-[42px] shrink-0 items-center justify-center rounded-full border-2 border-green-200 bg-green-400 text-green-900 drop-shadow-[0_0_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:border-neutral-100 disabled:bg-green-50 disabled:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
    >
      <PaperPlaneIcon />
    </button>
  )
}

/**
 * 모범답안 칩. onToggle이 있으면 누를 때마다 모범답안 보기를 켜고 끈다(시방서 작성, 2026-11-03).
 * 모범답안 내용이 아직 없는 화면(2차 피드백, 외주 조사)은 onToggle 없이 써서 "준비 중"으로 둔다.
 */
export function ModelAnswerChip({ pressed = false, onToggle }: { pressed?: boolean; onToggle?: () => void }) {
  const base = 'h-[42px] shrink-0 rounded-[80px] border-2 px-3 text-body-lg text-neutral-700 drop-shadow-[0_0_8px_rgba(0,0,0,0.04)]'
  if (!onToggle) {
    return (
      <button
        type="button"
        aria-disabled="true"
        title="모범답안은 준비 중이에요"
        onClick={(e) => e.preventDefault()}
        className={`${base} cursor-not-allowed border-neutral-100 bg-green-50`}
      >
        모범답안
      </button>
    )
  }
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      title={pressed ? '내 답안으로 돌아가기' : '모범답안 보기'}
      className={`${base} transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 ${
        pressed ? 'border-green-200 bg-green-300' : 'border-neutral-100 bg-green-50 hover:bg-green-100'
      }`}
    >
      모범답안
    </button>
  )
}
