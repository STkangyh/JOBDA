import { useSession } from '../store/session'
import { Button } from '../components/Button'

const ROWS: [string, string][] = [
  ['사용자 역할', '생활가전 기업의 신입 제품디자이너'],
  ['프로젝트', '공기청정기 목재 파트 시방서 작성 및 외주 결정'],
  ['배경', '처음으로 오크 원목을 하우징 소재로 사용 확정. 자사 공장은 목재 밴딩·오일 마감 설비 없음'],
  ['목표', '시방서 완성 + 목재 파트 실현 방법(포기/시트지/외주) 결정'],
  ['협업 관계자', '선임 디자이너, 설계팀, 구매팀'],
  ['최종 결과물', '디자인 시방서 (+외주 선택 시 업체 비교 자료)'],
  ['일정', '발주까지 12일'],
]

export function Brief() {
  const goTo = useSession((s) => s.goTo)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">프로젝트 브리프</h1>
      <dl className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 text-sm dark:divide-neutral-800 dark:border-neutral-800">
        {ROWS.map(([label, value]) => (
          <div key={label} className="grid grid-cols-3 gap-4 px-4 py-3">
            <dt className="text-neutral-500">{label}</dt>
            <dd className="col-span-2 text-neutral-900 dark:text-neutral-100">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-end">
        <Button onClick={() => goTo('workspace')}>업무 시작하기</Button>
      </div>
    </div>
  )
}
