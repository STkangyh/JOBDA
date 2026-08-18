import { useState } from 'react'
import { Sidebar, type SidebarItem } from '../components/Sidebar'
import { Indicator } from '../components/Indicator'
import { Card } from '../components/Card'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { WarningIcon, CloudSavedIcon, ProfileIcon } from '../components/icons'
import { useSession } from '../store/session'
import type { VendorOption } from '../types'

const SIDEBAR_TOP_ITEMS: readonly SidebarItem[] = ['apps', 'work', 'history']

const NOTE_TAGS = {
  userNeeds: ['저소음', '공간 효율', '따뜻함', '관리 용이', '인테리어 오브제 느낌'],
  constraints: ['파팅라인 단차 0.5mm 이격할 것', '전면부 하우징은 하나로', '에어케어 제품과 내부 설계 공유'],
  cmf: ['화이트 오크 재질의 흡기구', '목재 접합', '한도 견본 판정표'],
}

// 3차 피드백(구매팀) — Figma 823:57101/823:57176에 두 버전이 있었음: "우진 목형이 가장
// 적합했습니다"(특정 업체명 확정) / "적절한 업체를 다시 한 번 확인해보세요"(범용 재확인 유도).
// 우리 store의 vendors는 사용자가 자유 입력한 3개사라 실제로 "우진 목형"일 근거가 없으므로,
// 특정 업체를 단정하는 버전 대신 범용 재확인 버전을 채택함(어떤 입력값에도 성립하는 문구).
const PURCHASING_FEEDBACK =
  '납기일, 가능 수량, 단가 고려해서 적절한 업체를 다시 한 번 확인해보세요. 납기일 맞추는 게 가장 어려워요. 혹시 모를 지연 요소가 있을 수도 있으니 일정을 여유롭게 잡으세요.'

const ROWS: { key: keyof Omit<VendorOption, 'name'>; label: string; placeholder: string; unit: string }[] = [
  { key: 'leadTimeDays', label: '납기일', placeholder: '0', unit: '일' },
  { key: 'quantity', label: '가능 수량', placeholder: '0', unit: 'ea' },
  { key: 'unitPrice', label: '단가', placeholder: '0', unit: '원' },
]

