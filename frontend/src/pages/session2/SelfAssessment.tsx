import { useState } from 'react'
import { useSession } from '../../store/session'
import { Text } from '../../components/Text'
import { Card } from '../../components/Card'
import { PrimaryCTAButton } from '../../components/PrimaryCTAButton'
import { IndicatorHeader } from '../../components/IndicatorHeader'
import { RatingRow } from '../../components/RatingRow'
import { ReportSkeleton } from '../../components/ReportSkeleton'
import { BrandLogoBox } from '../../components/BrandLogoBox'
import { RATING_SCALE } from '../../types'

type RatingField = 'interestScore' | 'expectationGap' | 'repeatWillingness'

const QUESTIONS: { field: RatingField; label: string }[] = [
  { field: 'interestScore', label: '이 업무가 흥미로웠나요?' },
  { field: 'expectationGap', label: '수행 과정이 예상과 달랐나요?' },
  { field: 'repeatWillingness', label: '이 업무가 계속 수행하고 싶나요?' },
]

// Figma "Desktop - 117"(823:52645, 파일 x6feHLgVMyg8sh8C2jVPE1) — 세션1 자기평가
// (823:52713/Desktop-118)와 문항 텍스트가 동일해 같은 5점 척도 UI를 그대로 재사용한다.
// 이 프레임은 사이드바 대신 브랜드 로고 박스 + 인디케이터(자기 평가 활성)만 보이고,
// Brief/Report처럼 저장/프로필 아이콘은 없다 — 이전엔 로고 자리가 빈 스페이서 div라 로고가
// 아예 안 보였다(QA 지적, session1/SelfAssessment.tsx의 BrandLogoBox와 동일하게 맞춤).
export function SelfAssessment() {
  const value = useSession((s) => s.selfAssessment)
  const setSelfAssessment = useSession((s) => s.setSelfAssessment)
  const finishAssessment = useSession((s) => s.finishAssessment)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  // finishAssessment는 실제 백엔드(/api/report)를 호출한다 — 이게 실패해도(네트워크 오류,
  // 5xx 등) catch가 없으면 버튼만 조용히 "제출하기"로 돌아가고 왜 안 넘어갔는지 사용자는
  // 알 방법이 없었다(실제로 이런 증상 신고가 들어왔었음). 실패 시 재시도할 수 있게 에러
  // 문구를 보여준다.
  const submit = async () => {
    setSubmitting(true)
    setError(false)
    try {
      await finishAssessment()
    } catch {
      setError(true)
    } finally {
      setSubmitting(false)
    }
  }

  // 리포트 생성 대기(1.8~3.7초 실측)를 버튼 텍스트만 바꿔서 보여주면 화면이 멈춘 것처럼 느껴짐 —
  // Report.tsx와 같은 3컬럼 그리드 자리에 펄스 스켈레톤을 띄워 "이제 이 리포트가 채워질 것"을
  // 미리 보여준다. 실제 리포트 도착 시 currentStage가 넘어가며 이 화면 자체가 Report로 교체된다.
  if (submitting) {
    return (
      <div className="flex min-h-svh gap-6 bg-neutral-75 p-6">
        <BrandLogoBox />
        <div className="flex min-w-0 flex-1 flex-col gap-[19px]">
          <IndicatorHeader current="직무 리포트" icons={false} loading />
          <ReportSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-75 p-6">
      <div className="flex min-w-0 flex-1 flex-col gap-[18px]">
        {/* Figma 823:52713(Desktop-118) 실측: 로고와 인디케이터가 한 행에 나란히 있고, 그
            행과 카드가 같은 부모 아래 세로로 이어진 하나의 컬럼이다 — 로고를 페이지 전체
            높이의 별도 컬럼(바깥 flex row의 형제)으로 빼두면 카드가 로고 폭+간격만큼 밀려나
            Figma보다 좁아진다(QA 지적). 로고는 이 행 안에서만 폭을 차지하고, 카드/버튼은
            이 컬럼의 전체 폭을 그대로 쓴다. */}
        <div className="flex items-start gap-6">
          <BrandLogoBox />
          <div className="min-w-0 flex-1">
            <IndicatorHeader current="자기 평가" icons={false} loading={submitting} />
          </div>
        </div>

        {/* Figma 823:52713(Desktop-118) 실측: 카드가 h-[920px] 고정값으로 뷰포트 거의 전체
            높이를 차지한다 — 콘텐츠 크기만큼만 차지하게 두면 카드 밑에 페이지 배경색 여백이
            크게 남아 Figma보다 훨씬 짧아 보였다(QA 지적). flex-1로 남는 세로 공간을 카드
            자신이 흡수하게 해서 아래 spacer 없이도 카드가 버튼 바로 위까지 늘어나게 한다. */}
        <Card className="flex flex-1 flex-col gap-[48px] p-6">
          <div className="flex flex-col gap-3">
            {/* Figma 823:52713(Desktop-118) 실측: "Emphasis/Headline/Large"(32px). */}
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
                scale={RATING_SCALE}
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

        {error && (
          <Text variant="body-md" className="self-end text-error-200">
            리포트를 생성하지 못했어요. 잠시 후 다시 시도해주세요.
          </Text>
        )}

        <PrimaryCTAButton onClick={submit} disabled={submitting}>
          {submitting ? '리포트 생성 중...' : '제출하기'}
        </PrimaryCTAButton>
      </div>
    </div>
  )
}
