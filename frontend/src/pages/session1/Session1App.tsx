import type { ComponentType } from 'react'
import { useSession1 } from '../../store/session1'
import type { S1Stage } from '../../store/session1'
import { Session1Brief } from './Brief'
import { Session1Materials } from './Materials'
import { Session1Workspace } from './Workspace'
import { Session1FinalCheck } from './FinalCheck'
import { Session1SelfAssessment } from './SelfAssessment'
import { Session1Report } from './Report'
import { StageJumper } from '../../components/StageJumper'

const SCREENS: Record<S1Stage, ComponentType> = {
  brief: Session1Brief,
  materials: Session1Materials,
  round: Session1Workspace,
  final_check: Session1FinalCheck,
  self_assessment: Session1SelfAssessment,
  report: Session1Report,
}

// 임시 개발용 StageJumper가 쓰는 세션1 단계 목록/라벨.
const SESSION1_STAGES: { value: S1Stage; label: string }[] = [
  { value: 'brief', label: '브리프' },
  { value: 'materials', label: '자료탐색' },
  { value: 'round', label: '라운드' },
  { value: 'final_check', label: '최종 확인' },
  { value: 'self_assessment', label: '자기 평가' },
  { value: 'report', label: '직무 리포트' },
]

export function Session1App() {
  const stage = useSession1((s) => s.currentStage)
  const goTo = useSession1((s) => s.goTo)
  const Screen = SCREENS[stage]
  return (
    <>
      <Screen />
      <StageJumper stages={SESSION1_STAGES} current={stage} onJump={goTo} />
    </>
  )
}