function NoteGroup({ title, tags }: { title: string; tags: string[] }) {
  return (
    <div>
      <Text variant="body-md" className="mb-2 text-neutral-600">
        {title}
      </Text>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border-2 border-neutral-200 bg-neutral-100 px-3 py-1.5 text-sm text-neutral-600">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

// Figma 823:56423/823:57155 "업무 노트" 카드 실측 — 사용자 요구/제조 제약/CMF 결정 사항 3그룹
// (session1 Workspace.tsx의 WorkNotes는 앞 2그룹만 있고 CMF 그룹은 없음 — 이 화면 전용으로 3번째
// 그룹 추가). 스토어에 안 묶인 정적 참고 카드라 로컬 컴포넌트로 분리.
function WorkNotes() {
  return (
    <Card className="flex flex-col gap-6 p-6">
      <Text variant="title-lg" emphasis>
        업무 노트
      </Text>
      <NoteGroup title="사용자 요구" tags={NOTE_TAGS.userNeeds} />
      <NoteGroup title="제조 제약" tags={NOTE_TAGS.constraints} />
      <NoteGroup title="CMF 결정 사항" tags={NOTE_TAGS.cmf} />
    </Card>
  )
}

function VendorTable({ editable, vendors, onChange }: { editable: boolean; vendors: VendorOption[]; onChange: (i: number, fields: Partial<VendorOption>) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[110px_repeat(3,1fr)] items-center gap-3 px-2 py-1.5">
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
            <div className="grid grid-cols-[110px_repeat(3,1fr)] items-center gap-3 px-2 py-2">
              <Text variant="body-lg" className="text-neutral-500">
                {row.label}
              </Text>
              {vendors.map((v, i) =>
                editable ? (
                  <div key={i} className="flex min-w-0 items-center gap-1.5 rounded-md bg-neutral-75 px-3 py-2">
                    <input
                      type="number"
                      value={v[row.key]}
                      onChange={(e) => onChange(i, { [row.key]: e.target.value ? Number(e.target.value) : '' } as Partial<VendorOption>)}
                      placeholder={row.placeholder}
                      className="min-w-0 flex-1 bg-transparent text-body-lg text-neutral-700 outline-none"
                    />
                    <Text variant="body-md" className="shrink-0 text-neutral-400">
                      {row.unit}
                    </Text>
                  </div>
                ) : (
                  <Text key={i} variant="body-lg" className="text-neutral-700">
                    {v[row.key] === '' ? '-' : `${v[row.key]}${row.unit}`}
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

// Figma 823:56423(Desktop-138 "외주 업체 탐색")·823:57155(Desktop-141 "외주 업체 선정" + 3차
// 피드백) — 한 스토어 스테이지(vendor_compare)에 대응하는 화면이 Figma에선 탐색→선정 두 프레임으로
// 나뉘어 있음. Stage enum을 늘리지 않고(다른 에이전트들이 types.ts를 동시에 건드릴 수 있어서
// 금지됨) 로컬 phase 상태로 "입력(edit)" → "확인(confirm, 3차 피드백 노출)" 두 단계를 이 파일
// 안에서 구현. submitVendors()는 confirm 단계의 최종 제출 버튼에서만 호출됨 — 그 전까지는 store
// currentStage가 그대로 vendor_compare라 언제든 새로고침해도 안전.
export function VendorCompare() {
  const vendors = useSession((s) => s.vendors)
  const updateVendor = useSession((s) => s.updateVendor)
  const submitVendors = useSession((s) => s.submitVendors)

  const [phase, setPhase] = useState<'edit' | 'confirm'>('edit')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const complete = vendors.every((v) => v.name && v.leadTimeDays && v.quantity && v.unitPrice)

  const handleSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      submitVendors()
      setIsSubmitting(false)
    }, 1200)
  }

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-50 p-6">
      <Sidebar active="work" topItems={SIDEBAR_TOP_ITEMS} className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-[1fr_340px]">
          <Indicator current="피드백 수정" />
          <div className="hidden items-center justify-end gap-[18px] lg:flex">
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <CloudSavedIcon className="size-5" />
            </div>
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <ProfileIcon className="size-5" />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {phase === 'edit' ? (
              <>
                <Card className="flex flex-col gap-3 p-6">
                  <Text variant="title-lg" emphasis className="text-green-900">
                    외주 업체 탐색
                  </Text>
                  <Text variant="body-lg" className="text-neutral-700">
                    필요한 업체를 찾고 아래 항목에 맞게 리스트에 정리하세요.
                  </Text>
                  <Text variant="body-sm" className="text-neutral-400">
                    예시 업체: 우진 목형 · 세림정밀목재 · 한재석 공방 (아직 확정된 이름은 아니에요)
                  </Text>
                </Card>

                <Card className="flex flex-col gap-6 p-6">
                  <Text variant="title-lg" emphasis className="text-green-900">
                    외주 업체 리스트
                  </Text>
                  <VendorTable editable vendors={vendors} onChange={updateVendor} />
                </Card>

                <Button
                  variant="primary"
                  className="h-[72px] w-[340px] self-end !rounded-xl !text-2xl"
                  disabled={!complete}
                  onClick={() => setPhase('confirm')}
                >
                  비교 결과 확인하기
                </Button>
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
                      onClick={() => setPhase('edit')}
                      className="text-body-sm text-neutral-500 underline hover:text-neutral-700"
                    >
                      목록 다시 수정하기
                    </button>
                  </div>
                  <Text variant="body-lg" className="text-neutral-700">
                    가장 적합한 조건의 업체가 무엇인지 고민하고 구매팀에게 제안하세요.
                  </Text>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-end justify-between">
                      <Text variant="title-md" emphasis className="text-green-900">
                        3차 피드백
                      </Text>
                      <div className="flex items-end gap-1">
                        <WarningIcon className="size-5 shrink-0 text-error-200" />
                        <Text variant="body-sm" className="text-neutral-400">
                          가능 피드백 세션 1회 남음
                        </Text>
                      </div>
                    </div>
                    <div className="rounded-md bg-green-200 px-4 py-4">
                      <Text variant="body-md" className="text-neutral-700">
                        {PURCHASING_FEEDBACK}
                      </Text>
                    </div>
                  </div>
                </Card>

                <Card className="flex flex-col gap-6 p-6">
                  <Text variant="title-lg" emphasis className="text-green-900">
                    외주 업체 리스트
                  </Text>
                  <VendorTable editable={false} vendors={vendors} onChange={updateVendor} />
                </Card>

                <Button
                  variant="primary"
                  className="h-[72px] w-[340px] self-end !rounded-xl !text-2xl"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? '로딩중' : '업체 비교 자료 제출'}
                </Button>
              </>
            )}
          </div>

          <WorkNotes />
        </div>
      </div>
    </div>
  )
}
