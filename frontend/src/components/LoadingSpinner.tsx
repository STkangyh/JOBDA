import spinner from '../assets/loading/spinner.svg'

// 로딩 스피너 — 로딩 스플래시(/loading)와 같은 그림. 화면 오른쪽 위에 둔다(2026-11-02 결정).
// 동작 줄이기 설정에서도 멈추지 않는다: 지금 처리 중이라는 기능성 표시라서.
export function LoadingSpinner({ label = '처리 중', className = '' }: { label?: string; className?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`flex size-14 shrink-0 items-center justify-center rounded-full bg-neutral-900 backdrop-blur-panel ${className}`}
    >
      <img src={spinner} alt="" width={24} height={24} className="size-6 animate-spin [animation-duration:1.2s]" />
    </span>
  )
}
