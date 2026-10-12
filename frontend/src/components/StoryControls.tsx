import type { ButtonHTMLAttributes, ReactNode } from 'react'
import arrowBack from '../assets/illustrations/story-arrow-back.svg'

// Figma "02_기러기 가족" 세션2 브리프(Desktop-230~240)의 스토리형 화면 부품.
// 대사 상자 위 챕터 진행 막대, 좌우 화살표, 우상단 Exit/Skip/Next 칩 버튼.

type ChipTone = 'default' | 'next' | 'exit'

// 상태 정의: Desktop-238(Next 활성), 237(Next Pressed), 239(Exit Hover = "Active 2"), 240(Exit Pressed).
// Skip·기본 칩은 디자인에 호버 상태가 없어서 키보드 포커스 표시만 둔다.
const CHIP_TONE: Record<ChipTone, string> = {
  default: 'border-[rgba(225,225,225,0.5)] bg-[rgba(245,245,245,0.5)] text-neutral-500 backdrop-blur-[14px]',
  next:
    'border-green-100 bg-green-300 text-green-800 shadow-[inset_0_0_12px_6px_var(--color-green-100),0_0_16px_rgba(0,0,0,0.04)] active:bg-[#c7dab5]',
  exit:
    'border-[rgba(225,225,225,0.5)] bg-[rgba(245,245,245,0.5)] text-neutral-500 backdrop-blur-[14px] hover:border-error-100 hover:bg-error-200 hover:text-neutral-75 hover:shadow-[inset_0_0_12px_6px_var(--color-error-100),0_0_16px_rgba(0,0,0,0.04)] active:border-error-100 active:bg-[#d47168] active:text-neutral-75',
}

export function GlassChipButton({
  tone = 'default',
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ChipTone }) {
  return (
    <button
      type="button"
      className={`flex h-14 min-w-[106px] items-center justify-center overflow-clip rounded-[32px] border-2 px-6 text-headline-md font-semibold shadow-[0_0_16px_rgba(0,0,0,0.04)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 ${CHIP_TONE[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// Figma의 Rounded 버튼 SVG(64px 버튼 + 그림자 여백, 원본 96×96)를 그대로 쓴다. 오른쪽은 같은 SVG를 좌우 반전.
export function RoundArrowButton({ direction, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { direction: 'prev' | 'next' }) {
  return (
    <button
      type="button"
      aria-label={direction === 'prev' ? '이전' : '다음'}
      className={`size-16 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 disabled:cursor-default ${className}`}
      {...props}
    >
      {/* 버튼 자체의 position은 호출부(absolute 배치)에 맡기고, 그림자 여백까지 포함한 96px SVG는 안쪽 기준점에 둔다 */}
      <span className="relative block size-16">
        <img src={arrowBack} alt="" width={96} height={96} className={`pointer-events-none absolute inset-[-25%] block max-w-none ${direction === 'next' ? '-scale-x-100' : ''}`} />
      </span>
    </button>
  )
}

// 챕터 진행 막대: 지난 챕터는 연두로 채운 얇은 막대, 현재 챕터는 48px 높이로 커지며 라벨 표시,
// 남은 챕터는 빈 얇은 막대. current가 chapters.length면(마지막 장면) 전부 채운다.
export function ChapterProgress({ chapters, current }: { chapters: readonly string[]; current: number }) {
  return (
    <ol className="flex w-full items-end justify-center gap-2" aria-label="브리프 진행">
      {chapters.map((label, i) => {
        if (i < current) {
          return (
            <li key={label} className="flex h-3 min-w-px flex-1 overflow-clip rounded-lg bg-[rgba(245,245,245,0.75)]">
              <span className="w-full rounded-lg bg-green-300" />
              <span className="sr-only">{label} 완료</span>
            </li>
          )
        }
        if (i === current) {
          return (
            <li
              key={label}
              aria-current="step"
              className="relative flex h-12 min-w-px flex-1 overflow-clip rounded-lg bg-[rgba(245,245,245,0.85)] shadow-[0_0_16px_rgba(0,0,0,0.04)] backdrop-blur-[14px]"
            >
              <span className="h-full w-4 shrink-0 rounded-lg bg-green-300" aria-hidden />
              <span className="absolute inset-0 flex items-center justify-center text-title-lg font-semibold text-neutral-900">{label}</span>
            </li>
          )
        }
        return (
          <li key={label} className="h-3 min-w-px flex-1 rounded-lg bg-[rgba(245,245,245,0.85)] shadow-[0_0_16px_rgba(0,0,0,0.04)] backdrop-blur-[14px]">
            <span className="sr-only">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

// 하단 대사 상자. Figma는 1728px 화면 기준 32px 고정이라, 좁은 데스크톱에서도 줄이 상자를 넘지 않게
// 화면 폭에 비례해 줄인다(1728px에서 정확히 32px).
export function DialogueBox({ children }: { children: ReactNode }) {
  return (
    <div
      aria-live="polite"
      className="flex min-h-[213px] w-full items-center justify-center overflow-clip rounded-lg border-2 border-[rgba(110,110,110,0.75)] bg-[rgba(1,1,1,0.85)] p-8 shadow-[0_0_16px_rgba(0,0,0,0.04)] backdrop-blur-[14px]"
    >
      <div className="text-center text-[clamp(20px,1.852vw,32px)] leading-[1.2] font-medium text-neutral-100 [text-wrap:balance]">{children}</div>
    </div>
  )
}
