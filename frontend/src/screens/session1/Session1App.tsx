import type { ComponentType } from 'react'
import { useSession1 } from '../../store/session1'
import type { S1Stage } from '../../store/session1'
import { Session1Brief } from './Brief'
import { Session1Workspace } from './Workspace'
import { Session1FinalCheck } from './FinalCheck'
import { Session1SelfAssessment } from './SelfAssessment'
import { Session1Report } from './Report'

const SCREENS: Record<S1Stage, ComponentType> = {
  brief: Session1Brief,
  round: Session1Workspace,
  final_check: Session1FinalCheck,
  self_assessment: Session1SelfAssessment,
  report: Session1Report,
}

export function Session1App() {
  const stage = useSession1((s) => s.currentStage)
  const Screen = SCREENS[stage]
  return <Screen />
}
