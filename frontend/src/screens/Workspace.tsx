import { useState, type ReactNode } from 'react'
import { Sidebar } from '../components/Sidebar'
import { Indicator } from '../components/Indicator'
import { Card } from '../components/Card'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { Checkbox } from '../components/Checkbox'
import { Messenger, WorkNotesCard } from '../components/NegotiationPanels'
import { WarningIcon, CloudSavedIcon, ProfileIcon } from '../components/icons'
import { useSession } from '../store/session'
import productImage from '../assets/illustrations/product-angle-1.png'

// Figma "관계자 협업" 라운드 — 초안 작성은 823:53571("Desktop - 104", 필드 빈 기본값)/823:54611
// (필드 채움), 선임 피드백 반영 후 최종본 수정은 823:55090/823:55255("시방서 수정") 실측.
// Figma는 시방서 항목을 소재/컬러/마감/사이즈/제작 방식 5줄로 쪼개 보여주지만 실제 데이터 모델
// (store/session.ts의 SpecDraft)은 색·재질·마감을 cmf 필드 하나로 묶어 받는다(REQUIRED_FIELDS는
// size/method/cmf/colorChip 4개뿐). 필드 자체를 늘리는 건 store/types 계약을 건드리는 일이라
// 기존 SpecForm.tsx가 쓰던 4필드 순서를 그대로 두고 Figma의 입력행 스타일(라벨 + h-[50px]
// bg-neutral-50 라인)만 재현했다 — 시각적 5줄 vs 실제 4필드는 의도적인 판단.
const DRAFT_DESCRIPTION =
  '이번 공기청정기의 외부 CMF 소재는 오크 재질의 원목을 사용하고자 합니다. 색상은 자연스러운 원목의 색상을 살릴 수 있는 오크 내추럴 컬러로 하며, 목재 접합 설비를 활용한 제작 공정을 거치고자 합니다.'

// Figma 823:53614 — 라운드 시작 시 이미 와있는 선임 디자이너의 첫 메시지(장면 설정용). 실제 대화는
// PersonaChat과 동일하게 real backend(apiChat)로 이어지므로 이 인트로는 store에 넣지 않는다.
const SENIOR_INTRO =
  '색이랑 마감 모두 결정됐어요. 설계팀에 넘길 시방서 작성하고 저한테 보내주세요.\n미리 말하는데, 이번에 목재 처음 써보는 거라 사내 공장에서 목재 접합은 안 하는 거로 알고 있어요. 시트지로 마감하거나, 외부 업체 알아봐야 할 겁니다. 발주 일정까지 12일 남았는데 그 안에 어떻게든 해결하세요.'

// Figma 823:53645 — "시방서 초안" 제목 옆 부품 태그. 순수 장식(첫 태그만 강조)이라 store에 안 둠.
const PART_TAGS = ['목재 흡기구 커버', '상부 하우징', '하부 하우징', '가죽 스트랩']

const NOTE_TAGS = {
  userNeeds: ['저소음', '공간 효율', '따뜻함', '관리 용이', '인테리어 오브제 느낌'],
  constraints: ['파팅라인 단차 0.5mm 이격할 것', '전면부 하우징은 하나로', '에어케어 제품과 내부 설계 공유'],
}
const CMF_NOTES_DRAFT = ['화이트 오크 재질의 흡기구', '목재 접합']
// Figma 823:55090 — 1차 피드백(한도 견본 판정표 요청) 이후 CMF 결정 사항에 태그가 하나 늘어남.
const CMF_NOTES_FINAL = [...CMF_NOTES_DRAFT, '한도 견본 판정표']

