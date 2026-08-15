// 자료함 정적 콘텐츠 — BACKEND_SPEC_v2.md 부록 B: "프론트 정적 콘텐츠. 백엔드 무관"
export interface DocItem {
  key: string
  category: string
  title: string
  body: string
}

export const DOCS: DocItem[] = [
  {
    key: 'project_brief',
    category: '브랜드 및 프로젝트',
    title: '프로젝트 배경',
    body: '공기청정기에 처음으로 오크 원목을 하우징 소재로 쓰기로 확정됐습니다. 설계팀에 넘길 디자인 시방서를 작성해야 하며, 발주까지 12일 남았습니다.',
  },
  {
    key: 'brand_material',
    category: '브랜드 및 프로젝트',
    title: '브랜드 소재 가이드',
    body: '목재는 이번 시즌 브랜드 리프레시의 핵심 소재입니다. 따뜻하고 인테리어 친화적인 인상을 목표로 합니다.',
  },
  {
    key: 'factory_overview',
    category: '관계부서 자료',
    title: '자사 공장 설비 개요',
    body: '시트지 래핑 라인은 보유하고 있으나, 목재 전용 밴딩·오일 마감 설비는 없습니다. 자세한 가능 여부는 설계팀에 직접 문의하세요.',
  },
  {
    key: 'schedule',
    category: '관계부서 자료',
    title: '발주 일정',
    body: '오늘부터 발주까지 12일. 외주 업체 컨택이 필요할 경우 업체 응답·견적 기간을 감안해 일정을 서둘러야 합니다.',
  },
]
