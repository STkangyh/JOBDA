import { Workspace } from './Workspace'

// 업무 페이지 새 디자인(2217:10277, 2026-10-13)에서는 1차 피드백이 별도 화면이 아니라 시방서 작성 화면 안(과제 카드)에 나온다.
// 활동 로그·퍼널·UT 지표가 'senior_feedback' 단계의 화면 기록(피드백 수신)을 쓰므로 단계는 그대로 두고 같은 화면을 보여준다 —
// 초안을 제출하면 이 단계가 되고, Workspace가 수정 모드(draftSubmitted && !finalSubmitted)로 피드백과 수정 양식을 띄운다.
export function SeniorFeedback() {
  return <Workspace />
}
