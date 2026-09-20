import { useState } from 'react'
import { Sidebar, type SidebarItem } from '../../components/Sidebar'
import { IndicatorHeader } from '../../components/IndicatorHeader'
import { Card } from '../../components/Card'
import { Text } from '../../components/Text'
import { PrimaryCTAButton } from '../../components/PrimaryCTAButton'
import { Checkbox } from '../../components/Checkbox'
import { Messenger, WorkNotesCard } from '../../components/NegotiationPanels'
import { FeedbackRemainingBadge } from '../../components/FeedbackRemainingBadge'
import { useSession, feedbackSessionsRemaining } from '../../store/session'
import { SESSION2_NOTE_TAGS } from '../../data/session2Scenario'
import type { VendorOption } from '../../types'

const SIDEBAR_TOP_ITEMS: readonly SidebarItem[] = ['apps', 'work', 'history']

const NOTE_TAGS = {
  ...SESSION2_NOTE_TAGS,
  cmf: ['화이트 오크 재질의 흡기구', '목재 접합', '한도 견본 판정표'],
}

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

const VENDOR_GRID_COLS = 'grid-cols-[110px_repeat(4,minmax(110px,1fr))]'

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
      <div className={`grid ${VENDOR_GRID_COLS} items-center gap-3 px-2 py-1.5`}>
        <Text variant="title-md" emphasis className="text-green-900">
          업체 항목
        </Text>
        {vendors.map((v, i) =>
          editable ? (
            <input
              key={i}
              value={v.name}
              onChange={(e) => onChange(i, { name: e.target.value })}
              placeholder={`업체 ${i + 1} 이름`}
              className="min-w-0 rounded-md bg-neutral-75 px-3 py-2 text-body-lg font-semibold text-green-900 outline-none placeholder:font-normal placeholder:text-neutral-400"
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
            <Text key={i} variant="body-lg" emphasis className="truncate text-green-900">
              {v.name || `업체 ${i + 1}`}
            </Text>
          ),
        )}
      </div>

      <div className="flex flex-col">
        {ROWS.map((row) => (
          <div key={row.key} className="flex flex-col">
            <div className={`grid ${VENDOR_GRID_COLS} items-center gap-3 px-2 py-2`}>
              <Text variant="body-lg" className="text-neutral-500">
                {row.label}
              </Text>
              {vendors.map((v, i) =>
                editable ? (
                  <div key={i} className="flex min-w-0 items-center gap-1.5 rounded-md bg-neutral-75 px-3 py-2">
                    <input
                      type={row.unit ? 'number' : 'text'}
                      value={v[row.key]}
                      onChange={(e) =>
                        onChange(i, {
                          [row.key]: row.unit ? (e.target.value ? Number(e.target.value) : '') : e.target.value,
                        } as Partial<VendorOption>)
                      }
                      placeholder={row.unit ? '0' : `예: ${row.label}`}
                      className="min-w-0 flex-1 bg-transparent text-body-lg text-neutral-700 outline-none"
                    />
                    {row.unit && (
                      <Text variant="body-md" className="shrink-0 text-neutral-400">
                        {row.unit}
                      </Text>
                    )}
                  </div>
                ) : (
                  // Figma 823:56735(Desktop-139) 실측: 선택된 업체 열 전체에 옅은 초록 배경 띠가
                  // 깔린다 — 정적 nth-child가 아니라 실제 selectedIndex와 비교해야 선택이
                  // 바뀔 때 띠도 같이 움직인다.
                  <Text
                    key={i}
                    variant="body-lg"
                    className={`rounded-md px-3 py-2 text-neutral-700 ${selectable && i === selectedIndex ? 'bg-green-50' : ''}`}
                  >
                    {v[row.key] === '' ? '-' : `${v[row.key]}${row.unit ?? ''}`}
                  </Text>
                ),
              )}
            </div>
            <div className="h-px w-full bg-neutral-300" />
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

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-75 p-6">
      <Sidebar active="work" topItems={SIDEBAR_TOP_ITEMS} className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* Workspace.tsx와 동일한 이유로 flex-1/min-h-0을 그리드까지 끌고 내려가 사이드바와
            전체 높이를 맞춘다. */}
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <IndicatorHeader
            current={vendorProposed ? '피드백 수정' : '제안서 작성'}
            gridCols="grid-cols-1 lg:grid-cols-[340px_1fr_340px]"
            loading={isSubmitting}
          />

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-[340px_1fr_340px]">
            <Messenger defaultActive="purchasing" intro={{ persona: 'senior', text: SENIOR_VENDOR_INTRO }} />

            {/* min-w-0: 안 주면 그리드 1fr 트랙의 기본 최소폭이 VendorTable의 min-content로
                고정돼, 좁은 화면에서 표가 안에서 스크롤되는 대신 이 칸 자체가 넓어지면서 페이지
                전체가 가로 스크롤되고 오른쪽 업무노트 칸이 화면 밖으로 밀려났다(QA 지적). */}
            <div className="flex min-w-0 flex-col gap-6">
              {phase === 'research' ? (
                <>
                  <Card className="flex flex-col gap-3 p-6">
                    <Text variant="title-lg" emphasis className="text-green-900">
                      외주 업체 탐색
                    </Text>
                    <Text variant="body-lg" className="text-neutral-700">
                      필요한 업체를 찾고 아래 항목에 맞게 리스트에 정리하세요.
                    </Text>
                  </Card>

                  <Card className="flex flex-col gap-6 p-6">
                    <Text variant="title-lg" emphasis className="text-green-900">
                      외주 업체 리스트
                    </Text>
                    <VendorTable
                      editable
                      vendors={vendors}
                      onChange={updateVendor}
                      selectable={false}
                      selectedIndex={selectedVendorIndex}
                      onSelect={selectVendor}
                    />
                  </Card>
                </>
              ) : (
                <>
                  <Card className="flex flex-col gap-6 p-6">
                    <div className="flex items-center justify-between">
                      <Text variant="title-lg" emphasis className="text-green-900">
                        외주 업체 선정
                      </Text>
                      <button
                        type="button"
                        onClick={() => setPhase('research')}
                        className="text-body-sm text-neutral-500 underline hover:text-neutral-700"
                      >
                        목록 다시 수정하기
                      </button>
                    </div>
                    <Text variant="body-lg" className="text-neutral-700">
                      {vendorProposed
                        ? '가장 적합한 조건의 업체가 무엇인지 고민하고 구매팀에게 제안하세요.'
                        : '필요한 업체를 찾고 아래 항목에 맞게 리스트에 정리하세요.'}
                    </Text>

                    {vendorProposed && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-end justify-between">
                          <Text variant="title-md" emphasis className="text-green-900">
                            3차 피드백
                          </Text>
                          <FeedbackRemainingBadge remaining={remaining} />
                        </div>
                        <div className="rounded-md bg-green-200 px-4 py-4">
                          <Text variant="body-md" className="whitespace-pre-line text-neutral-700">
                            {PURCHASING_FEEDBACK}
                          </Text>
                        </div>
                      </div>
                    )}
                  </Card>

                  <Card className="flex flex-col gap-6 p-6">
                    <Text variant="title-lg" emphasis className="text-green-900">
                      외주 업체 리스트
                    </Text>
                    <VendorTable
                      editable={false}
                      vendors={vendors}
                      onChange={updateVendor}
                      selectable
                      selectedIndex={selectedVendorIndex}
                      onSelect={selectVendor}
                    />
                  </Card>
                </>
              )}
            </div>

            {/* Figma(Workspace.tsx 1184:11043 실측과 동일 패턴) — 제출류 버튼은 카드 밑이 아니라
                업무노트 칸 밑에 붙고, 업무노트 카드 자체는 메신저보다 버튼 높이만큼 짧다.
                WorkNotesCard의 flex-1이 남는 세로 공간을 흡수해서 버튼을 칸 맨 아래로 붙이고,
                이 래퍼의 h-full이 메신저와 전체 높이를 맞춘다. */}
            <div className="flex h-full flex-col gap-[18px]">
              <WorkNotesCard
                groups={[
                  { label: '사용자 요구', tags: NOTE_TAGS.userNeeds },
                  { label: '제조 제약', tags: NOTE_TAGS.constraints },
                  { label: 'CMF 결정 사항', tags: NOTE_TAGS.cmf },
                ]}
              />
              {phase === 'research' ? (
                <PrimaryCTAButton disabled={!complete} onClick={() => setPhase('select')}>
                  조사 완료
                </PrimaryCTAButton>
              ) : vendorProposed ? (
                <PrimaryCTAButton disabled={isSubmitting} onClick={handleSubmit}>
                  {isSubmitting ? '로딩 중...' : '수정안 제출'}
                </PrimaryCTAButton>
              ) : (
                <PrimaryCTAButton disabled={isSubmitting} onClick={handlePropose}>
                  {isSubmitting ? '로딩 중...' : '제안서 전달'}
                </PrimaryCTAButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
