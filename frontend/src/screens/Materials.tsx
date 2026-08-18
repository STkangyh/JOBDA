import { Sidebar } from '../components/Sidebar'
import { Indicator } from '../components/Indicator'
import { Card } from '../components/Card'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { CloudSavedIcon, ProfileIcon } from '../components/icons'
import { useSession } from '../store/session'

const DOC_CATEGORIES = ['사용자 조사 자료', '제품 리뷰 분석', '경쟁 제품 비교표', '브랜드 디자인 원칙', '제품 디자인, 설계 자료', '시방서 양식']
const HIGHLIGHTED_CATEGORY = '시방서 양식'

const SPEC_FORM_DOCS = ['시방서 양식.docs', '한도 견본 판정표.docs']

// Figma "Desktop - 116"(823:57686) — 세션2 자료함. 세션1 자료함(744:17197)과 같은 레이아웃이지만
// 열람 자료 패널이 다중 파일 브라우저가 아니라 "시방서가 무엇인가"를 설명하는 참고 자료 하나임.
export function Materials() {
  const goTo = useSession((s) => s.goTo)

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-50 p-6">
      <Sidebar active="data" className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-[340px_340px_1fr]">
          <div className="hidden lg:block" />
          <div className="hidden items-center gap-6 lg:col-span-2 lg:flex">
            <Indicator current="자료탐색" className="flex-1" />
            <div className="flex items-center gap-[18px]">
              <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
                <CloudSavedIcon className="size-5" />
              </div>
              <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
                <ProfileIcon className="size-5" />
              </div>
            </div>
          </div>
          <Indicator current="자료탐색" className="lg:hidden" />

          <div className="flex flex-col gap-6">
            <Card className="flex items-center justify-center p-6">
              <Text variant="title-lg" emphasis className="text-center">
                시방서 작성 및 설계팀 이관
              </Text>
            </Card>
            <Card className="flex flex-col gap-4 p-6">
              <Text variant="title-lg" emphasis>
                자료함
              </Text>
              <div className="flex flex-col items-start gap-2">
                {DOC_CATEGORIES.map((cat) => (
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

          <Card className="flex flex-col gap-6 p-6">
            <Text variant="title-lg" emphasis>
              시방서 양식 폴더
            </Text>
            <div className="flex flex-col items-start gap-2.5">
              {SPEC_FORM_DOCS.map((doc) => (
                <span key={doc} className="text-body-md text-neutral-600 underline">
                  {doc}
                </span>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-6">
            <Text variant="title-lg" emphasis>
              열람 자료
            </Text>
            <div className="flex flex-col gap-2">
              <Text variant="title-lg" emphasis>
                시방서 양식 파일
              </Text>
              <Text variant="body-lg" className="text-neutral-600">
                시방서는 확정된 디자인을 부품 단위로 나누어 어떤 부품을 무슨 재료로, 어떤 색으로,
                어떤 마감으로 만드는지를 문자와 수치로 적은 문서입니다. 주요 구성은 부품명, 재질,
                컬러, 마감 공정, 치수 공차이며, 목재처럼 결과물이 일정하지 않은 소재는 한도 견본
                판정표를 별첨해 허용 오차 범위를 함께 전달해야 합니다.
              </Text>
            </div>
          </Card>
        </div>

        <Button
          variant="primary"
          className="h-[72px] w-[340px] self-end !rounded-xl !text-2xl"
          onClick={() => goTo('workspace')}
        >
          업무 시작하기
        </Button>
      </div>
    </div>
  )
}
