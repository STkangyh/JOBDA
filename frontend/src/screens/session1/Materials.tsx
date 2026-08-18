import { useState } from 'react'
import conceptAImage from '../../assets/illustrations/session1-concept-a.png'
import { Sidebar } from '../../components/Sidebar'
import { Indicator } from '../../components/Indicator'
import { Card } from '../../components/Card'
import { Text } from '../../components/Text'
import { Button } from '../../components/Button'
import { useSession1 } from '../../store/session1'
import { S1_DOCS, S1_DOC_CATEGORIES } from '../../data/session1Docs'

const INDICATOR_STEPS_S1 = ['브리프', '자료탐색', '설계 수정1', '설계 수정2', '설계 확정', '자기 평가', '직무 리포트'] as const
const HIGHLIGHTED_CATEGORY = '제품 디자인, 설계 자료'

// Figma "Desktop - 44"(744:17197) — 세션1 자료함. Indicator에 "자료탐색" 라벨은 있었지만
// 실제 화면이 없어서 브리프에서 곧장 협상 라운드로 건너뛰고 있었음. 새로 추가.
export function Session1Materials() {
  const goTo = useSession1((s) => s.goTo)
  const [selectedKey, setSelectedKey] = useState(S1_DOCS[0].key)
  const doc = S1_DOCS.find((d) => d.key === selectedKey) ?? S1_DOCS[0]

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-50 p-6">
      <Sidebar active="message" className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <Indicator current="자료탐색" steps={INDICATOR_STEPS_S1} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_340px_1fr]">
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