// Figma 823:55090/823:55255 실측 문구. draft.limitSampleAttached는 초안 제출 시점 값이라
// final을 수정하는 동안에도(=이 값 자체는 안 바뀜) "그때 받은 피드백"을 그대로 재현할 수 있다.
const FEEDBACK_PASS = '항목은 다 있네요. 이대로 설계팀·구매팀 검토로 넘기세요.'
const FEEDBACK_FAIL =
  '목재와 같이 결과물이 일정하지 않은 소재는 한도 견본 판정표라고 "이 색으로 해주세요"가 아니라 "이 정도까지는 받겠습니다"를 알려줘야 해요. 공용 서식 폴더의 한도 견본 판정표 양식을 참고해서 별첨해주세요.'

function DesignRecapCard({ editingFinal, remaining }: { editingFinal: boolean; remaining: number }) {
  const limitSampleAttached = useSession((s) => s.draft.limitSampleAttached)

  return (
    <Card className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-3">
        <Text variant="title-lg" emphasis className="text-green-900">
          디자인 초안
        </Text>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <img
            src={productImage}
            alt=""
            className="h-[149px] w-[200px] shrink-0 rounded-md bg-neutral-100 object-cover"
          />
          <Text variant="body-lg" className="text-neutral-600">
            {DRAFT_DESCRIPTION}
          </Text>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Text variant="title-lg" emphasis className="text-green-900">
            1차 피드백
          </Text>
          <div className="flex items-end gap-1">
            <WarningIcon className="size-5 shrink-0 text-error-200" />
            <Text variant="body-sm" className="text-neutral-400">
              가능 피드백 세션 {remaining}회 남음
            </Text>
          </div>
        </div>
        {editingFinal ? (
          <div className={`rounded-md p-5 ${limitSampleAttached ? 'bg-green-50' : 'border border-amber-400 bg-white'}`}>
            <Text variant="body-lg" className="whitespace-pre-line text-neutral-700">
              {limitSampleAttached ? FEEDBACK_PASS : FEEDBACK_FAIL}
            </Text>
          </div>
        ) : (
          <Text variant="body-md" className="text-neutral-400">
            초안을 제출하면 여기에 선임 디자이너의 피드백이 도착합니다.
          </Text>
        )}
      </div>
    </Card>
  )
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[50px] flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
      <Text variant="body-lg" className="shrink-0 text-neutral-400 sm:w-[92px]">
        {label}
      </Text>
      {children}
    </div>
  )
}

const FIELD_INPUT_CLASS =
  'h-[50px] flex-1 rounded-md bg-neutral-50 px-4 text-body-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none'

