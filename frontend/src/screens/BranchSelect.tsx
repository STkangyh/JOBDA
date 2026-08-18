import { useState } from 'react'
import { Sidebar, type SidebarItem } from '../components/Sidebar'
import { Indicator } from '../components/Indicator'
import { Card } from '../components/Card'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { WarningIcon, CloudSavedIcon, ProfileIcon } from '../components/icons'
import { useSession } from '../store/session'
import type { Branch } from '../types'

const SIDEBAR_TOP_ITEMS: readonly SidebarItem[] = ['apps', 'work', 'history']

interface ChoiceOption {
  branch: Branch
  title: string
  bullets: [string, string]
}

// Figma 823:55958("Frame 13", Desktop-135/136 내부) "수정 방향 선택" 3카드 실측 — 세션1
// ReviewAndChoice의 2카드 선택 패턴과 동일 계열이지만 이번엔 3지선다이고 각 카드가 sublabel 1개
// 대신 불릿 2줄(현재 영향 / 다음 단계)을 가짐. Figma 원본 순서(01 외부 업체 탐색 → 02 시트지
// 래핑 → 03 목재 포기)를 그대로 따름 — 기존 파일의 A/B/C 순서(wood_dropped 먼저)와는 다름.
const OPTIONS: ChoiceOption[] = [
  {
    branch: 'outsourcing',
    title: '외부 업체 탐색',
    bullets: ['목재 접합 유지, 예산 초과 위험', '외주 탐색 단계로 이동'],
  },
  {
    branch: 'sheet_wrap',
    title: '시트지 래핑으로 결정',
    bullets: ['예산 내, 이번주 완료 가능', '외주 탐색 없이 종료'],
  },
  {
    branch: 'wood_dropped',
    title: '목재 포기, 다른 재질로 변경',
    bullets: ['예산 내 진행 가능, 재작성으로 회귀', '시방서 재작성으로 이동'],
  },
]

// Figma 823:55958 — 세션2 "수정 방향 선택" 화면. 이 3지선다 카드 UI 자체를 담은 독립 프레임은
// 못 찾았고(823:xxxxx 범위 스캔 결과), Desktop-135/136(2차 피드백 화면) 안에 내장된 "Frame 13"
// 서브프레임으로만 존재함 — 메신저/피드백 텍스트는 FinalFeedback.tsx(다른 에이전트 담당) 영역이라
// 이 파일은 그 서브프레임(선택 카드 + 선택 근거 입력)만 가져와 독립 화면으로 구성함. 카드
// 인터랙션 상태(선택/비선택 스타일)는 Figma에 없어서 세션1 Workspace.tsx의 ReviewAndChoice 카드
// 패턴(선택 시 bg-green-400, 비선택 시 border+hover)을 그대로 재사용.
export function BranchSelect() {
  const chooseBranch = useSession((s) => s.chooseBranch)
  const revisitCount = useSession((s) => s.revisitCount)

  const [selected, setSelected] = useState<Branch | null>(null)
  const [reasoning, setReasoning] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Figma 캡션 "3번 선택 시 대체 아이디어 서술" — 3번(목재 포기)을 고를 때만 대체안 서술을
  // 요구하는 뉘앙스라 그 경우에만 입력을 필수로 둠. reasoning 자체는 store의 chooseBranch가
  // 받는 인자가 아니라(액션 시그니처 변경 금지) 화면 안에서만 쓰는 로컬 상태.
  const canSubmit = selected !== null && (selected !== 'wood_dropped' || reasoning.trim().length > 0)

  const handleSubmit = () => {
    if (!selected) return
    setIsSubmitting(true)
    setTimeout(() => {
      chooseBranch(selected)
      setIsSubmitting(false)
    }, 1200)
  }

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-50 p-6">
      <Sidebar active="work" topItems={SIDEBAR_TOP_ITEMS} className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-3">
          <div className="hidden lg:block" />
          <Indicator current="피드백 수정" />
          <div className="hidden items-center justify-end gap-[18px] lg:flex">
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <CloudSavedIcon className="size-5" />
            </div>
            <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <ProfileIcon className="size-5" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex items-center justify-center p-6">
            <Text variant="title-lg" emphasis className="text-center">
              시방서 작성 및 설계팀 이관
            </Text>
          </Card>

          {revisitCount > 0 && (
            <Card className="flex items-center gap-2 border border-error-100 bg-error-100/20 p-4">
              <WarningIcon className="size-5 shrink-0 text-error-200" />
              <Text variant="body-md" className="text-error-300">
                이미 한 번 시방서를 다시 작성했습니다. 이번에도 목재를 포기하면 이번 선택으로 바로
                마무리돼요.
              </Text>
            </Card>
          )}

          <Card className="flex flex-col gap-12 p-6">
            <div className="flex flex-col gap-3">
              <Text variant="title-lg" emphasis className="text-green-900">
                수정 방향 선택
              </Text>
              <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-3">
                {OPTIONS.map((o, i) => {
                  const isSelected = selected === o.branch
                  return (
                    <button
                      key={o.branch}
                      onClick={() => setSelected(o.branch)}
                      className={`flex flex-1 flex-col items-start gap-1 rounded-md p-5 text-left transition-colors ${
                        isSelected
                          ? 'bg-green-400 text-neutral-900'
                          : 'border border-neutral-200 bg-white hover:border-green-400 hover:bg-green-50'
                      }`}
                    >
                      <Text variant="body-lg" emphasis className={isSelected ? 'text-green-800' : 'text-neutral-400'}>
                        {String(i + 1).padStart(2, '0')}
                      </Text>
                      <Text variant="title-lg" emphasis className="text-neutral-900">
                        {o.title}
                      </Text>
                      <div className="flex flex-col gap-0.5">
                        {o.bullets.map((b) => (
                          <div key={b} className="flex items-center gap-2">
                            <span className="size-1 shrink-0 rounded-full bg-neutral-400" />
                            <Text variant="body-md" className="text-neutral-600">
                              {b}
                            </Text>
                          </div>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-end gap-2">
                <Text variant="title-lg" emphasis className="text-green-900">
                  선택 근거 입력
                </Text>
                <Text variant="body-sm" className="text-neutral-400">
                  3번 선택 시 대체 아이디어 서술
                </Text>
              </div>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                rows={3}
                placeholder="이 방향을 선택한 이유를 적어주세요."
                className="rounded-md bg-neutral-75 px-4 py-3 text-sm outline-none placeholder:text-neutral-500"
              />
            </div>
          </Card>

          <Button
            variant="primary"
            className="h-[72px] w-[340px] self-end !rounded-xl !text-2xl"
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? '로딩중' : '선택 제출'}
          </Button>
        </div>
      </div>
    </div>
  )
}
