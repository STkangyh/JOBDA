import { useRef, useState, type ReactNode } from 'react'
import { WorkFrame, WorkPanel } from '../../components/WorkFrame'
import { Messenger, WorkNotesCard } from '../../components/NegotiationPanels'
import { FeedbackRemainingBadge } from '../../components/FeedbackRemainingBadge'
import { PlusIcon } from '../../components/icons'
import { useSession, feedbackSessionsRemaining } from '../../store/session'
import { DRAFT_DESCRIPTION, SENIOR_INTRO, FEEDBACK_PASS, FEEDBACK_FAIL, SESSION2_NOTE_TAGS } from '../../data/session2Scenario'
import type { PartSpecSize } from '../../types'
import productImage from '../../assets/illustrations/product-angle-1.png'
import { track, useTrackView } from '../../lib/analytics'

// 업무 페이지 새 디자인(2026-10-13): 시방서 초안 작성 2217:10088 · 제출 로딩 2217:10180 · 1차 피드백 반영 2217:10277 ·
// 수정안 로딩 2217:11574 · 재승인 2217:10389. 왼쪽 위 과제 카드(그림+설명+피드백), 왼쪽 아래 부품별 시방서 카드(제출 버튼이
// 카드 오른쪽 위), 오른쪽 끝에 업무 노트 막대와 메신저. 아래는 이전 디자인 기준 메모(동작은 그대로 유지).
//
// Figma "관계자 협업" 라운드 — 초안 작성은 823:53712~823:54461("Desktop - 123~128", 부품 탭
// 6개 + 탭별 독립 시방서), 선임 피드백 반영 후 최종본 수정은 823:54925("Desktop - 105", "시방서
// 수정") 실측. get_design_context로 재확인해보니 예전에 size/method/cmf/colorChip flat 4필드로
// 다르게 만들어뒀던 게 실제로는 틀렸음 — 최종본 수정 화면도 초안 작성과 완전히 같은 소재/컬러
// (+첨부 버튼)/마감/사이즈(4분할)/제작방식 구성이라 SpecDraft를 PartSpec과 같은 필드셋으로
// 맞춤(FinalSpecCard 참고).

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

const NOTE_TAGS = SESSION2_NOTE_TAGS
const CMF_NOTES_DRAFT = ['화이트 오크 재질의 흡기구', '목재 접합']
// Figma 823:55090 — 1차 피드백(한도 견본 판정표 요청) 이후 CMF 결정 사항에 태그가 하나 늘어남.
const CMF_NOTES_FINAL = [...CMF_NOTES_DRAFT, '한도 견본 판정표']

// 업무 노트·메신저 칸 폭(Figma 433px) — 화면 오른쪽 끝에 붙는다
const SIDE_WIDTH = 'w-[clamp(320px,25vw,433px)]'

