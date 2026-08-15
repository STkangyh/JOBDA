import { useSession } from '../store/session'
import { Button } from '../components/Button'

export function Home() {
  const goTo = useSession((s) => s.goTo)
  const draftSubmitted = useSession((s) => s.draftSubmitted)
  const finalSubmitted = useSession((s) => s.finalSubmitted)
  const resetSession = useSession((s) => s.resetSession)

  const hasProgress = draftSubmitted || finalSubmitted

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 text-center">
      <p className="text-sm text-neutral-500">직무체험 · 생활가전 제품디자이너</p>
      <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
        공기청정기 목재 하우징,
        <br />
        시방서를 완성하세요
      </h1>
      <p className="max-w-md text-sm text-neutral-500">
        자사 공장엔 목재 밴딩·오일 마감 설비가 없습니다. 시트지로 갈지, 외주 업체를 찾을지, 목재를
        포기할지 — 12일 안에 결정해야 합니다.
      </p>
      <div className="flex gap-3">
        {hasProgress && (
          <Button variant="secondary" onClick={() => resetSession()}>
            처음부터 다시 시작하기
          </Button>
        )}
        <Button onClick={() => goTo(hasProgress ? 'workspace' : 'brief')}>
          {hasProgress ? '이어서 체험하기' : '직무체험 시작하기'}
        </Button>
      </div>
    </div>
  )
}
