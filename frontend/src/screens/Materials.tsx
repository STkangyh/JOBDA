import { useState } from 'react'
import { Sidebar, type SidebarItem } from '../components/Sidebar'
import { Indicator } from '../components/Indicator'
import { Card } from '../components/Card'
import { Text } from '../components/Text'
import { Button } from '../components/Button'
import { CloudSavedIcon, ProfileIcon } from '../components/icons'
import { useSession } from '../store/session'
import specFormReference from '../assets/illustrations/spec-form-reference.png'
import limitSampleReference from '../assets/illustrations/limit-sample-reference.png'

// Figma 823:57686/1059:8248(Desktop-116)·856:20439/1059:8245(Desktop-146)로 재확인: "자료함"
// 태그는 정적 나열이 아니라 6개 참고 카테고리 + 실제로 전환되는 2개(시방서 양식/한도 견본
// 판정표) — "시방서 양식 폴더"의 두 파일과 같은 선택 상태를 공유해서, 어느 쪽을 고르든
// "열람 자료" 패널의 제목·설명·실제 참고 이미지가 통째로 바뀐다. 예전엔 이 전환이 아예 없고
// "열람 자료"에 시방서 개념 설명 문구 하나만 고정으로 떠 있었음(실제 참고 자료 이미지도 없었음).
type SpecDoc = 'spec_form' | 'limit_sample'

const DOC_CATEGORIES = ['사용자 조사 자료', '제품 리뷰 분석', '경쟁 제품 비교표', '브랜드 디자인 원칙', '제품 디자인, 설계 자료']

const SPEC_DOCS: { key: SpecDoc; fileName: string; tagLabel: string }[] = [
  { key: 'spec_form', fileName: '시방서 양식.docs', tagLabel: '시방서 양식' },
  { key: 'limit_sample', fileName: '한도 견본 판정표.docs', tagLabel: '한도 견본 판정표' },
]

// Figma 실측 문구 그대로 — 두 문서의 설명이 실제로 다름(시방서=부품별 소재/컬러/마감 지정
// 문서, 한도 견본 판정표=목재처럼 결과물이 일정하지 않은 소재의 양산 허용 오차 기준 문서).
const VIEWER_CONTENT: Record<SpecDoc, { title: string; description: string; image: string; imageAlt: string }> = {
  spec_form: {
    title: '시방서 양식 파일',
    description:
      '시방서는 확정된 디자인을 부품 단위로 나누어 어떤 부품을 무슨 재료로, 어떤 색으로, 어떤 마감으로 만드는지를 문자와 수치로 적은 문서입니다. 주요 구성에는 컬러, 소재, 마감 방식, 제품 코드명, 담당자 등이 있으며 경우에 따라 결합 방식을 추가하기도 한다.',
    image: specFormReference,
    imageAlt: '디자인 시방서 예시',
  },
  limit_sample: {
    title: '한도 견본 판정표 파일',
    description:
      '계측만으로는 규정하기 어려운 부품 외관 품질에 대해 실물 견본으로 충족 하한선을 설정해둔 기준으로 발주사와 협력사가 동일한 기준으로 양산 품질을 관리하기 위한 문서이다. 주요 구성에는 허용 한도, 관찰 조건, 판정 구분, 승인 권한 등이 있다.',
    image: limitSampleReference,
    imageAlt: '한도 견본 판정표 예시',
  },
}

// Figma "Desktop - 116"(823:57686) — get_design_context로 재확인: 윗줄 apps/work/history
// 3개(default topItems를 안 넘겨서 브리프 기준 apps/search/history가 잘못 나가고 있었음),
// data가 Pressed. 세션1 자료함(744:17197)과 같은 레이아웃이지만 열람 자료 패널이 다중 파일
// 브라우저가 아니라 "시방서가 무엇인가"를 설명하는 참고 자료 하나임.
const SIDEBAR_TOP_ITEMS: readonly SidebarItem[] = ['apps', 'work', 'history']

export function Materials() {
  const goTo = useSession((s) => s.goTo)
  const [selectedDoc, setSelectedDoc] = useState<SpecDoc>('spec_form')
  const viewer = VIEWER_CONTENT[selectedDoc]

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-50 p-6">
      <Sidebar active="data" topItems={SIDEBAR_TOP_ITEMS} className="shrink-0" />

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
                    className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-body-md text-green-900"
                  >
                    {cat}
                  </span>
                ))}
                {SPEC_DOCS.map(({ key, tagLabel }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDoc(key)}
                    className={`rounded-full border border-green-200 px-3 py-1.5 text-body-md text-green-900 transition-colors ${
                      selectedDoc === key ? 'bg-green-300' : 'bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    {tagLabel}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <Card className="flex flex-col gap-6 p-6">
            <Text variant="title-lg" emphasis>
              시방서 양식 폴더
            </Text>
            <div className="flex flex-col items-start gap-2.5">
              {SPEC_DOCS.map(({ key, fileName }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDoc(key)}
                  className={`text-body-md underline transition-colors ${
                    selectedDoc === key ? 'text-green-800' : 'text-neutral-600 hover:text-neutral-800'
                  }`}
                >
                  {fileName}
                </button>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-6">
            <Text variant="title-lg" emphasis>
              열람 자료
            </Text>
            <div className="flex flex-col gap-3">
              <Text variant="title-lg" emphasis>
                {viewer.title}
              </Text>
              <Text variant="body-lg" className="text-neutral-600">
                {viewer.description}
              </Text>
            </div>
            <div className="overflow-hidden rounded-md bg-neutral-100">
              <img src={viewer.image} alt={viewer.imageAlt} className="w-full object-contain" />
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