function TaskCard({ editingFinal, remaining }: { editingFinal: boolean; remaining: number }) {
  // QA 리포트("관계자 협업 무한 루프") 재현 결과 실제 버그였음: 이 배너가 draft.limitSampleAttached를
  // 봐서, 사용자가 수정 화면에서 한도 견본 판정표를 첨부해도 배너가 계속 FAIL로 남아있었음 —
  // 지금 편집 중인 문서(final)의 실제 첨부 상태를 봐야 한다.
  const limitSampleAttached = useSession((s) => s.final.limitSampleAttached)
  const finalApproved = useSession((s) => s.finalApproved)

  // 재승인 후(Figma 2217:10505): 그림·설명 대신 최종본 파일 목록, 1차 피드백은 제목만 남는다.
  if (editingFinal && finalApproved) {
    return (
      <WorkPanel className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-title-lg font-semibold text-green-900">시방서 최종본</h1>
          <ul className="flex flex-col gap-1 text-body-sm text-neutral-700 underline">
            <li>마루 시방서 최종본.docs</li>
            <li>마루 한도 견본 판정표 최종본.docs</li>
          </ul>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-title-lg font-semibold text-green-900">1차 피드백</h2>
          <FeedbackRemainingBadge remaining={remaining} />
        </div>
      </WorkPanel>
    )
  }

  return (
    <WorkPanel className="flex shrink-0 flex-col gap-[clamp(12px,2svh,24px)]">
      <h1 className="text-title-lg font-semibold text-neutral-700">시방서 초안 작성하기</h1>
      <div className="flex gap-6">
        <img src={productImage} alt="" className="h-[clamp(120px,25svh,280px)] w-[clamp(160px,22vw,376px)] shrink-0 rounded-2xl bg-neutral-100 object-cover" />
        <div className="flex min-h-[clamp(120px,25svh,280px)] min-w-0 flex-1 flex-col justify-between gap-[clamp(12px,2svh,24px)]">
          <p className="text-title-lg text-neutral-700">{DRAFT_DESCRIPTION}</p>
          {editingFinal && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-title-lg font-semibold text-green-900">1차 피드백</h2>
                <FeedbackRemainingBadge remaining={remaining} />
              </div>
              <p className="bg-green-200 px-3 py-6 text-body-lg whitespace-pre-line text-neutral-700">{limitSampleAttached ? FEEDBACK_PASS : FEEDBACK_FAIL}</p>
            </div>
          )}
        </div>
      </div>
    </WorkPanel>
  )
}

const FIELD_BOX = 'flex h-14 min-w-14 items-center rounded-[4px] bg-green-50 px-[15px] shadow-[inset_0_0_4px_2px_rgba(0,0,0,0.04)]'
const FIELD_INPUT = 'min-w-0 flex-1 bg-transparent text-title-lg font-semibold text-neutral-700 placeholder:font-normal placeholder:text-neutral-500 focus:outline-none'

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-[70px] shrink-0 truncate text-body-lg text-neutral-500">{label}</span>
      {children}
    </div>
  )
}

function TextField({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <label className={`${FIELD_BOX} flex-1`}>
      <span className="sr-only">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={FIELD_INPUT} />
    </label>
  )
}

function SizeFields({ size, onChange }: { size: PartSpecSize; onChange: (size: PartSpecSize) => void }) {
  return (
    <div className="grid flex-1 grid-cols-4 gap-2.5">
      {SIZE_FIELDS.map(({ key, label, unit }) => (
        <label key={key} className={`${FIELD_BOX} gap-2.5`}>
          <span className="w-[74px] shrink-0 truncate text-body-lg text-neutral-500">{label}</span>
          <input
            value={size[key]}
            onChange={(e) => onChange({ ...size, [key]: e.target.value })}
            placeholder="000"
            inputMode="decimal"
            aria-label={`${label}(${unit})`}
            className="w-full min-w-0 bg-transparent text-title-lg font-semibold text-neutral-700 placeholder:text-neutral-500 focus:outline-none"
          />
          <span className="shrink-0 text-body-lg text-neutral-700">{unit}</span>
        </label>
      ))}
    </div>
  )
}

function PartChips({ activeIndex, onSelect }: { activeIndex: number; onSelect?: (i: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PART_TAGS.map((tag, i) => {
        const cls = `shrink-0 rounded-[80px] border-2 px-3 py-2 text-body-lg text-neutral-700 drop-shadow-[0_0_8px_rgba(0,0,0,0.04)] ${
          i === activeIndex ? 'border-green-200 bg-green-300' : 'border-neutral-100 bg-green-50'
        }`
        return onSelect ? (
          <button key={tag} type="button" aria-pressed={i === activeIndex} onClick={() => onSelect(i)} className={`${cls} transition-colors hover:bg-green-100 aria-pressed:hover:bg-green-300`}>
            {tag}
          </button>
        ) : (
          <span key={tag} className={cls}>
            {tag}
          </span>
        )
      })}
    </div>
  )
}

