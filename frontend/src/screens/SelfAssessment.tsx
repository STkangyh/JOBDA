import { useState } from 'react'
import { useSession } from '../store/session'
import { Text } from '../components/Text'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Indicator } from '../components/Indicator'
import { RATING_SCALE, type RatingScale } from '../types'

type RatingField = 'interestScore' | 'expectationGap' | 'repeatWillingness'

const QUESTIONS: { field: RatingField; label: string }[] = [
  { field: 'interestScore', label: '이 업무가 흥미로웠나요?' },
  { field: 'expectationGap', label: '수행 과정이 예상과 달랐나요?' },
  { field: 'repeatWillingness', label: '이 업무가 계속 수행하고 싶나요?' },
]

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: RatingScale
  onChange: (v: RatingScale) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="title-md" emphasis className="text-green-900">
        {label}
      </Text>
      <div className="flex gap-3">
        {RATING_SCALE.map((option) => {
          const selected = value === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`h-[72px] flex-1 rounded-xl px-3 py-6 text-center text-title-md transition-colors ${
                selected
                  ? 'bg-green-300 font-semibold text-neutral-900'
                  : 'border border-green-900 text-neutral-500 hover:bg-green-50'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Figma "Desktop - 117"(823:52645, 파일 x6feHLgVMyg8sh8C2jVPE1) — 세션1 자기평가
// (744:15050/Desktop-87)와 문항 텍스트가 동일해 같은 5점 척도 UI를 그대로 재사용한다.
// 이 프레임은 브랜드 로고 + 인디케이터(자기 평가 활성)만 보이고, Brief/Report처럼 사이드바
// 아이콘이나 저장/프로필 아이콘은 없다 — 그래서 3컬럼 헤더 그리드 대신 인디케이터만 단독 배치.
// (참고: 세션1의 SelfAssessment.tsx는 현재 이 인디케이터조차 없이 완전히 헤더가 빈 상태 —
// Figma 기준으로는 세션1 쪽도 나중에 인디케이터를 추가하는 게 맞아 보임.)
export function SelfAssessment() {
  const value = useSession((s) => s.selfAssessment)
  const setSelfAssessment = useSession((s) => s.setSelfAssessment)
  const finishAssessment = useSession((s) => s.finishAssessment)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      await finishAssessment()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col gap-[18px] bg-neutral-50 p-6">
      <Indicator current="자기 평가" />

      <Card className="flex flex-col gap-[48px] p-6">
        <div className="flex flex-col gap-3">
          <Text variant="headline-md" emphasis>
            방금 수행한 업무, 어떠셨나요?
          </Text>
          <Text variant="title-lg" className="text-neutral-600">
            학습 과정에 대한 리뷰를 등록해주세요. 솔직한 응답일수록 정확한 직무 이해 리포트를 받을 수 있어요.
          </Text>
        </div>

        <div className="flex flex-col gap-6">
          {QUESTIONS.map((q) => (
            <RatingRow
              key={q.field}
              label={q.label}
              value={value[q.field]}
              onChange={(v) => setSelfAssessment({ [q.field]: v })}
            />
          ))}

          <div className="flex flex-col gap-3">
            <Text variant="title-md" emphasis className="text-green-900">
              업무 중 부담을 느낀 부분이 있었나요?
            </Text>
            <div className="rounded-xl border border-neutral-600 p-6">
              <textarea
                value={value.burdenNote}
                onChange={(e) => setSelfAssessment({ burdenNote: e.target.value })}
                rows={2}
                placeholder="ex) 설계팀과의 커뮤니케이션에서 제 의도를 정확히 전달하기 어려웠어요."
                className="w-full resize-none text-body-lg text-neutral-500 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </Card>

      <Button
        variant="primary"
        className="h-[72px] w-[340px] self-end !rounded-xl !text-2xl"
        onClick={submit}
        disabled={submitting}
      >
        {submitting ? '리포트 생성 중...' : '제출하기'}
      </Button>
    </div>
  )
}
