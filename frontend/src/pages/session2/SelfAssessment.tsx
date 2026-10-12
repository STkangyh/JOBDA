import { useState } from 'react'
import { useSession } from '../../store/session'
import { RatingRow } from '../../components/RatingRow'
import { ReportSkeleton } from '../../components/ReportSkeleton'
import { WorkFrame, WorkPanel } from '../../components/WorkFrame'
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

  // 리포트 생성 대기(1.8~3.7초 실측) 동안 리포트 자리에 펄스 스켈레톤을 띄운다. 도착하면 currentStage가 넘어가며 Report로 교체된다.
  if (submitting) {
    return (
      <WorkFrame step="직무 리포트" sidebar="work" loading exitStep="self_assessment">
        <div className="min-w-0 flex-1">
          <ReportSkeleton />
        </div>
      </WorkFrame>
    )
  }

  // 업무 페이지 새 디자인 2217:10818(2026-10-13): 오른쪽 메신저 자리는 비우고 카드 하나에 문항과 제출 버튼을 담는다.
  return (
    <WorkFrame step="자기 평가" sidebar="work" exitStep="self_assessment" flushRight>
      <WorkPanel className="flex min-w-0 flex-1 flex-col gap-12">
        <div className="flex flex-col gap-3">
          <h1 className="text-headline-lg font-medium text-neutral-900">방금 수행한 업무, 어떠셨나요?</h1>
          <p className="text-body-lg text-neutral-600">학습 과정에 대한 리뷰를 등록해주세요. 솔직한 응답일수록 정확한 직무 이해 리포트를 받을 수 있어요.</p>
        </div>

        <div className="flex flex-col gap-6">
          {QUESTIONS.map((q) => (
            <RatingRow key={q.field} tone="work" label={q.label} value={value[q.field]} onChange={(v) => setSelfAssessment({ [q.field]: v })} scale={RATING_SCALE} />
          ))}

          {/* Figma 4번째 문항 제목은 1번과 같은 자리표시라, 기존 문항(부담 기록)을 그대로 쓴다 */}
          <label className="flex flex-col gap-3">
            <span className="text-title-lg font-semibold text-green-900">업무 중 부담을 느낀 부분이 있었나요?</span>
            <textarea
              value={value.burdenNote}
              onChange={(e) => setSelfAssessment({ burdenNote: e.target.value })}
              rows={2}
              placeholder="ex) 설계팀과의 커뮤니케이션에서 제 의도를 정확히 전달하기 어려웠어요."
              className="resize-none rounded-[4px] bg-green-50 px-4 py-3 text-body-lg text-neutral-700 shadow-[inset_0_0_4px_2px_rgba(0,0,0,0.04)] placeholder:text-neutral-500 focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-auto flex flex-col items-end gap-3">
          {error && (
            <p role="alert" className="text-body-md text-error-300">
              리포트를 생성하지 못했어요. 잠시 후 다시 시도해주세요.
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="h-[82px] w-[280px] rounded-xl bg-green-500 text-headline-md font-semibold text-neutral-900 transition-colors hover:bg-green-400 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
          >
            제출하기
          </button>
        </div>
      </WorkPanel>
      <div aria-hidden className="w-[clamp(320px,25vw,433px)] shrink-0" />
    </WorkFrame>
  )
}
