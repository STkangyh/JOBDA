import { PROCESS_STEPS } from '../data/processSteps'

// Figma "내 업무 진행 과정" — 11단계 커리어 파이프라인 중 이번 세션에서 실제로 경험한
// 한 단계만 강조. 원본은 두 세션(6번/8번)을 동시에 강조한 예시 화면이라 분기 커넥터가
// 있었지만, 실제로는 세션당 정확히 한 단계만 밟으므로 분기 없이 단일 강조로 단순화함.
// 종합 리포트(세션1+세션2 완료 후)는 두 단계를 동시에 강조해야 해서 배열도 받는다.
export function WorkProcessChain({ activeIndex }: { activeIndex: number | number[] }) {
  const activeIndices = Array.isArray(activeIndex) ? activeIndex : [activeIndex]

  return (
    <div className="flex flex-wrap gap-2">
      {PROCESS_STEPS.map((step, i) => (
        <span
          key={step}
          className={`rounded-xl px-4 py-3 text-title-md font-semibold whitespace-nowrap ${
            activeIndices.includes(i) ? 'bg-green-500 text-neutral-900' : 'bg-neutral-700 text-neutral-200'
          }`}
        >
          {i + 1}. {step}
        </span>
      ))}
    </div>
  )
}
