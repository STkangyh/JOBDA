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
      {/* Figma 1184:11046("image 237") 실측 — 다른 세션1 화면들처럼 Sidebar를 쓰는 대신, 이
          화면만 (Report.tsx와 같은) 로고 박스 하나로 헤더 폭을 맞춘다. 예전엔 이 자리가 빈
          플레이스홀더라 Hero 영역에 로고가 빠진 것처럼 보였음(QA 지적). */}
      <BrandLogoBox />

      <div className="flex min-w-0 flex-1 flex-col gap-[18px]">
        <IndicatorHeader current="자기 평가" steps={INDICATOR_STEPS_S1} icons={false} loading={submitting} />

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-[18px]">
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
                  scale={S1_RATING_SCALE}
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

          <PrimaryCTAButton onClick={submit} disabled={submitting}>
            {submitting ? '리포트 생성 중...' : '제출하기'}
          </PrimaryCTAButton>
        </div>
      </div>
    </div>
  )
}
