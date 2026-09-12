import { Text } from './Text'
import { WarningIcon } from './icons'

// "가능 피드백 세션 N회 남음" 배지 — FinalFeedback/SeniorFeedback/VendorCompare/Workspace
// 4개 화면에 동일한 JSX가 복붙돼 있던 것을 하나로 모음.
export function FeedbackRemainingBadge({ remaining }: { remaining: number }) {
  return (
    <div className="flex items-end gap-1">
      <WarningIcon className="size-5 shrink-0 text-error-200" />
      <Text variant="body-sm" className="text-neutral-400">
        가능 피드백 세션 {remaining}회 남음
      </Text>
    </div>
  )
}
