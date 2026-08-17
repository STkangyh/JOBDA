import { useEffect, useState, type ComponentType } from 'react'
import { useSession } from './store/session'
import { Layout } from './components/Layout'
import { Home } from './screens/Home'
import { Brief } from './screens/Brief'
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
import type { Stage } from './types'

const SCREENS: Record<Stage, ComponentType> = {
  home: Home,
  brief: Brief,
  workspace: Workspace,
  senior_feedback: SeniorFeedback,
  final_feedback: FinalFeedback,
  branch_select: BranchSelect,
  vendor_compare: VendorCompare,
  self_assessment: SelfAssessment,
  report: Report,
}

const KNOWN_PATHS = new Set(['/', '/design-system', '/explore', '/explore/job', '/session1'])
// 직무 상세페이지 "업무 프로세스" 스텝 인덱스 -> 진입할 경로. 6번(모형 제작 및 설계 검토)은
// 세션1(프로토타입 수정), 8번(시방서 작성 및 설계 이관)은 세션2(기존 "/" 플로우).
const STEP_INDEX_TO_PATH: Record<number, string> = { 5: '/session1', 7: '/' }

// 라우터 없이 pathname으로만 분기하는 최소 구현. 세션 stage 화면은 항상 "/"에서 뜨고,
// /explore 계열은 별도 섹션(직무 마켓플레이스), 그 외 경로는 전부 오류 페이지로 떨어진다.
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
  const { pathname, navigate } = useSimpleRouter()

  if (pathname === '/design-system') {
    return <DesignSystem />
  }

  if (pathname === '/explore') {
    return <Explore onOpenJob={() => navigate('/explore/job')} />
  }

  if (pathname === '/explore/job') {
    return (
      <JobDetail
        onClose={() => navigate('/explore')}
        onSubmit={(stepIndex) => navigate(STEP_INDEX_TO_PATH[stepIndex] ?? '/')}
      />
    )
  }

  if (pathname === '/session1') {
    return <Session1App />
  }

  if (!KNOWN_PATHS.has(pathname)) {
    return <ErrorPage onConfirm={() => navigate('/')} />
  }

  const Screen = SCREENS[stage]

  return (
    <Layout stage={stage}>
      <Screen />
    </Layout>
  )
}

export default App
