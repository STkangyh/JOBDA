import { useRef, useState, type ReactNode } from 'react'
import { Sidebar } from '../components/Sidebar'
import { Indicator } from '../components/Indicator'
import { Card } from '../components/Card'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { Messenger, WorkNotesCard } from '../components/NegotiationPanels'
import { WarningIcon, CloudSavedIcon, ProfileIcon, PlusIcon } from '../components/icons'
import { useSession, feedbackSessionsRemaining } from '../store/session'
import type { PartSpecSize } from '../types'
import productImage from '../assets/illustrations/product-angle-1.png'

// Figma "관계자 협업" 라운드 — 초안 작성은 823:53712~823:54461("Desktop - 123~128", 부품 탭
// 6개 + 탭별 독립 시방서), 선임 피드백 반영 후 최종본 수정은 823:54925("Desktop - 105", "시방서
// 수정") 실측. get_design_context로 재확인해보니 예전에 size/method/cmf/colorChip flat 4필드로
// 다르게 만들어뒀던 게 실제로는 틀렸음 — 최종본 수정 화면도 초안 작성과 완전히 같은 소재/컬러
// (+첨부 버튼)/마감/사이즈(4분할)/제작방식 구성이라 SpecDraft를 PartSpec과 같은 필드셋으로
// 맞춤(FinalSpecCard 참고).
const DRAFT_DESCRIPTION =
  '이번 공기청정기의 외부 CMF 소재는 오크 재질의 원목을 사용하고자 합니다. 색상은 자연스러운 원목의 색상을 살릴 수 있는 오크 내추럴 컬러로 하며, 목재 접합 설비를 활용한 제작 공정을 거치고자 합니다.'

// Figma 823:53614 — 라운드 시작 시 이미 와있는 선임 디자이너의 첫 메시지(장면 설정용). 실제 대화는
// PersonaChat과 동일하게 real backend(apiChat)로 이어지므로 이 인트로는 store에 넣지 않는다.
const SENIOR_INTRO =
  '색이랑 마감 모두 결정됐어요. 설계팀에 넘길 시방서 작성하고 저한테 보내주세요.\n미리 말하는데, 이번에 목재 처음 써보는 거라 사내 공장에서 목재 접합은 안 하는 거로 알고 있어요. 시트지로 마감하거나, 외부 업체 알아봐야 할 겁니다. 발주 일정까지 12일 남았는데 그 안에 어떻게든 해결하세요.'

// Figma 823:53712~823:54461(Desktop-123~128) — "시방서 작성 방향 선택" 제목 옆 부품 태그 6개.
// 처음엔 단일 프레임(823:53571/Desktop-104)만 보고 순수 장식용 4개 태그로 만들었는데, 같은
// x좌표에 세로로 쌓인 6개 프레임을 전부 열어보니 프레임마다 강조된 태그가 다르고(예: Desktop-124는
// "상부 하우징"이 강조) 그 아래 소재/컬러/마감/사이즈/제작방식 값도 프레임마다 완전히 다름
// (예: 목재 흡기구 커버=화이트 오크 원목/오크 내추럴/오일 마감, 상부 하우징=6000계열 알루미늄/
// 실버/아노다이징) — 즉 6개 프레임은 "같은 화면의 탭 6개 상태"였다. store의 draftParts(6칸)와
// 인덱스로 짝지어 탭 전환에 쓴다.
const PART_TAGS = ['목재 흡기구 커버', '상부 하우징', '하부 하우징', '가죽 스트랩', 'PUI 패널', '미끄럼 방지 패드']

