import { useState } from 'react'
import { Text } from '../../components/Text'
import { Card } from '../../components/Card'
import { PrimaryCTAButton } from '../../components/PrimaryCTAButton'
import { IndicatorHeader } from '../../components/IndicatorHeader'
import { INDICATOR_STEPS_S1 } from '../../components/Indicator'
import { RatingRow } from '../../components/RatingRow'
import { BrandLogoBox } from '../../components/BrandLogoBox'
import { S1_RATING_SCALE, useSession1 } from '../../store/session1'

type RatingField = 'interestScore' | 'expectationGap' | 'repeatWillingness'

const QUESTIONS: { field: RatingField; label: string }[] = [
  { field: 'interestScore', label: '이 업무가 흥미로웠나요?' },
  { field: 'expectationGap', label: '수행 과정이 예상과 달랐나요?' },
  { field: 'repeatWillingness', label: '이 업무가 계속 수행하고 싶나요?' },
]

export function Session1SelfAssessment() {
  const value = useSession1((s) => s.selfAssessment)
  const setSelfAssessment = useSession1((s) => s.setSelfAssessment)
  const finishAssessment = useSession1((s) => s.finishAssessment)
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
    <div className="flex min-h-svh gap-6 bg-neutral-50 p-6">
      <div className="flex min-w-0 flex-1 flex-col gap-[18px]">
        {/* Figma 823:52713(Desktop-118) 실측: 로고와 인디케이터가 한 행에 나란히 있고, 그
            행과 카드가 같은 부모 아래 세로로 이어진 하나의 컬럼이다 — 로고를 페이지 전체
            높이의 별도 컬럼(바깥 flex row의 형제)으로 빼두면 카드가 로고 폭+간격만큼 밀려나
            Figma보다 좁아진다(QA 지적). 로고는 이 행 안에서만 폭을 차지하고, 카드/버튼은
            이 컬럼의 전체 폭을 그대로 쓴다. */}
        <div className="flex items-start gap-6">
          <BrandLogoBox />
          <div className="min-w-0 flex-1">
            <IndicatorHeader current="자기 평가" steps={INDICATOR_STEPS_S1} icons={false} loading={submitting} />
          </div>
        </div>

        <div className="flex w-full flex-1 flex-col gap-[18px]">
          {/* Figma 823:52713(Desktop-118) 실측: 카드가 h-[920px] 고정값으로 뷰포트 거의 전체
              높이를 차지한다 — flex-1로 남는 세로 공간을 카드 자신이 흡수하게 해서 아래
              spacer 없이도 카드가 버튼 바로 위까지 늘어나게 한다(그냥 두면 카드 밑에 페이지
              배경색 여백이 크게 남아 Figma보다 훨씬 짧아 보였다, QA 지적). */}
          <Card className="flex flex-1 flex-col gap-[48px] p-6">
            <div className="flex flex-col gap-3">
              {/* Figma 실측: "Emphasis/Headline/Large"(32px) — headline-md(24px)는 한 단계
                  작았다. */}
              <Text variant="headline-lg" emphasis>
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
                  scale={S1_RATING_SCALE}
                />
              ))}

              <div className="flex flex-col gap-3">
                <Text variant="title-lg" emphasis className="text-green-900">
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

          <PrimaryCTAButton onClick={submit} disabled={submitting}>
            {submitting ? '리포트 생성 중...' : '제출하기'}
          </PrimaryCTAButton>
        </div>
      </div>
    </div>
  )
}
