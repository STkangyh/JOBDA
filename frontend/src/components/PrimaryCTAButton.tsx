import type { ButtonHTMLAttributes } from 'react'
import { Button } from './Button'

// 라운드/단계를 넘기는 주요 CTA 버튼 — h-[72px] w-[340px], 카드 스택 오른쪽 아래 정렬.
// 세션1·세션2 전 화면(Workspace/SelfAssessment/VendorCompare/BranchSelect/FinalFeedback/
// Materials/FinalCheck/JobDetail 등)에 동일한 클래스가 복붙돼 있던 것을 하나로 모음.
export function PrimaryCTAButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button variant="primary" className="h-[72px] w-[340px] self-end !rounded-xl !text-2xl" {...props} />
}
