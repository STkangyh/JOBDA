import { useState } from 'react'
import { WorkFrame, WorkPanel } from '../../components/WorkFrame'
import { Checkbox } from '../../components/Checkbox'
import { ModelAnswerChip, SendRoundButton } from '../../components/WorkControls'
import purchasingAvatar from '../../assets/work/avatars/purchasing.png'
import { WorkSidePanel } from '../../components/NegotiationPanels'
import { FeedbackRemainingBadge } from '../../components/FeedbackRemainingBadge'
import { useSession, feedbackSessionsRemaining } from '../../store/session'
import type { VendorOption } from '../../types'
import { useTrackView } from '../../lib/analytics'


// Figma 823:57101(Desktop-141) "3차 피드백" 배너 실측 — 이전엔 이 문구를 표 기준(납기일/가능
// 수량/단가 3개)으로 오해해서 VendorOption 자체를 잘못 만들었었다. 실제 표 기준은 아래 ROWS
// 8개(업체 소재지~수용량)이고, 이 배너는 그중 일부(납기일 유사어인 발주 단가/수용량 등)를
// "다시 한번 우선 고려하라"고 조언하는 자유 텍스트일 뿐이다.
const PURCHASING_FEEDBACK =
  '납기일, 가능 수량, 단가 고려해서 적절한 업체를 다시 한 번 확인해보세요. 납기일 맞추는 게 가장 어려워요.\n혹시 모를 지연 요소가 있을 수도 있으니 일정을 여유롭게 잡으세요.'

// Figma 823:56196(Desktop-137) 등 — 이 라운드의 메신저 기본 탭은 구매팀(139/140/141 전부
// 구매팀 탭이 활성 상태로 실측됨 — 제안서를 전달하고 응답을 받는 상대가 구매팀이라서).
const SENIOR_VENDOR_INTRO =
  '디자인 시방서 최종본, 한도 견본 판정표와 함께 공유드려요. 일정이 촉박한 관계로 보시고 수정사항 정리해서 오늘 20시까지 보내주세요.'

// Figma 823:56423(Desktop-138) 실측 8개 기준 — "납기일/가능 수량/단가" 3개가 아니었다(자세한
// 경위는 types.ts VendorOption 주석 참고). unitPrice/capacity만 숫자, 나머지는 자유 텍스트.
const ROWS: { key: keyof Omit<VendorOption, 'name'>; label: string; unit?: string }[] = [
  { key: 'location', label: '업체 소재지' },
  { key: 'specialty', label: '주력 분야' },
  { key: 'deliveryHistory', label: '납품 이력' },
  { key: 'skillLevel', label: '기술 수준' },
  { key: 'oilFinish', label: '오일 마감' },
  { key: 'sampleQuality', label: '샘플 수준' },
  { key: 'unitPrice', label: '발주 단가', unit: '원' },
  { key: 'capacity', label: '수용량', unit: 'ea' },
]

const VENDOR_GRID_COLS = 'grid-cols-[90px_repeat(4,minmax(120px,1fr))]'
// 입력칸은 시방서 화면(Workspace FIELD_BOX)과 같은 연두 칸 — 표라 높이만 조금 낮췄다
const CELL_BOX = 'flex h-12 min-w-0 items-center rounded-[4px] bg-green-50 px-3 text-body-lg shadow-[inset_0_0_4px_2px_rgba(0,0,0,0.04)]'

