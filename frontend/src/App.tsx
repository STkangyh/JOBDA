import { useEffect, useState, type ComponentType } from 'react'
import { useSession } from './store/session'
import { Brief } from './screens/Brief'
import { Materials } from './screens/Materials'
import { Workspace } from './screens/Workspace'
import { SeniorFeedback } from './screens/SeniorFeedback'
import { FinalFeedback } from './screens/FinalFeedback'
import { BranchSelect } from './screens/BranchSelect'
import { VendorCompare } from './screens/VendorCompare'
import { SelfAssessment } from './screens/SelfAssessment'
import { Report } from './screens/Report'
import { DesignSystem } from './screens/DesignSystem'
import { Explore } from './screens/explore/Explore'
import { JobDetail } from './screens/explore/JobDetail'
import { ErrorPage } from './screens/explore/ErrorPage'
import { Session1App } from './screens/session1/Session1App'
import { JourneyMap } from './screens/JourneyMap'
import { ComprehensiveReport } from './screens/ComprehensiveReport'
import { StageJumper } from './components/StageJumper'
import type { Stage } from './types'

// 모든 세션2 화면이 세션1처럼 자체 풀블리드 레이아웃(Sidebar+Indicator 포함)을 갖도록
// 재구성하면서 구형 Layout(라이트 테마 헤더 래퍼)과 별도 'home' 인트로 화면은 제거함
// (세션1처럼 "/session2" 진입 시 곧장 브리프부터 시작).
const SCREENS: Record<Exclude<Stage, 'report'>, ComponentType> = {
  brief: Brief,
  materials: Materials,
  workspace: Workspace,
  senior_feedback: SeniorFeedback,
  final_feedback: FinalFeedback,
  branch_select: BranchSelect,
  vendor_compare: VendorCompare,
  self_assessment: SelfAssessment,
}

// 임시 개발용 StageJumper가 쓰는 세션2 단계 목록/라벨.
const SESSION2_STAGES: { value: Stage; label: string }[] = [
  { value: 'brief', label: '브리프' },
  { value: 'materials', label: '자료탐색' },
  { value: 'workspace', label: '관계자 협업' },
  { value: 'senior_feedback', label: '1차 피드백' },
  { value: 'final_feedback', label: '최종 피드백' },
  { value: 'branch_select', label: '방향 선택' },
  { value: 'vendor_compare', label: '업체 비교' },
  { value: 'self_assessment', label: '자기 평가' },
  { value: 'report', label: '직무 리포트' },
]

const KNOWN_PATHS = new Set([
  '/',
  '/design-system',
  '/explore',
  '/explore/job',
  '/session1',
  '/session2',
  '/journey-map',
  '/comprehensive-report',
])
// 직무 상세페이지 "업무 프로세스" 스텝 인덱스 -> 진입할 경로. 6번(모형 제작 및 설계 검토)은
// 세션1(프로토타입 수정), 8번(시방서 작성 및 설계 이관)은 세션2.
const STEP_INDEX_TO_PATH: Record<number, string> = { 5: '/session1', 7: '/session2' }

// 라우터 없이 pathname으로만 분기하는 최소 구현. 첫 진입 화면(홈)은 탐색 페이지("/", 별칭으로
// "/explore"도 동일하게 렌더)이고, 세션 stage 화면은 "/session2"에서 뜬다. 그 외 경로는 전부
// 오류 페이지로 떨어진다.
function useSimpleRouter() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setPathname(path)
  }

  return { pathname, navigate }
}

function App() {
  const stage = useSession((s) => s.currentStage)
  const goTo = useSession((s) => s.goTo)
  const { pathname, navigate } = useSimpleRouter()

  if (pathname === '/design-system') {
    return <DesignSystem />
  }

  if (pathname === '/' || pathname === '/explore') {
    return <Explore onOpenJob={() => navigate('/explore/job')} />
  }

  if (pathname === '/explore/job') {
    return (
      <JobDetail
        onClose={() => navigate('/')}
        onSubmit={(stepIndex) => navigate(STEP_INDEX_TO_PATH[stepIndex] ?? '/session2')}
      />
    )
  }

  if (pathname === '/session1') {
    return <Session1App />
  }

  if (pathname === '/journey-map') {
    return <JourneyMap />
  }

  if (pathname === '/comprehensive-report') {
    return <ComprehensiveReport />
  }

  if (pathname === '/session2') {
    const Screen: ComponentType = stage === 'report' ? Report : SCREENS[stage]
    return (
      <>
        <Screen />
        <StageJumper stages={SESSION2_STAGES} current={stage} onJump={goTo} />
      </>
    )
  }

  if (!KNOWN_PATHS.has(pathname)) {
    return <ErrorPage onConfirm={() => navigate('/')} />
  }

  return null
}

export default App
