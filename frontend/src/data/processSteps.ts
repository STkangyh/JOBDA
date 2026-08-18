// Figma "업무 프로세스" 11단계 — JobDetail의 세션 선택 목록과 리포트의 "내 업무 진행 과정"
// 플로우가 공유하는 단일 소스. 실제로 만들어진 세션은 2개뿐이라 인덱스도 같이 export.
export const PROCESS_STEPS = [
  '프로젝트 기획 및 제안',
  '사용자 리서치 및 분석',
  '전략 수립 및 컨셉 설정',
  '아이디어 발상 및 구체화',
  '아이디어 시각화',
  '모형 제작 및 설계 검토',
  '품평회 및 디자인 확정',
  '시방서 작성 및 설계 이관',
  '설계 과정 감리',
  '양산 과정 감리',
  '프로젝트 사후 관리',
] as const

export const SESSION1_STEP_INDEX = 5
export const SESSION2_STEP_INDEX = 7
