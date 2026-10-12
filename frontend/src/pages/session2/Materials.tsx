import { useState } from 'react'
import { DownloadIcon } from '../../components/icons'
import { WorkFrame, WorkPanel } from '../../components/WorkFrame'
import { useSession } from '../../store/session'
import specFormReference from '../../assets/illustrations/spec-form-reference.png'
import limitSampleReference from '../../assets/illustrations/limit-sample-reference.png'
import { track, useTrackView } from '../../lib/analytics'

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

// Figma 업무 페이지 "자료탐색"(2217:10065, 2026-10-13) — 자료함(Library) 화면. 자료 목록 + 미리보기 두 칸.
// 업무로 넘어가는 버튼이 없어 GNB의 Work를 누르면 업무(시방서 초안)를 시작한다(2026-10-13 결정).
// TODO(2026-10-13): Work를 누르라고 안내하는 컴포넌트가 디자인에 아직 없다 — 나오면 추가.
export function Materials() {
  const goTo = useSession((s) => s.goTo)
  const [selectedDoc, setSelectedDoc] = useState<SpecDoc>('spec_form')
  const viewer = VIEWER_CONTENT[selectedDoc]
  useTrackView({ kind: 'panel', name: `materials_doc:${selectedDoc}` })
  // 다운로드 대상은 실제 문서가 아니라 참고 이미지(PNG)라서, 목록에 보이는 표시용 파일명
  // 그대로("...docs")를 download 속성에 쓰면 확장자가 실제 내용물과 달라 열리지 않는다.
  const viewerFileName = `${SPEC_DOCS.find((d) => d.key === selectedDoc)?.tagLabel ?? viewer.title}.png`

  const startWork = () => {
    track('step_complete', { step: 'materials', via: 'gnb_work' })
    goTo('workspace')
  }

  const itemClass = 'flex h-14 w-full items-center rounded-2xl border-2 px-8 text-title-md font-semibold whitespace-nowrap'

  return (
    <WorkFrame step="자료탐색" sidebar="library" onSidebarSelect={{ work: startWork }} exitStep="materials">
      <WorkPanel className="flex max-w-[554px] min-w-[360px] flex-1 flex-col gap-6">
        <h1 className="text-title-lg font-semibold text-neutral-500">자료함</h1>
        <ul className="flex flex-col gap-2.5">
          {DOC_CATEGORIES.map((cat) => (
            <li key={cat} className={`${itemClass} border-neutral-50 bg-green-50 text-neutral-700`}>
              {cat}
            </li>
          ))}
          {SPEC_DOCS.map(({ key, tagLabel }) => (
            <li key={key}>
              <button
                type="button"
                aria-pressed={selectedDoc === key}
                onClick={() => setSelectedDoc(key)}
                className={`${itemClass} transition-colors focus-visible:outline-2 focus-visible:outline-green-700 ${
                  selectedDoc === key ? 'border-green-200 bg-green-300 text-green-900' : 'border-neutral-50 bg-green-50 text-neutral-700 hover:bg-green-100'
                }`}
              >
                {tagLabel}
              </button>
            </li>
          ))}
        </ul>
      </WorkPanel>

      <WorkPanel className="flex min-w-0 flex-[1.75] flex-col gap-6">
        <div className="flex items-center gap-2">
          <h2 className="text-title-lg font-semibold text-neutral-500">미리보기</h2>
          {/* 미리보기 중인 참고 자료 내려받기 — 기존 기능 유지(Figma 1341:10735 QA) */}
          <a
            href={viewer.image}
            download={viewerFileName}
            onClick={() => track('download', { doc: selectedDoc })}
            aria-label={`${viewerFileName} 다운로드`}
            className="flex size-6 items-center justify-center text-neutral-400 transition-colors hover:text-neutral-500 active:text-neutral-700"
          >
            <DownloadIcon className="size-[18px]" />
          </a>
        </div>
        <div className="flex min-h-[400px] flex-1 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100">
          <img src={viewer.image} alt={viewer.imageAlt} loading="lazy" className="max-h-full w-full object-contain" />
        </div>
        <p className="text-title-lg text-neutral-600">{viewer.description}</p>
      </WorkPanel>
    </WorkFrame>
  )
}
