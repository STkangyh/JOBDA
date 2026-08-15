import type { ComponentType } from 'react'
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

function App() {
  const stage = useSession((s) => s.currentStage)

  // 라우터 없이 정적 스타일 가이드 하나만 예외로 경로 분기 — 나머지 화면은 세션 stage로 전환된다.
  if (window.location.pathname === '/design-system') {
    return <DesignSystem />
  }

  const Screen = SCREENS[stage]

  return (
    <Layout stage={stage}>
      <Screen />
    </Layout>
  )
}

export default App
