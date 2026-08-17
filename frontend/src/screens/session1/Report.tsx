import { Text } from '../../components/Text'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { useSession1 } from '../../store/session1'

function Section({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <Card className="p-4">
      <Text variant="body-md" emphasis className="mb-2">
        {title}
      </Text>
      {items.length === 0 ? (
        <Text variant="body-sm" className="text-neutral-400">
          {empty}
        </Text>
      ) : (
        <ul className="list-inside list-disc space-y-1">
          {items.map((t, i) => (
            <li key={i}>
              <Text as="span" variant="body-sm" className="text-neutral-600">
                {t}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function Session1Report() {
  const report = useSession1((s) => s.report)
  const resetSession = useSession1((s) => s.resetSession)

  if (!report) return null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <Text variant="headline-md" emphasis>
        직무 이해 리포트
      </Text>

      <div>
        <Text variant="body-md" emphasis className="mb-2">
          이번에 경험한 업무
        </Text>
        <Text variant="body-sm" className="text-neutral-600">
          {report.work_overview}
        </Text>
      </div>

      <Section title="강점" items={report.strengths} empty="이번 체험에서 특별히 강조할 점을 찾지 못했습니다." />
      <Section title="주의점" items={report.cautions} empty="특별한 주의점은 없었습니다." />
      <Section title="추가로 고려할 수 있었던 요소" items={report.missed} empty="놓친 요소가 없었습니다." />

      <div>
        <Text variant="body-md" emphasis className="mb-2">
          직무에서의 의미
        </Text>
        <Text variant="body-sm" className="text-neutral-600">
          {report.job_meaning}
        </Text>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => (window.location.href = '/explore')}>
          탐색 페이지로
        </Button>
        <Button onClick={() => resetSession()}>다시 체험하기</Button>
      </div>
    </div>
  )
}
