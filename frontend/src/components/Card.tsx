import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  // bg-white는 다크모드에서도 안 바뀌므로(디자인 시스템에 다크 테마 토큰이 아직 없음) 텍스트 색도
  // body의 dark:text-neutral-100 상속을 끊고 항상 명시적으로 어둡게 고정한다.
  return <div className={`rounded-lg border border-neutral-500 bg-white text-neutral-900 ${className}`}>{children}</div>
}
