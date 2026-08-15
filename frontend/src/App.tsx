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
  const Screen = SCREENS[stage]

  return (
    <Layout stage={stage}>
      <Screen />
    </Layout>
  )
}

export default App