const SIZE_FIELDS: { key: keyof PartSpecSize; label: string; unit: string }[] = [
  { key: 'depth', label: 'Depth', unit: 'mm' },
  { key: 'width', label: 'Width', unit: 'mm' },
  { key: 'height', label: 'Height', unit: 'mm' },
  { key: 'thickness', label: 'Thickness', unit: 't' },
]

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
          // Figma 823:54925 실측: FAIL 상태도 경고 테두리가 아니라 bg-green-200 평문 박스였음.
          <div className={`rounded-md p-5 ${limitSampleAttached ? 'bg-green-50' : 'bg-green-200'}`}>
            <Text variant="body-lg" className="whitespace-pre-line text-neutral-700">
              {limitSampleAttached ? FEEDBACK_PASS : FEEDBACK_FAIL}
            </Text>
          </div>
        ) : (
          <Text variant="body-md" className="text-neutral-400">
            초안을 제출하면 여기에 선배 디자이너의 피드백이 도착합니다.
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

// Figma 823:54925("Desktop - 105", "시방서 수정") — 1차 피드백 이후 최종본을 수정하는 화면.
// 부품 태그는 탭이 아니라 정적 표시(첫 번째만 강조)지만, 그 아래 필드 구성 자체는 초안 작성
// 화면(DraftPartsCard)과 완전히 동일 — 소재/컬러(+첨부)/마감/사이즈(4분할)/제작방식. 제출
// 버튼은 이 카드 안이 아니라 Figma에서 업무노트 카드 바로 아래(오른쪽 컬럼)에 있어서
// FinalSubmitButton으로 분리했다. "관계부서 전달사항"은 이 프레임엔 없었지만, computeFindings의
// deadline_margin_ignored 판정이 참조하는 유일한 자유 입력이라 그대로 남겨둠.
function FinalSpecCard() {
  const final = useSession((s) => s.final)
  const updateFinal = useSession((s) => s.updateFinal)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Figma 823:54925의 컬러 옆 Add 버튼 주석: "누르면 OS 기본 파일 탐색기가 열립니다" — 초안
  // 화면과 달리 컬러칩/한도 견본 중 고르는 메뉴 없이 한도 견본 판정표 하나만 첨부한다.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    updateFinal({ limitSampleAttached: true, limitSampleFileName: file.name })
  }

  return (
    <Card className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Text variant="title-lg" emphasis className="text-green-900">
          시방서 수정
        </Text>
        <div className="flex flex-wrap gap-3">
          {PART_TAGS.map((tag, i) => (
            <span
              key={tag}
              className={`shrink-0 rounded-full px-3 py-2 text-caption-lg ${
                i === 0 ? 'bg-green-300 text-green-900' : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <FieldRow label="소재">
          <input
            value={final.material}
            onChange={(e) => updateFinal({ material: e.target.value })}
            placeholder="예: 화이트 오크 원목"
            className={FIELD_INPUT_CLASS}
          />
        </FieldRow>
        <FieldRow label="컬러">
          <div className="flex flex-1 items-center gap-2">
            {/* Figma 823:55090(Desktop-130) 실측: 첨부된 파일명은 별도 박스가 아니라 컬러
                입력창 안에 컬러값과 나란히(밑줄 처리된 회색 텍스트로) 표시된다. */}
            <div className="flex h-[50px] flex-1 items-center gap-2.5 rounded-md bg-neutral-50 px-4">
              <input
                value={final.color}
                onChange={(e) => updateFinal({ color: e.target.value })}
                placeholder="예: 오크 내추럴"
                className="min-w-0 flex-1 bg-transparent text-body-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
              {final.limitSampleAttached && (
                <button
                  type="button"
                  onClick={() => updateFinal({ limitSampleAttached: false, limitSampleFileName: null })}
                  title="클릭하면 첨부 제거"
                  className="shrink-0 truncate text-body-lg text-neutral-500 underline transition-colors hover:text-neutral-600"
                >
                  {final.limitSampleFileName ?? '한도 견본 판정표.docs'}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="한도 견본 판정표 첨부"
              className="flex size-[50px] shrink-0 items-center justify-center rounded-md bg-neutral-50 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            >
              <PlusIcon className="size-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </FieldRow>
        <FieldRow label="마감">
          <input
            value={final.finish}
            onChange={(e) => updateFinal({ finish: e.target.value })}
            placeholder="예: 오일 마감"
            className={FIELD_INPUT_CLASS}
          />
        </FieldRow>
        <FieldRow label="사이즈">
          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
            {SIZE_FIELDS.map(({ key, label, unit }) => (
              <input
                key={key}
                value={final.size[key]}
                onChange={(e) => updateFinal({ size: { ...final.size, [key]: e.target.value } })}
                placeholder={`${label}(${unit})`}
                className="h-[50px] rounded-md bg-neutral-50 px-3 text-body-md text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
            ))}
          </div>
        </FieldRow>
        <FieldRow label="제작 방식">
          <input
            value={final.method}
            onChange={(e) => updateFinal({ method: e.target.value })}
            placeholder="예: 오크 원목 스테이브 접합"
            className={FIELD_INPUT_CLASS}
          />
        </FieldRow>
      </div>

      <div className="flex flex-col gap-3">
        <Text variant="title-lg" emphasis className="text-green-900">
          관계부서 전달사항 (선택)
        </Text>
        <textarea
          value={final.vendorNotes}
          onChange={(e) => updateFinal({ vendorNotes: e.target.value })}
          rows={3}
          placeholder="설계팀·구매팀에 함께 전달할 내용이 있다면 적어주세요."
          className="rounded-md bg-neutral-50 px-4 py-3 text-body-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
      </div>
    </Card>
  )
}

function FinalSubmitButton() {
  const final = useSession((s) => s.final)
  const submitFinal = useSession((s) => s.submitFinal)
  // Figma 823:54925의 "로딩 중..." 버튼 상태 — session1/Workspace.tsx ReviewAndChoice와 동일하게
  // 실제 지연은 없지만(클라이언트 계산) 라운드 전환감을 주기 위해 1200ms 붙잡아둔다.
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1차 피드백이 지적한 건 한도 견본 판정표 누락 하나뿐이라, 그것만 첨부하면 넘어갈 수 있어야
  // 한다 — 나머지 필드는 계속 편집 가능하게 두되 CTA를 막지는 않는다(사용자 요청).
  const requiredMissing = !final.limitSampleAttached

  const handleSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      submitFinal()
      setIsSubmitting(false)
    }, 1200)
  }

  return (
    <Button
      variant="primary"
      className="h-[72px] w-full shrink-0 !rounded-xl !text-2xl"
      disabled={requiredMissing || isSubmitting}
      onClick={handleSubmit}
    >
      {isSubmitting ? '로딩 중...' : '수정안 제출'}
    </Button>
  )
}

// Figma 823:53712~823:54461(Desktop-123~128) — 초안 작성은 부품 탭 6개가 실제 탭이었다. 탭을
// 누르면 그 부품의 소재/컬러/마감/사이즈/제작방식/선택근거가 바뀌어 보인다(draftParts[i]).
// "초안 제출" 버튼은 이 카드 안이 아니라 Figma에서 업무노트 카드 바로 아래(오른쪽 컬럼)에
// 있어서 DraftSubmitButton으로 분리했다.
function DraftPartsCard() {
  const draftParts = useSession((s) => s.draftParts)
  const updateDraftPart = useSession((s) => s.updateDraftPart)
  const setPartAttachment = useSession((s) => s.setPartAttachment)
  const [activeIndex, setActiveIndex] = useState(0)
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const part = draftParts[activeIndex]
  const fileInputRef = useRef<HTMLInputElement>(null)
  // OS 파일 탐색기는 비동기(모달)라, 다이얼로그가 열려있는 동안 탭을 옮길 가능성까지 감안해서
  // "어느 부품의 어떤 첨부 종류였는지"를 state가 아니라 ref로 들고 있다가 onChange에서 꺼내 쓴다.
  const pendingAttachmentRef = useRef<{ index: number; kind: 'colorChip' | 'limitSample' } | null>(null)

  const selectTab = (i: number) => {
    setActiveIndex(i)
    setAttachMenuOpen(false)
  }

  const requestAttachment = (kind: 'colorChip' | 'limitSample') => {
    pendingAttachmentRef.current = { index: activeIndex, kind }
    setAttachMenuOpen(false)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const pending = pendingAttachmentRef.current
    pendingAttachmentRef.current = null
    e.target.value = ''
    if (!file || !pending) return
    setPartAttachment(pending.index, pending.kind, file.name)
  }

  return (
    <Card className="flex flex-col gap-8 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Text variant="title-lg" emphasis className="text-green-900">
          시방서 작성 방향 선택
        </Text>
        <div className="flex flex-wrap gap-3">
          {PART_TAGS.map((tag, i) => (
            <button
              key={tag}
              type="button"
              onClick={() => selectTab(i)}
              className={`shrink-0 rounded-full px-3 py-2 text-caption-lg transition-colors ${
                i === activeIndex ? 'bg-green-200 text-green-900' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <FieldRow label="소재">
          <input
            value={part.material}
            onChange={(e) => updateDraftPart(activeIndex, { material: e.target.value })}
            placeholder="예: 화이트 오크 원목"
            className={FIELD_INPUT_CLASS}
          />
        </FieldRow>
        <FieldRow label="컬러">
          <div className="flex flex-1 items-center gap-2">
            <input
              value={part.color}
              onChange={(e) => updateDraftPart(activeIndex, { color: e.target.value })}
              placeholder="예: 오크 내추럴"
              className={FIELD_INPUT_CLASS}
            />
            {/* Figma 823:53807("Add") — 컬러칩/한도 견본 판정표 중 하나를 첨부하는 버튼. */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setAttachMenuOpen((v) => !v)}
                aria-label="컬러칩 또는 한도 견본 판정표 첨부"
                className="flex size-[50px] items-center justify-center rounded-md bg-neutral-50 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
              >
                <PlusIcon className="size-5" />
              </button>
              {attachMenuOpen && (
                <div className="absolute right-0 top-[58px] z-10 flex w-[200px] flex-col overflow-hidden rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => requestAttachment('colorChip')}
                    className="px-4 py-3 text-left text-body-md text-neutral-700 hover:bg-neutral-50"
                  >
                    컬러칩 첨부
                  </button>
                  <button
                    type="button"
                    onClick={() => requestAttachment('limitSample')}
                    className="px-4 py-3 text-left text-body-md text-neutral-700 hover:bg-neutral-50"
                  >
                    한도 견본 판정표 첨부
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </FieldRow>
        {part.attachment && (
          <div className="flex items-center justify-between rounded-md bg-green-50 px-4 py-3 sm:ml-[108px]">
            <Text variant="body-md" className="text-green-800 underline">
              {part.attachmentFileName ?? (part.attachment === 'colorChip' ? '컬러칩.jpg' : '마루 한도 견본 판정표.docs')}
            </Text>
            <button
              type="button"
              onClick={() => setPartAttachment(activeIndex, null)}
              className="text-caption-sm text-neutral-400 transition-colors hover:text-neutral-600"
            >
              제거
            </button>
          </div>
        )}
        <FieldRow label="마감">
          <input
            value={part.finish}
            onChange={(e) => updateDraftPart(activeIndex, { finish: e.target.value })}
            placeholder="예: 오일 마감"
            className={FIELD_INPUT_CLASS}
          />
        </FieldRow>
        <FieldRow label="사이즈">
          <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
            {SIZE_FIELDS.map(({ key, label, unit }) => (
              <input
                key={key}
                value={part.size[key]}
                onChange={(e) => updateDraftPart(activeIndex, { size: { ...part.size, [key]: e.target.value } })}
                placeholder={`${label}(${unit})`}
                className="h-[50px] rounded-md bg-neutral-50 px-3 text-body-md text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
            ))}
          </div>
        </FieldRow>
        <FieldRow label="제작 방식">
          <input
            value={part.method}
            onChange={(e) => updateDraftPart(activeIndex, { method: e.target.value })}
            placeholder="예: CNC 가공"
            className={FIELD_INPUT_CLASS}
          />
        </FieldRow>
      </div>

      <div className="flex flex-col gap-3">
        <Text variant="title-lg" emphasis className="text-green-900">
          선택 근거 입력
        </Text>
        <textarea
          value={part.reasoning}
          onChange={(e) => updateDraftPart(activeIndex, { reasoning: e.target.value })}
          rows={3}
          placeholder="이 부품에 이 소재·컬러·마감을 선택한 이유를 적어주세요."
          className="rounded-md bg-neutral-50 px-4 py-3 text-body-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
      </div>
    </Card>
  )
}

function DraftSubmitButton() {
  const draftParts = useSession((s) => s.draftParts)
  const submitDraft = useSession((s) => s.submitDraft)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const requiredMissing = draftParts.some(
    (p) => !p.material.trim() || !p.color.trim() || !p.finish.trim() || !p.method.trim(),
  )

  const handleSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      submitDraft()
      setIsSubmitting(false)
    }, 1200)
  }

  return (
    <Button
      variant="primary"
      className="h-[72px] w-full shrink-0 !rounded-xl !text-2xl"
      disabled={requiredMissing || isSubmitting}
      onClick={handleSubmit}
    >
      {isSubmitting ? '로딩 중...' : '초안 제출'}
    </Button>
  )
}

export function Workspace() {
  const draftSubmitted = useSession((s) => s.draftSubmitted)
  const finalSubmitted = useSession((s) => s.finalSubmitted)
  const currentStage = useSession((s) => s.currentStage)
  const editingFinal = draftSubmitted && !finalSubmitted
  const remaining = feedbackSessionsRemaining(currentStage, editingFinal)

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
            {editingFinal ? <FinalSpecCard /> : <DraftPartsCard />}
          </div>

          <div className="flex flex-col gap-[18px]">
            <WorkNotesCard
              groups={[
                { label: '사용자 요구', tags: NOTE_TAGS.userNeeds },
                { label: '제조 제약', tags: NOTE_TAGS.constraints },
                { label: 'CMF 결정 사항', tags: editingFinal ? CMF_NOTES_FINAL : CMF_NOTES_DRAFT },
              ]}
            />
            {editingFinal ? <FinalSubmitButton /> : <DraftSubmitButton />}
          </div>
        </div>
      </div>
    </div>
  )
}
