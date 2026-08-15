import { useSession } from '../store/session'
import { Button } from '../components/Button'

export function FinalFeedback() {
  const askedCapability = useSession((s) => s.askedCapability)
  const askedBudget = useSession((s) => s.askedBudget)
  const goTo = useSession((s) => s.goTo)

  const items = [
    {
      from: '설계팀',
      ok: askedCapability,
      text: askedCapability
        ? '사내 생산 가능 여부를 미리 확인하셨네요. 목재 밴딩·오일 마감은 사내에서 안 되니 그 부분만 참고하세요.'
        : '목재 밴딩과 오일 마감은 사내 설비로 불가능합니다. 사전에 확인 안 하고 시방서부터 만드셨네요.',
    },
    {
      from: '구매팀',
      ok: askedBudget,
      text: askedBudget
        ? '예산 감안하고 계신 것 같아 다행이에요. 최종 단가는 업체 비교 후 다시 확인해주세요.'
        : '목재 파트 예산 상한을 확인 안 하셨는데, 이대로 가면 초과할 가능성이 커요.',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">설계팀·구매팀 피드백</h1>
      {items.map((item) => (
        <div
          key={item.from}
          className={`rounded-md border p-4 text-sm dark:border-neutral-800 ${
            item.ok ? 'border-neutral-200' : 'border-amber-400'
          }`}
        >
          <p className="mb-1 text-neutral-500">피드백 제공자: {item.from}</p>
          <p className="text-neutral-900 dark:text-neutral-100">{item.text}</p>
        </div>
      ))}
      <div className="flex justify-end">
        <Button onClick={() => goTo('branch_select')}>다음: 방향 선택</Button>
      </div>
    </div>
  )
}
