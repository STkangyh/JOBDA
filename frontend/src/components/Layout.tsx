import type { ReactNode } from 'react'
import type { Stage } from '../types'

const STAGE_LABEL: Record<Stage, string> = {
  home: '홈',
  brief: '브리프',
  workspace: '업무 워크스페이스',
  senior_feedback: '선임 디자이너 피드백',
  final_feedback: '설계팀·구매팀 피드백',
  branch_select: '방향 선택',
  vendor_compare: '외주업체 비교',
  self_assessment: '자기평가',
  report: '직무 이해 리포트',
}

export function Layout({ stage, children }: { stage: Stage; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-4 py-6">
      {stage !== 'home' && (
        <header className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-3 text-sm text-neutral-500 dark:border-neutral-800">
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            공기청정기 목재 파트 시방서
          </span>
          <span>{STAGE_LABEL[stage]}</span>
        </header>
      )}
      <main className="flex-1">{children}</main>
    </div>
  )
}
