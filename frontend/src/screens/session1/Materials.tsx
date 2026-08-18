import { useState } from 'react'
import conceptAImage from '../../assets/illustrations/session1-concept-a.png'
import { Sidebar, type SidebarItem } from '../../components/Sidebar'
import { Indicator } from '../../components/Indicator'
import { Card } from '../../components/Card'
import { Text } from '../../components/Text'
import { Button } from '../../components/Button'
import { CloudSavedIcon, ProfileIcon } from '../../components/icons'
import { useSession1 } from '../../store/session1'
import { S1_DOCS, S1_DOC_CATEGORIES } from '../../data/session1Docs'

const INDICATOR_STEPS_S1 = ['브리프', '자료탐색', '설계 수정1', '설계 수정2', '설계 확정', '자기 평가', '직무 리포트'] as const
const HIGHLIGHTED_CATEGORY = '제품 디자인, 설계 자료'
// Figma 744:17197 사이드바 실측: apps/work/history(검색 아이콘 없음), work가 active.
const SIDEBAR_TOP_ITEMS: readonly SidebarItem[] = ['apps', 'work', 'history']

// Figma "Desktop - 44"(744:17197) — 세션1 자료함. Indicator에 "자료탐색" 라벨은 있었지만
// 실제 화면이 없어서 브리프에서 곧장 협상 라운드로 건너뛰고 있었음. 새로 추가.
export function Session1Materials() {
  const goTo = useSession1((s) => s.goTo)
  const [selectedKey, setSelectedKey] = useState(S1_DOCS[0].key)
  const doc = S1_DOCS.find((d) => d.key === selectedKey) ?? S1_DOCS[0]

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-50 p-6">
      <Sidebar active="work" topItems={SIDEBAR_TOP_ITEMS} className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* Figma(744:15857 등)와 동일하게 인디케이터는 가운데 컬럼 폭에만, 저장상태/프로필
            아이콘은 우측 상단에 — 브리프에서 정리한 것과 같은 3열 헤더 행. */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-[340px_340px_1fr]">
          <div className="hidden lg:block" />
          {/* 자료함 화면은 중앙(2번째) 컬럼이 340px로 좁아서 인디케이터를 거기만 넣으면
              7단계 라벨이 다 안 들어감 — 2,3번째 컬럼을 합친 폭에 걸치도록 함. */}
          <div className="hidden items-center gap-6 lg:col-span-2 lg:flex">
            <Indicator current="자료탐색" steps={INDICATOR_STEPS_S1} className="flex-1" />
            <div className="flex items-center gap-[18px]">
              <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
                <CloudSavedIcon className="size-5" />
              </div>
              <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
                <ProfileIcon className="size-5" />
              </div>
            </div>
          </div>
          <Indicator current="자료탐색" steps={INDICATOR_STEPS_S1} className="lg:hidden" />

          <div className="flex flex-col gap-6">
            <Card className="flex items-center justify-center p-6">
              <Text variant="title-lg" emphasis className="text-center">
                모형 제작 및 설계 검토
              </Text>
            </Card>
            <Card className="flex flex-col gap-4 p-6">
              <Text variant="title-lg" emphasis>
                자료함
              </Text>
              <div className="flex flex-col items-start gap-2">
                {S1_DOC_CATEGORIES.map((cat) => (
                  <span
                    key={cat}
                    className={`rounded-full border border-green-200 px-3 py-1.5 text-body-md text-green-900 ${
                      cat === HIGHLIGHTED_CATEGORY ? 'bg-green-200' : 'bg-green-50'
                    }`}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          <Card className="flex flex-col gap-4 p-6">
            <Text variant="title-lg" emphasis>
              디자인 시안 폴더
            </Text>
            <div className="flex flex-col items-start gap-3">
              {S1_DOCS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelectedKey(d.key)}
                  className={`text-left text-body-md underline transition-colors ${
                    selectedKey === d.key ? 'font-semibold text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {d.title}
                </button>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-6">
            <Text variant="title-lg" emphasis>
              열람 자료
            </Text>
            <div className="flex flex-col gap-2">
              <Text variant="title-lg" emphasis>
                {doc.title.replace(/\.[a-z]+$/i, '')}
              </Text>
              <Text variant="body-md" className="whitespace-pre-line text-neutral-600">
                {doc.body}
              </Text>
            </div>
            {doc.key === 'concept_a' && (
              <img src={conceptAImage} alt="" className="w-full rounded-md bg-neutral-100 object-cover" />
            )}
          </Card>
        </div>

        <Button
          variant="primary"
          className="h-[72px] w-[340px] self-end !rounded-xl !text-2xl"
          onClick={() => goTo('round')}
        >
          업무 시작하기
        </Button>
      </div>
    </div>
  )
}