function SpecCard({ editingFinal }: { editingFinal: boolean }) {
  const draft = useSession((s) => s.draft)
  const final = useSession((s) => s.final)
  const updateDraft = useSession((s) => s.updateDraft)
  const updateFinal = useSession((s) => s.updateFinal)
  const submitDraft = useSession((s) => s.submitDraft)
  const submitFinal = useSession((s) => s.submitFinal)
  // Figma 823:55255의 "로딩 중..." 버튼 상태 — session1/Workspace.tsx ReviewAndChoice와 동일하게
  // 실제 지연은 없지만(클라이언트 계산) 라운드 전환감을 주기 위해 1200ms 붙잡아둔다.
  const [isSubmitting, setIsSubmitting] = useState(false)

  const value = editingFinal ? final : draft
  const onChange = editingFinal ? updateFinal : updateDraft
  const requiredMissing = !value.size.trim() || !value.method.trim() || !value.cmf.trim() || !value.colorChip.trim()

  const handleSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      if (editingFinal) submitFinal()
      else submitDraft()
      setIsSubmitting(false)
    }, 1200)
  }

  return (
    <Card className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Text variant="title-lg" emphasis className="text-green-900">
          {editingFinal ? '시방서 수정' : '시방서 초안'}
        </Text>
        <div className="flex flex-wrap gap-3">
          {PART_TAGS.map((tag, i) => (
            <span
              key={tag}
              className={`shrink-0 rounded-full px-3 py-2 text-caption-lg ${
                i === 0 ? 'bg-green-200 text-green-900' : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <FieldRow label="사이즈">
          <input
            value={value.size}
            onChange={(e) => onChange({ size: e.target.value })}
            placeholder="예: 가로 220 x 세로 340 x 두께 18mm"
            className={FIELD_INPUT_CLASS}
          />
        </FieldRow>
        <FieldRow label="제작 방식">
          <input
            value={value.method}
            onChange={(e) => onChange({ method: e.target.value })}
            placeholder="예: 오크 원목 스테이브 접합, 오일 마감"
            className={FIELD_INPUT_CLASS}
          />
        </FieldRow>
        <FieldRow label="CMF">
          <input
            value={value.cmf}
            onChange={(e) => onChange({ cmf: e.target.value })}
            placeholder="예: Color 내추럴 오크 / Material 원목 / Finish 오일"
            className={FIELD_INPUT_CLASS}
          />
        </FieldRow>
        <FieldRow label="컬러칩">
          <input
            value={value.colorChip}
            onChange={(e) => onChange({ colorChip: e.target.value })}
            placeholder="예: 오크 내추럴 #4"
            className={FIELD_INPUT_CLASS}
          />
        </FieldRow>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Checkbox
            checked={value.limitSampleAttached}
            onChange={(checked) => onChange({ limitSampleAttached: checked })}
            label="한도 견본 판정표 별첨함"
          />
          {value.limitSampleAttached && (
            <Text variant="body-md" className="text-neutral-500 underline">
              마루 한도 견본 판정표.docs
            </Text>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Text variant="title-lg" emphasis className="text-green-900">
          관계부서 전달사항 (선택)
        </Text>
        <textarea
          value={value.vendorNotes}
          onChange={(e) => onChange({ vendorNotes: e.target.value })}
          rows={3}
          placeholder="설계팀·구매팀에 함께 전달할 내용이 있다면 적어주세요."
          className="rounded-md bg-neutral-50 px-4 py-3 text-body-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
      </div>

      <Button
        variant="primary"
        className="h-[72px] w-[340px] self-end !rounded-xl !text-2xl"
        disabled={requiredMissing || isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? '로딩 중...' : editingFinal ? '최종본 제출' : '초안 제출'}
      </Button>
    </Card>
  )
}

export function Workspace() {
  const draftSubmitted = useSession((s) => s.draftSubmitted)
  const finalSubmitted = useSession((s) => s.finalSubmitted)
  const editingFinal = draftSubmitted && !finalSubmitted
  // Figma 실측: 초안 작성 중엔 "3회 남음", 1차 피드백을 받고 최종본을 수정하는 동안엔 "2회 남음".
  const remaining = editingFinal ? 2 : 3

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-50 p-6">
      {/* Figma "Roleplay" 사이드바 아이템(823:62680, home_repair_service 글리프)이 이 라운드
          화면에서 눌림 상태 — 우리 Sidebar의 'work' 슬롯과 같은 아이콘(HomeRepairServiceIcon). */}
      <Sidebar active="work" topItems={['apps', 'work', 'history']} className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-[340px_1fr_340px]">
          <div className="hidden lg:block" />
          <Indicator current="관계자 협업" />
          <div className="hidden items-center justify-end gap-[18px] lg:flex">
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <CloudSavedIcon className="size-5" />
            </div>
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <ProfileIcon className="size-5" />
            </div>
          </div>

          <Messenger defaultActive="senior" intro={{ persona: 'senior', text: SENIOR_INTRO }} />

          <div className="flex flex-col gap-[18px]">
            <DesignRecapCard editingFinal={editingFinal} remaining={remaining} />
            <SpecCard editingFinal={editingFinal} />
          </div>

          <WorkNotesCard
            groups={[
              { label: '사용자 요구', tags: NOTE_TAGS.userNeeds },
              { label: '제조 제약', tags: NOTE_TAGS.constraints },
              { label: 'CMF 결정 사항', tags: editingFinal ? CMF_NOTES_FINAL : CMF_NOTES_DRAFT },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