function VendorTable({
  editable,
  vendors,
  onChange,
  selectable,
  selectedIndex,
  onSelect,
}: {
  editable: boolean
  vendors: VendorOption[]
  onChange: (i: number, fields: Partial<VendorOption>) => void
  /** Figma 823:56735(Desktop-139) — 조사 완료 이후엔 표가 읽기전용으로 잠기는 대신, 업체
   *  이름 옆에 체크박스가 붙어 하나만 고를 수 있게 된다(라디오처럼 항상 하나는 선택돼 있음). */
  selectable: boolean
  selectedIndex: number
  onSelect: (i: number) => void
}) {
  return (
    // min-w-0을 그리드 트랙에 직접 주지 않는 이유, overflow-x-auto인 이유는 VendorCompare.tsx의
    // 그리드 wrapper 주석 참고(QA에서 실제로 표가 안 보이는 버그로 이어졌던 자리).
    <div className="flex flex-col gap-4 overflow-x-auto">
      <div className={`grid ${VENDOR_GRID_COLS} items-center gap-2.5`}>
        <span className="text-body-lg text-neutral-500">업체 항목</span>
        {vendors.map((v, i) =>
          editable ? (
            <input
              key={i}
              value={v.name}
              onChange={(e) => onChange(i, { name: e.target.value })}
              placeholder={`업체 ${i + 1} 이름`}
              aria-label={`업체 ${i + 1} 이름`}
              className={`${CELL_BOX} font-semibold text-neutral-900 placeholder:font-normal placeholder:text-neutral-400 focus:outline-none`}
            />
          ) : selectable ? (
            <Checkbox
              key={i}
              checked={selectedIndex === i}
              onChange={() => onSelect(i)}
              label={v.name || `업체 ${i + 1}`}
              className="min-w-0"
            />
          ) : (
            <span key={i} className="truncate text-body-lg font-semibold text-neutral-900">
              {v.name || `업체 ${i + 1}`}
            </span>
          ),
        )}
      </div>

      <div className="flex flex-col">
        {ROWS.map((row) => (
          <div key={row.key} className="flex flex-col">
            <div className={`grid ${VENDOR_GRID_COLS} items-center gap-2.5 py-1.5`}>
              <span className="truncate text-body-lg text-neutral-500">{row.label}</span>
              {vendors.map((v, i) =>
                editable ? (
                  <div key={i} className={`${CELL_BOX} gap-1.5`}>
                    <input
                      type={row.unit ? 'number' : 'text'}
                      value={v[row.key]}
                      onChange={(e) =>
                        onChange(i, {
                          [row.key]: row.unit ? (e.target.value ? Number(e.target.value) : '') : e.target.value,
                        } as Partial<VendorOption>)
                      }
                      placeholder={row.unit ? '0' : `ex) ${row.label}`}
                      aria-label={`업체 ${i + 1} ${row.label}`}
                      className="min-w-0 flex-1 bg-transparent text-body-lg text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
                    />
                    {row.unit && <span className="shrink-0 text-body-md text-neutral-400">{row.unit}</span>}
                  </div>
                ) : (
                  // Figma 823:56735(Desktop-139) 실측: 선택된 업체 열 전체에 옅은 초록 배경 띠가
                  // 깔린다 — 정적 nth-child가 아니라 실제 selectedIndex와 비교해야 선택이
                  // 바뀔 때 띠도 같이 움직인다.
                  <span key={i} className={`truncate rounded-[4px] px-3 py-2.5 text-body-lg text-neutral-700 ${selectable && i === selectedIndex ? 'bg-green-50' : ''}`}>
                    {v[row.key] === '' ? '-' : `${v[row.key]}${row.unit ?? ''}`}
                  </span>
                ),
              )}
            </div>
            <div className="h-px w-full bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Figma 823:56196~823:57101(Desktop-137~141) 재확인 — 한 스토어 스테이지(vendor_compare)가
// 실제로는 3단계다: (1) 137/138 "외주 업체 탐색" — 표를 직접 채워 넣는 조사 단계, (2) 139/140
// "외주 업체 선정" — 표가 잠기고 체크박스로 하나만 골라 구매팀에 제안(제안서 전달), (3) 141
// "외주 업체 선정"(피드백) — 구매팀 응답 + 3차 피드백 배너를 보고 필요하면 다시 골라 수정안
// 제출. Stage enum은 늘리지 않고(다른 에이전트들이 types.ts를 동시에 건드릴 수 있어서 금지됨)
// 로컬 phase + store의 vendorProposed 플래그로 세 단계를 구현한다(Workspace.tsx의
// editingFinal/finalApproved와 같은 패턴) — 인디케이터 라벨도 phase에 따라
// "제안서 작성"→"피드백 수정"으로 바뀐다(823:56790 GNB 실측: 137~140은 "제안서 작성"이 활성,
// 141은 "피드백 수정"이 활성).
export function VendorCompare() {
  const vendors = useSession((s) => s.vendors)
  const updateVendor = useSession((s) => s.updateVendor)
  const selectedVendorIndex = useSession((s) => s.selectedVendorIndex)
  const selectVendor = useSession((s) => s.selectVendor)
  const vendorProposed = useSession((s) => s.vendorProposed)
  const proposeVendor = useSession((s) => s.proposeVendor)
  const submitVendors = useSession((s) => s.submitVendors)
  const currentStage = useSession((s) => s.currentStage)
  const remaining = feedbackSessionsRemaining(currentStage, false)

  const [phase, setPhase] = useState<'research' | 'select'>('research')
  useTrackView({ kind: 'panel', name: `vendor_phase:${vendorProposed ? 'feedback' : phase}` })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const complete = vendors.every(
    (v) =>
      v.name && v.location && v.specialty && v.deliveryHistory && v.skillLevel && v.oilFinish && v.sampleQuality && v.unitPrice && v.capacity,
  )

  const handlePropose = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      proposeVendor()
      setIsSubmitting(false)
    }, 1200)
  }

  const handleSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      submitVendors()
      setIsSubmitting(false)
    }, 1200)
  }

  // 외주업체 조사는 새 디자인이 없어 흐름(조사 → 선정·제안 → 3차 피드백 후 수정안)은 그대로 두고,
  // 디자인 시스템(2026-10-31)의 업무 화면 모양에 맞췄다(2026-11-02 결정): 위 업무 지시 카드(지시한 사람 얼굴),
  // 아래 작업 카드 오른쪽 위에 모범답안 칩 + 보내기 버튼, 입력칸은 시방서와 같은 연두 칸.
  const title = phase === 'research' ? '외주 업체 탐색' : '외주 업체 선정'
  const instruction =
    phase === 'research'
      ? '필요한 업체를 찾고 아래 항목에 맞게 리스트에 정리하세요.'
      : vendorProposed
        ? '구매팀 의견을 보고 업체를 다시 확인한 뒤 수정안을 제출하세요.'
        : '가장 적합한 조건의 업체를 하나 골라 구매팀에 제안하세요.'
  const send =
    phase === 'research'
      ? { label: '조사 완료', disabled: !complete, onClick: () => setPhase('select') }
      : vendorProposed
        ? { label: '수정안 제출', disabled: isSubmitting, onClick: handleSubmit }
        : { label: '제안서 전달', disabled: isSubmitting, onClick: handlePropose }

  return (
    <WorkFrame step={vendorProposed ? '피드백 수정' : '제안서 작성'} sidebar="work" loading={isSubmitting} exitStep="vendor_compare" flushRight>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
        <WorkPanel className="flex shrink-0 flex-col gap-[clamp(12px,2svh,24px)]">
          <h1 className="text-title-lg font-semibold text-neutral-700">{title}</h1>
          <div className="flex gap-6">
            <img src={purchasingAvatar} alt="구매팀 김부장" width={96} height={96} className="size-[clamp(64px,8.6svh,96px)] shrink-0 rounded-full bg-neutral-50 object-cover" />
            <p className="min-w-0 flex-1 text-title-lg text-neutral-700">
              외부 업체에 목재 하우징 생산을 맡기기로 했어요. 후보 업체를 조사해 비교하고, 조건이 가장 맞는 곳을 구매팀에 제안해 주세요.
            </p>
          </div>
          {vendorProposed && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-title-lg font-semibold text-green-900">3차 피드백</h2>
                <FeedbackRemainingBadge remaining={remaining} />
              </div>
              <p className="bg-green-200 px-3 py-6 text-body-lg whitespace-pre-line text-neutral-700">{PURCHASING_FEEDBACK}</p>
            </div>
          )}
        </WorkPanel>

        <WorkPanel className="flex flex-col gap-[clamp(20px,4svh,40px)]">
          <div className="flex items-end justify-between gap-6">
            <div className="flex min-w-0 flex-col gap-2">
              <h2 className="text-title-lg font-semibold text-neutral-700">{instruction}</h2>
              {phase === 'select' && (
                <button type="button" onClick={() => setPhase('research')} className="w-fit text-body-md text-neutral-500 underline hover:text-neutral-700">
                  목록 다시 수정하기
                </button>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ModelAnswerChip />
              <SendRoundButton label={send.label} disabled={send.disabled} onClick={send.onClick} />
            </div>
          </div>
          <VendorTable
            editable={phase === 'research'}
            vendors={vendors}
            onChange={updateVendor}
            selectable={phase === 'select'}
            selectedIndex={selectedVendorIndex}
            onSelect={selectVendor}
          />
        </WorkPanel>
      </div>

      <aside className="flex min-h-0 w-[clamp(320px,25vw,433px)] shrink-0 flex-col gap-4">
        <WorkSidePanel messenger={{ defaultActive: 'purchasing', intro: { persona: 'senior', text: SENIOR_VENDOR_INTRO } }} />
      </aside>
    </WorkFrame>
  )
}
