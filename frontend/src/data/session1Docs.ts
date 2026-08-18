// 세션1 "자료함" 정적 콘텐츠 — Figma Desktop-44(744:17197). "01 공기청정기 시안 A"만
// 원본에 실제 본문이 있었고, 나머지 5개는 파일명 기준으로 한 줄 요약을 새로 씀.
export interface S1DocItem {
  key: string
  title: string
  body: string
}

export const S1_DOCS: S1DocItem[] = [
  {
    key: 'concept_a',
    title: '01 공기청정기 시안 A.pdf',
    body: '이번에 개발중인 탁상용 공기청정기, 코드네임 "마루"의 시안 A입니다. 2주 뒤에 있을 프로토타입 품평회를 대비하여 설계 부서와 사전 설계 검토 요청드립니다. 분해도, 렌더링 이미지, 프로토타입 이미지 바탕으로 설계팀과 양산 가능 여부를 확인하고 구조를 수정해주시기 바랍니다.',
  },
  {
    key: 'concept_b',
    title: '02 공기청정기 시안 B.pdf',
    body: '시안 A와 비교 검토용으로 준비된 대안 디자인입니다.',
  },
  {
    key: 'concept_c',
    title: '03 공기청정기 시안 C.pdf',
    body: '이번 세션에서 실제로 검토·수정하는 최종 후보 시안입니다.',
  },
  {
    key: 'design_file',
    title: '05 에어케어 탁상용 공기청정기 설계 파일.dwg',
    body: '하우징 파트 분할과 치수가 반영된 CAD 설계 원본 파일입니다.',
  },
  {
    key: 'mockup_guide',
    title: '06 목형 제작 가이드.pdf',
    body: '목업 제작 시 참고할 소재·가공 방식 가이드입니다.',
  },
  {
    key: 'design_guide',
    title: '07 디자인 구체화 가이드.pdf',
    body: '컨셉 스케치를 양산 가능한 형태로 구체화할 때 참고하는 사내 가이드입니다.',
  },
]

export const S1_DOC_CATEGORIES = [
  '사용자 조사 자료',
  '제품 리뷰 분석',
  '경쟁 제품 비교표',
  '브랜드 디자인 원칙',
  '제품 디자인, 설계 자료',
  '시방서 양식',
]
