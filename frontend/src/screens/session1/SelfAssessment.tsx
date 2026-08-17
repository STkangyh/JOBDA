import { useState } from 'react'
import { Text } from '../../components/Text'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { useSession1 } from '../../store/session1'

const BURDEN_ITEMS = ['설계팀 피드백 대응', '수정 방향 판단', '선택 근거 작성', '디자인 의도 유지', '반복 수정']

export function Session1SelfAssessment() {
  const value = useSession1((s) => s.selfAssessment)
  const setSelfAssessment = useSession1((s) => s.setSelfAssessment)
  const finishAssessment = useSession1((s) => s.finishAssessment)
  const [submitting, setSubmitting] = useState(false)

  const toggleBurden = (item: string) => {
    const has = value.burdenItems.includes(item)
    setSelfAssessment({ burdenItems: has ? value.burdenItems.filter((i) => i !== item) : [...value.burdenItems, item] })
  }

  const complete = value.interestScore && value.expectationGap && value.repeatWillingness && value.burdenItems.length > 0

  const submit = async () => {
    setSubmitting(true)
    try {
      finishAssessment()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <Text variant="headline-md" emphasis>
        자기평가
      </Text>

      <Card className="flex flex-col gap-6 p-6">
        <div>
          <Text variant="body-md" className="mb-2 text-neutral-600">
            이번 업무를 수행하는 과정이 얼마나 흥미로웠나요?
          </Text>
          <div className="flex gap-2">
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <button
                key={n}
                onClick={() => setSelfAssessment({ interestScore: n })}
                className={`size-9 rounded-full border text-sm transition-colors ${
                  value.interestScore === n
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 hover:border-neutral-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Text variant="body-md" className="mb-2 text-neutral-600">
            제품디자이너 업무가 체험 전 예상과 얼마나 달랐나요?
          </Text>
          <div className="flex gap-2">
            {(['거의 같았다', '일부 달랐다', '상당히 달랐다'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSelfAssessment({ expectationGap: v })}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  value.expectationGap === v
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 hover:border-neutral-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Text variant="body-md" className="mb-2 text-neutral-600">
            비슷한 업무를 반복적으로 수행하는 것이 괜찮을 것 같나요?
          </Text>
          <div className="flex gap-2">
            {(['그렇다', '잘 모르겠다', '그렇지 않다'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSelfAssessment({ repeatWillingness: v })}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  value.repeatWillingness === v
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 hover:border-neutral-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Text variant="body-md" className="mb-2 text-neutral-600">
            업무 과정에서 부담을 느낀 부분을 골라주세요 (복수 선택)
          </Text>
          <div className="flex flex-wrap gap-2">
            {BURDEN_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => toggleBurden(item)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  value.burdenItems.includes(item)
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 hover:border-neutral-600'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Button variant="primary" className="h-[48px] self-end px-8 text-base" onClick={submit} disabled={!complete || submitting}>
        {submitting ? '리포트 생성 중...' : '자기평가 제출'}
      </Button>
    </div>
  )
}
