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
 * 모범답안 — 디자인에만 있고 무엇을 보여줄지(답안 내용·공개 시점)가 아직 정해지지 않아 눌러도 동작하지 않는다.
 * TODO(2026-10-31): 모범답안 내용과 공개 조건이 정해지면 연결.
 */
export function ModelAnswerChip() {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="모범답안은 준비 중이에요"
      onClick={(e) => e.preventDefault()}
      className="h-[42px] shrink-0 cursor-not-allowed rounded-[80px] border-2 border-neutral-100 bg-green-50 px-3 text-body-lg text-neutral-700 drop-shadow-[0_0_8px_rgba(0,0,0,0.04)]"
    >
      모범답안
    </button>
  )
}
