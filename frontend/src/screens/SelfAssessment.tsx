import { useState } from 'react'
import { useSession } from '../store/session'
import { Button } from '../components/Button'

const BURDEN_ITEMS = ['자료 분석', '필요한 정보 판단', '관계부서에 질문', '제약 조건 반영', '반복 수정', '결과물 문서화']

export function SelfAssessment() {
  const value = useSession((s) => s.selfAssessment)
  const setSelfAssessment = useSession((s) => s.setSelfAssessment)
  const finishAssessment = useSession((s) => s.finishAssessment)
  const [submitting, setSubmitting] = useState(false)

  const toggleBurden = (item: string) => {
    const has = value.burdenItems.includes(item)
    setSelfAssessment({
      burdenItems: has ? value.burdenItems.filter((i) => i !== item) : [...value.burdenItems, item],
    })
  }

  const complete = value.interestScore && value.expectationGap && value.repeatWillingness && value.burdenItems.length > 0

  const submit = async () => {
    setSubmitting(true)
    try {
      await finishAssessment()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">자기평가</h1>

      <div>
        <p className="mb-2 text-sm text-neutral-500">이번 업무를 수행하는 과정이 얼마나 흥미로웠나요?</p>
        <div className="flex gap-2">
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button
              key={n}
              onClick={() => setSelfAssessment({ interestScore: n })}
              className={`h-9 w-9 rounded-full border text-sm transition-colors ${
                value.interestScore === n
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                  : 'border-neutral-300 hover:border-neutral-600 dark:border-neutral-700 dark:hover:border-neutral-400'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm text-neutral-500">제품디자이너 업무가 체험 전 예상과 얼마나 달랐나요?</p>
        <div className="flex gap-2">
          {(['거의 같았다', '일부 달랐다', '상당히 달랐다'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setSelfAssessment({ expectationGap: v })}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                value.expectationGap === v
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                  : 'border-neutral-300 hover:border-neutral-600 dark:border-neutral-700 dark:hover:border-neutral-400'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm text-neutral-500">비슷한 업무를 반복적으로 수행하는 것이 괜찮을 것 같나요?</p>
        <div className="flex gap-2">
          {(['그렇다', '잘 모르겠다', '그렇지 않다'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setSelfAssessment({ repeatWillingness: v })}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                value.repeatWillingness === v
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                  : 'border-neutral-300 hover:border-neutral-600 dark:border-neutral-700 dark:hover:border-neutral-400'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm text-neutral-500">업무 과정에서 부담을 느낀 부분을 골라주세요 (복수 선택)</p>
        <div className="flex flex-wrap gap-2">
          {BURDEN_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => toggleBurden(item)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                value.burdenItems.includes(item)
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                  : 'border-neutral-300 hover:border-neutral-600 dark:border-neutral-700 dark:hover:border-neutral-400'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={!complete || submitting}>
          {submitting ? '리포트 생성 중...' : '자기평가 제출'}
        </Button>
      </div>
    </div>
  )
}

