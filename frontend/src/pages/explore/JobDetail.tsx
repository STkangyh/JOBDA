import { useState } from 'react'
import illustration from '../../assets/illustrations/job-detail-banner.png'
import { PROCESS_STEPS, SESSION2_STEP_INDEX } from '../../data/processSteps'
import { track } from '../../lib/analytics'

// 세션1(6번, 모형 제작 및 설계 검토)은 배포에서 제외하기로 결정 — 사용자 요청. 8번(시방서
// 작성 및 설계 이관 = cmf_outsourcing/세션2)만 선택 가능하게 함. /session1 라우트 자체는
// 남겨두지만(직접 URL 진입은 가능) 이 화면이 유일한 발견 경로라 여기서 막으면 실질적으로
// 배포 플로우에서 제외된다.
const AVAILABLE_STEP_INDICES = [SESSION2_STEP_INDEX]

// Figma "Desktop - 271"(2217:13319, 2026-10-13) — 업무 화면. 탐색 홈의 업무 카드를 누르면 나온다.
// 디자인대로 GNB·로고·닫기 버튼 없이 전체 화면(2026-10-13 결정 — 나갈 때는 브라우저 뒤로가기).
// 이전 디자인(Desktop - 64, 652:16286)에서 바뀐 점: 로고·닫기 버튼과 "업무 프로세스" 안내 카드가 빠지고, 목록 칸 안쪽 여백이 넓어졌다.
export function JobDetail({ onSubmit }: { onSubmit: (stepIndex: number) => void }) {
  // 처음엔 아무 것도 선택 안 된 상태(CTA 비활성)로 시작한다.
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="grid h-svh grid-cols-[minmax(0,1fr)_401px] gap-x-[clamp(24px,2.5vw,44px)] overflow-hidden bg-neutral-950 pt-[clamp(24px,16svh,181px)] pr-8 pb-[clamp(16px,3svh,32px)] pl-[clamp(32px,2.4vw,41px)]">
      {/* 일러스트는 Figma처럼 카드보다 넓게 깔고(114%) 왼쪽으로 옮겨 인물이 가운데 오게 한다 */}
      <section className="relative flex max-h-[777px] min-h-0 flex-col overflow-hidden rounded-lg bg-neutral-800 px-6 pt-12 pb-6">
        <img src={illustration} alt="" className="pointer-events-none absolute top-0 left-[-9.53%] h-full w-[114.16%] max-w-none object-cover" />
        <div className="relative flex flex-col gap-3">
          <h1 className="text-display-md font-medium tracking-[-0.09px] text-green-400">생활 가전 제품디자이너</h1>
          <p className="text-title-lg text-neutral-300">C 가전회사에서 초임 디자이너로 근무하고 있는 심재현씨가 되어 인하우스 디자인 업무를 체험해보세요.</p>
        </div>
      </section>

      <div className="flex min-h-0 flex-col justify-between gap-[clamp(12px,3svh,32px)]">
        <ul className="flex min-h-0 flex-col gap-[clamp(6px,1.4svh,16px)] overflow-y-auto" aria-label="업무 프로세스">
          {PROCESS_STEPS.map((step, i) => {
            const isAvailable = AVAILABLE_STEP_INDICES.includes(i)
            const isSelected = selected === i
            return (
              <li key={step}>
                <button
                  type="button"
                  disabled={!isAvailable}
                  aria-pressed={isSelected}
                  onClick={() => setSelected(i)}
                  className={`flex h-[clamp(40px,4.3svh,48px)] w-full shrink-0 items-center gap-0.5 rounded-xl border px-12 text-title-lg whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 ${
                    isSelected
                      ? 'border-green-400 bg-neutral-800 font-semibold text-neutral-100'
                      : `border-neutral-800 bg-neutral-900 text-neutral-300 ${isAvailable ? 'hover:border-neutral-600 hover:text-neutral-100' : ''}`
                  } ${isAvailable ? '' : 'cursor-not-allowed opacity-50'}`}
                >
                  <span>{i + 1}.</span>
                  <span>{step}</span>
                </button>
              </li>
            )
          })}
        </ul>

        <button
          type="button"
          disabled={selected === null}
          onClick={() => {
            if (selected === null) return
            track('job_start', { step: selected })
            onSubmit(selected)
          }}
          className="h-[clamp(56px,6.4svh,72px)] w-full shrink-0 rounded-lg bg-green-500 text-headline-md font-semibold text-neutral-900 transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
        >
          업무 시작하기
        </button>
      </div>
    </div>
  )
}
