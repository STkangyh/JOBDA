import { useSession } from '../store/session'
import type { Branch } from '../types'

const OPTIONS: { branch: Branch; title: string; desc: string }[] = [
  {
    branch: 'wood_dropped',
    title: 'A. 목재 포기, 다른 재질 사출물로 변경',
    desc: '목재 콘셉트를 접고 시방서를 다시 작성합니다.',
  },
  {
    branch: 'sheet_wrap',
    title: 'B. 시트지 래핑',
    desc: '사내 설비로 바로 진행 가능. 목재 느낌은 시트지로 대체합니다.',
  },
  {
    branch: 'outsourcing',
    title: 'C. 외부 업체 탐색',
    desc: '목재 밴딩·오일 마감이 가능한 외주 업체를 찾아 비교합니다.',
  },
]

export function BranchSelect() {
  const chooseBranch = useSession((s) => s.chooseBranch)
  const revisitCount = useSession((s) => s.revisitCount)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        목재 파트, 어떻게 실현하시겠어요?
      </h1>
      {revisitCount > 0 && (
        <p className="text-xs text-amber-600">
          이미 한 번 시방서를 다시 작성했습니다. 이번에도 목재를 포기하면 이번 선택으로 바로 마무리돼요.
        </p>
      )}
      <div className="flex flex-col gap-3">
        {OPTIONS.map((o) => (
          <button
            key={o.branch}
            onClick={() => chooseBranch(o.branch)}
            className="rounded-md border border-neutral-200 p-4 text-left transition-colors hover:border-neutral-900 dark:border-neutral-800 dark:hover:border-white"
          >
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{o.title}</p>
            <p className="mt-1 text-sm text-neutral-500">{o.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
