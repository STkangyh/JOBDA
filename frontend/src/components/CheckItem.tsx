import { Text } from './Text'
import { CheckBoxIcon } from './icons'

// 체크박스 아이콘 + 텍스트 한 줄 — session1/session2 Brief.tsx의 "세션 목표" 리스트에
// 동일하게 복붙돼 있던 로컬 컴포넌트를 하나로 모음.
export function CheckItem({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-1">
      <CheckBoxIcon className="size-4 shrink-0 text-green-500" />
      <Text variant="body-lg" className="text-neutral-600">
        {children}
      </Text>
    </div>
  )
}
