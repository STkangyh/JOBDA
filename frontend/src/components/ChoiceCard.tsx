import type { ReactNode } from 'react'
import { Text } from './Text'

interface ChoiceCardProps {
  index: number
  title: string
  selected: boolean
  onClick: () => void
  /** 번호 배지 텍스트 스타일 — session2(BranchSelect/FinalFeedback)는 body-lg, session1
   *  Workspace(ReviewAndChoice)는 caption-lg를 써서 기존 화면 그대로 유지할 수 있게 뺐다. */
  numberVariant?: 'body-lg' | 'caption-lg'
  children?: ReactNode
}

// 번호(01/02..) + 제목 + 부가 설명을 가진 선택형 카드 — 선택 시 초록 배경, 비선택 시 흰
// 배경+테두리+hover. session1 Workspace의 ReviewAndChoice(2지선다, sublabel/optionalNote
// 줄글)와 session2 BranchSelect·FinalFeedback(3지선다, 불릿 목록)이 부가 설명 형태만 다르고
// 나머지는 완전히 동일해서, 부가 설명은 children으로 각자 렌더링하게 뺐다.
export function ChoiceCard({ index, title, selected, onClick, numberVariant = 'body-lg', children }: ChoiceCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-md p-5 text-left transition-colors ${
        selected
          ? 'bg-green-400 text-neutral-900'
          : 'border border-neutral-200 bg-white hover:border-green-400 hover:bg-green-50'
      }`}
    >
      <Text
        variant={numberVariant}
        emphasis={numberVariant === 'body-lg'}
        className={selected ? 'text-green-800' : 'text-neutral-400'}
      >
        {String(index + 1).padStart(2, '0')}
      </Text>
      <Text variant="title-lg" emphasis className="text-neutral-900">
        {title}
      </Text>
      {children}
    </button>
  )
}
