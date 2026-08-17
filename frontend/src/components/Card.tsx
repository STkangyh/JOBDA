import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  // bg-white는 다크모드에서도 안 바뀌므로(디자인 시스템에 다크 테마 토큰이 아직 없음) 텍스트 색도
  // body의 dark:text-neutral-100 상속을 끊고 항상 명시적으로 어둡게 고정한다.
  // rounded-xl + shadow는 Figma 라운드 화면(587:9749)의 카드 패널(메신저/작업검토/업무노트)
  // 실측값 — border가 아니라 옅은 그림자로 경계를 준다(border-neutral-500은 원본에 없던 임의값).
  return (
    <div
      className={`rounded-xl bg-white text-neutral-900 shadow-[0px_0px_8px_0px_rgba(0,0,0,0.04)] ${className}`}
    >
      {children}
    </div>
  )
}
