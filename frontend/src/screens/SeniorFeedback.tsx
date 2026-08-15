import { useSession } from '../store/session'
import { Button } from '../components/Button'

export function SeniorFeedback() {
  const draft = useSession((s) => s.draft)
  const goTo = useSession((s) => s.goTo)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">선임 디자이너 피드백</h1>
      <div className="rounded-md border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        <p className="mb-1 text-neutral-500">피드백 제공자: 선임 디자이너</p>
        {draft.limitSampleAttached ? (
          <p className="text-neutral-900 dark:text-neutral-100">
            항목은 다 있네요. 이대로 설계팀·구매팀 검토로 넘기세요.
          </p>
        ) : (
          <>
            <p className="text-neutral-900 dark:text-neutral-100">
              항목은 다 있는데, 목재는 컬러칩처럼 "이 색으로 해주세요"가 안 통해요. 한도 견본 판정표를
              별첨하지 않으면 설계팀·구매팀이 판단할 기준이 없어요.
            </p>
            <p className="mt-2 text-amber-600">수정 요청: 한도 견본 판정표 별첨</p>
          </>
        )}
      </div>
      <div className="flex justify-end">
        <Button onClick={() => goTo('workspace')}>최종본 작성하러 가기</Button>
      </div>
    </div>
  )
}
