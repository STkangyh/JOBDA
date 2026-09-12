// 세션2("관계자 협업" 라운드) 화면 여러 곳(SeniorFeedback.tsx/Workspace.tsx)이 공유하던 고정
// 시나리오 문구 — 전부 동일한 오크 원목 CMF/시방서 이야기를 다른 화면에서 반복 서술하고
// 있었음. 실측 근거는 각각 823:55090("Desktop - 130")/823:53614 등, 개별 파일에 남겨둠.

export const DRAFT_DESCRIPTION =
  '이번 공기청정기의 외부 CMF 소재는 오크 재질의 원목을 사용하고자 합니다. 색상은 자연스러운 원목의 색상을 살릴 수 있는 오크 내추럴 컬러로 하며, 목재 접합 설비를 활용한 제작 공정을 거치고자 합니다.'

export const SENIOR_INTRO =
  '색이랑 마감 모두 결정됐어요. 설계팀에 넘길 시방서 작성하고 저한테 보내주세요.\n미리 말하는데, 이번에 목재 처음 써보는 거라 사내 공장에서 목재 접합은 안 하는 거로 알고 있어요. 시트지로 마감하거나, 외부 업체 알아봐야 할 겁니다. 발주 일정까지 12일 남았는데 그 안에 어떻게든 해결하세요.'

export const FEEDBACK_PASS = '항목은 다 있네요. 이대로 설계팀·구매팀 검토로 넘기세요.'
export const FEEDBACK_FAIL =
  '목재와 같이 결과물이 일정하지 않은 소재는 한도 견본 판정표라고 "이 색으로 해주세요"가 아니라 "이 정도까지는 받겠습니다"를 알려줘야 해요. 공용 서식 폴더의 한도 견본 판정표 양식을 참고해서 별첨해주세요.'

// WorkNotesCard 태그 — FinalFeedback/SeniorFeedback/VendorCompare/Workspace 4곳이 userNeeds/
// constraints를 완전히 동일하게 복붙해두고 있었음. cmf 태그는 화면마다(피드백 진행도에 따라)
// 달라서 각 파일에 남겨둠.
export const SESSION2_NOTE_TAGS = {
  userNeeds: ['저소음', '공간 효율', '따뜻함', '관리 용이', '인테리어 오브제 느낌'],
  constraints: ['파팅라인 단차 0.5mm 이격할 것', '전면부 하우징은 하나로', '에어케어 제품과 내부 설계 공유'],
}