function SubmitButton({ busy, disabled, onClick, children }: { busy: boolean; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={`flex h-[82px] w-[280px] shrink-0 items-center justify-center rounded-xl px-3 text-headline-md font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 ${
        busy ? 'cursor-wait bg-[#9fbf80] text-green-50' : 'bg-green-500 text-neutral-900 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50'
      }`}
    >
      {busy ? '로딩 중...' : children}
    </button>
  )
}

const INSTRUCTION = '업무 결정 사항과 주어진 리소스를 고려해서 부품별 시방서 초안을 작성해주세요.'

// 1차 피드백 이후 최종본 수정. 부품 칩은 탭이 아니라 표시(첫 번째 강조), 필드는 초안과 같다.
// 제출은 2단계 — "수정안 제출"로 선배 디자이너의 재승인을 받은 뒤 "시방서 인계"로 다음 단계(final_feedback)에 넘어간다
// (QA 리포트 "관계자 협업 무한 루프" 대응). currentStage는 그동안 계속 'workspace'라 finalApproved로 전환한다.
function FinalSpecCard({ isSubmitting, setIsSubmitting }: { isSubmitting: boolean; setIsSubmitting: (v: boolean) => void }) {
  const final = useSession((s) => s.final)
  const updateFinal = useSession((s) => s.updateFinal)
  const finalApproved = useSession((s) => s.finalApproved)
  const approveFinal = useSession((s) => s.approveFinal)
  const submitFinal = useSession((s) => s.submitFinal)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 컬러 옆 Add 버튼: 누르면 OS 파일 탐색기가 열리고 한도 견본 판정표 하나만 첨부한다.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    updateFinal({ limitSampleAttached: true, limitSampleFileName: file.name })
  }

  // 1차 피드백이 지적한 건 한도 견본 판정표 누락 하나뿐이라 그것만 첨부하면 넘어갈 수 있다(사용자 요청).
  const requiredMissing = !final.limitSampleAttached

  // 실제 지연은 없지만 라운드 전환감을 주려고 1200ms 붙잡아 둔다(헤더 로딩 표시와 공유).
  const handleClick = () => {
    // 피드백 확인 후 수정안을 낸 시점을 이전 "시방서 수정하러 가기"와 같은 단계 완료로 기록한다
    if (!finalApproved && useSession.getState().currentStage === 'senior_feedback') track('step_complete', { step: 'senior_feedback' })
    setIsSubmitting(true)
    setTimeout(() => {
      if (finalApproved) submitFinal()
      else approveFinal()
      setIsSubmitting(false)
    }, 1200)
  }

  return (
    <WorkPanel className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="text-title-lg font-semibold text-neutral-700">{finalApproved ? '최종적인 시방서 사양을 인계 전 확인하세요.' : INSTRUCTION}</h2>
          <PartChips activeIndex={0} />
        </div>
        <SubmitButton busy={isSubmitting} disabled={!finalApproved && requiredMissing} onClick={handleClick}>
          {finalApproved ? '시방서 인계' : '수정안 제출'}
        </SubmitButton>
      </div>

      <div className="flex flex-col gap-3">
        <FieldRow label="소재">
          <TextField label="소재" value={final.material} onChange={(v) => updateFinal({ material: v })} placeholder="예: 화이트 오크 원목" />
        </FieldRow>
        <FieldRow label="컬러">
          <div className="flex flex-1 items-center gap-3">
            {/* 첨부된 파일명은 컬러 입력창 안에 컬러값과 나란히 표시한다(Figma "Panton 0000" 자리) */}
            <div className={`${FIELD_BOX} flex-1 gap-2.5`}>
              <input value={final.color} onChange={(e) => updateFinal({ color: e.target.value })} placeholder="예: 오크 내추럴" aria-label="컬러" className={FIELD_INPUT} />
              {final.limitSampleAttached && (
                <button
                  type="button"
                  onClick={() => updateFinal({ limitSampleAttached: false, limitSampleFileName: null })}
                  title="클릭하면 첨부 제거"
                  className="max-w-[50%] shrink-0 truncate text-title-lg font-semibold text-neutral-500 underline hover:text-neutral-600"
                >
                  {final.limitSampleFileName ?? '한도 견본 판정표.docs'}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="한도 견본 판정표 첨부"
              className={`${FIELD_BOX} size-14 justify-center px-0 text-neutral-500 hover:text-neutral-700`}
            >
              <PlusIcon className="size-5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
          </div>
        </FieldRow>
        <FieldRow label="마감">
          <TextField label="마감" value={final.finish} onChange={(v) => updateFinal({ finish: v })} placeholder="예: 오일 마감" />
        </FieldRow>
        <FieldRow label="사이즈">
          <SizeFields size={final.size} onChange={(size) => updateFinal({ size })} />
        </FieldRow>
        <FieldRow label="제작 방식">
          <TextField label="제작 방식" value={final.method} onChange={(v) => updateFinal({ method: v })} placeholder="예: 오크 원목 스테이브 접합" />
        </FieldRow>
      </div>
    </WorkPanel>
  )
}

// 초안 작성 — 부품 칩 6개가 실제 탭이다. 탭을 누르면 그 부품의 소재/컬러/마감/사이즈/제작방식이 바뀌어 보인다(draftParts[i]).
function DraftPartsCard({ isSubmitting, setIsSubmitting }: { isSubmitting: boolean; setIsSubmitting: (v: boolean) => void }) {
  const draftParts = useSession((s) => s.draftParts)
  const updateDraftPart = useSession((s) => s.updateDraftPart)
  const setPartAttachment = useSession((s) => s.setPartAttachment)
  const submitDraft = useSession((s) => s.submitDraft)
  const [activeIndex, setActiveIndex] = useState(0)
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const part = draftParts[activeIndex]
  const fileInputRef = useRef<HTMLInputElement>(null)
  // OS 파일 탐색기는 비동기(모달)라, 열려있는 동안 탭을 옮길 수 있어 어느 부품의 어떤 첨부였는지를 ref로 들고 있다.
  const pendingAttachmentRef = useRef<{ index: number; kind: 'colorChip' | 'limitSample' } | null>(null)

  const requiredMissing = draftParts.some((p) => !p.material.trim() || !p.color.trim() || !p.finish.trim() || !p.method.trim())

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

  const handleSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      submitDraft()
      setIsSubmitting(false)
    }, 1200)
  }

  return (
    <WorkPanel className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="text-title-lg font-semibold text-neutral-700">{INSTRUCTION}</h2>
          <PartChips activeIndex={activeIndex} onSelect={selectTab} />
        </div>
        <SubmitButton busy={isSubmitting} disabled={requiredMissing} onClick={handleSubmit}>
          초안 제출
        </SubmitButton>
      </div>

      <div className="flex flex-col gap-3">
        <FieldRow label="소재">
          <TextField label="소재" value={part.material} onChange={(v) => updateDraftPart(activeIndex, { material: v })} placeholder="예: 화이트 오크 원목" />
        </FieldRow>
        <FieldRow label="컬러">
          <div className="flex flex-1 items-center gap-3">
            <div className={`${FIELD_BOX} flex-1 gap-2.5`}>
              <input value={part.color} onChange={(e) => updateDraftPart(activeIndex, { color: e.target.value })} placeholder="예: 오크 내추럴" aria-label="컬러" className={FIELD_INPUT} />
              {part.attachment && (
                <button
                  type="button"
                  onClick={() => setPartAttachment(activeIndex, null)}
                  title="클릭하면 첨부 제거"
                  className="max-w-[50%] shrink-0 truncate text-title-lg font-semibold text-neutral-500 underline hover:text-neutral-600"
                >
                  {part.attachmentFileName ?? (part.attachment === 'colorChip' ? '컬러칩.jpg' : '마루 한도 견본 판정표.docs')}
                </button>
              )}
            </div>
            {/* 컬러칩/한도 견본 판정표 중 하나를 첨부하는 버튼 */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setAttachMenuOpen((v) => !v)}
                aria-label="컬러칩 또는 한도 견본 판정표 첨부"
                aria-expanded={attachMenuOpen}
                className={`${FIELD_BOX} size-14 justify-center px-0 text-neutral-500 hover:text-neutral-700`}
              >
                <PlusIcon className="size-5" />
              </button>
              {attachMenuOpen && (
                <div className="absolute top-[64px] right-0 z-10 flex w-[200px] flex-col overflow-hidden rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
                  <button type="button" onClick={() => requestAttachment('colorChip')} className="px-4 py-3 text-left text-body-md text-neutral-700 hover:bg-neutral-50">
                    컬러칩 첨부
                  </button>
                  <button type="button" onClick={() => requestAttachment('limitSample')} className="px-4 py-3 text-left text-body-md text-neutral-700 hover:bg-neutral-50">
                    한도 견본 판정표 첨부
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
            </div>
          </div>
        </FieldRow>
        <FieldRow label="마감">
          <TextField label="마감" value={part.finish} onChange={(v) => updateDraftPart(activeIndex, { finish: v })} placeholder="예: 오일 마감" />
        </FieldRow>
        <FieldRow label="사이즈">
          <SizeFields size={part.size} onChange={(size) => updateDraftPart(activeIndex, { size })} />
        </FieldRow>
        {/* Figma 새 디자인은 이 줄 라벨이 "외주업체"지만, 저장·평가 항목은 제작 방식이라 라벨을 유지했다(확인 필요). */}
        <FieldRow label="제작 방식">
          <TextField label="제작 방식" value={part.method} onChange={(v) => updateDraftPart(activeIndex, { method: v })} placeholder="예: CNC 가공" />
        </FieldRow>
        {/* 새 디자인에는 없지만 직무 리포트의 "이해도"가 부품별 선택 근거 작성 여부로 계산돼 남겨 둔다 */}
        <FieldRow label="선택 근거">
          <TextField
            label="선택 근거"
            value={part.reasoning}
            onChange={(v) => updateDraftPart(activeIndex, { reasoning: v })}
            placeholder="이 부품에 이 소재·컬러·마감을 고른 이유"
          />
        </FieldRow>
      </div>
    </WorkPanel>
  )
}

export function Workspace() {
  const draftSubmitted = useSession((s) => s.draftSubmitted)
  const finalSubmitted = useSession((s) => s.finalSubmitted)
  const currentStage = useSession((s) => s.currentStage)
  const editingFinal = draftSubmitted && !finalSubmitted
  useTrackView({ kind: 'panel', name: `workspace_mode:${editingFinal ? 'final' : 'draft'}` })
  const remaining = feedbackSessionsRemaining(currentStage, editingFinal)
  // 제출 버튼 로딩 상태 — 버튼뿐 아니라 헤더 로딩 표시도 같이 반응해야 해서 여기(부모)에 둔다.
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <WorkFrame step="관계자 협업" sidebar="work" loading={isSubmitting} exitStep="workspace" flushRight>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
        <TaskCard editingFinal={editingFinal} remaining={remaining} />
        {editingFinal ? (
          <FinalSpecCard isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} />
        ) : (
          <DraftPartsCard isSubmitting={isSubmitting} setIsSubmitting={setIsSubmitting} />
        )}
      </div>

      <aside className={`flex min-h-0 ${SIDE_WIDTH} shrink-0 flex-col gap-4`}>
        <WorkNotesCard
          groups={[
            { label: '사용자 요구', tags: NOTE_TAGS.userNeeds },
            { label: '제조 제약', tags: NOTE_TAGS.constraints },
            { label: 'CMF 결정 사항', tags: editingFinal ? CMF_NOTES_FINAL : CMF_NOTES_DRAFT },
          ]}
        />
        <div className="min-h-0 flex-1">
          <Messenger defaultActive="senior" intro={{ persona: 'senior', text: SENIOR_INTRO }} />
        </div>
      </aside>
    </WorkFrame>
  )
}
