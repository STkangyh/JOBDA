import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import { useSession } from './store/session'
import { Explore } from './pages/explore/Explore'
import { StageJumper } from './components/StageJumper'
import { AsteriskIcon } from './components/icons'
import type { Stage } from './types'

// Explore("/")만 첫 진입에 항상 필요해서 static import로 남기고, 나머지는 전부 route 단위
// lazy — 세션1/세션2/디자인시스템/체험맵/종합리포트는 한 방문에서 서로 배타적으로만 쓰이는데
// App.tsx가 전부 static import해서 하나의 번들에 같이 묶여 있었음(빌드 결과물 단일 청크
// ~350KB 확인). 실제로 안 가는 화면의 코드까지 항상 다운로드하고 있던 셈이라 route별로 쪼갬.
const Brief = lazy(() => import('./pages/session2/Brief').then((m) => ({ default: m.Brief })))
const Materials = lazy(() => import('./pages/session2/Materials').then((m) => ({ default: m.Materials })))
const Workspace = lazy(() => import('./pages/session2/Workspace').then((m) => ({ default: m.Workspace })))
const SeniorFeedback = lazy(() => import('./pages/session2/SeniorFeedback').then((m) => ({ default: m.SeniorFeedback })))
const FinalFeedback = lazy(() => import('./pages/session2/FinalFeedback').then((m) => ({ default: m.FinalFeedback })))
const BranchSelect = lazy(() => import('./pages/session2/BranchSelect').then((m) => ({ default: m.BranchSelect })))
const VendorCompare = lazy(() => import('./pages/session2/VendorCompare').then((m) => ({ default: m.VendorCompare })))
const SelfAssessment = lazy(() => import('./pages/session2/SelfAssessment').then((m) => ({ default: m.SelfAssessment })))
const Report = lazy(() => import('./pages/session2/Report').then((m) => ({ default: m.Report })))
const DesignSystem = lazy(() => import('./pages/DesignSystem').then((m) => ({ default: m.DesignSystem })))
const JobDetail = lazy(() => import('./pages/explore/JobDetail').then((m) => ({ default: m.JobDetail })))
const ErrorPage = lazy(() => import('./pages/explore/ErrorPage').then((m) => ({ default: m.ErrorPage })))
const Session1App = lazy(() => import('./pages/session1/Session1App').then((m) => ({ default: m.Session1App })))
const JourneyMap = lazy(() => import('./pages/JourneyMap').then((m) => ({ default: m.JourneyMap })))
const ComprehensiveReport = lazy(() => import('./pages/ComprehensiveReport').then((m) => ({ default: m.ComprehensiveReport })))

// Suspense가 청크 다운로드 중에 보여주는 전체 화면 자리표시자. 어느 라우트든 잠깐 걸치는
// 화면이라 특정 페이지 배경색에 맞추지 않고 앱 셸의 기본 다크 배경(Explore와 동일)만 깐다.
function RouteFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-neutral-950">
      <AsteriskIcon className="size-8 animate-spin text-neutral-500" />
    </div>
  )
}

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
// 직무 상세페이지 "업무 프로세스" 스텝 인덱스 -> 진입할 경로. 8번(시방서 작성 및 설계 이관)만
// 세션2로 연결 — 6번(모형 제작 및 설계 검토/세션1)은 배포에서 제외돼 JobDetail.tsx에서 아예
// 선택 불가능이라 여기 매핑도 필요 없음.
const STEP_INDEX_TO_PATH: Record<number, string> = { 7: '/session2' }

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
  return (
    <Suspense fallback={<RouteFallback />}>
      <AppRoutes />
    </Suspense>
  )
}

function AppRoutes() {
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
