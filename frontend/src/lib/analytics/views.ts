// 화면 안의 탭·모달·패널 이름은 전부 여기서 타입으로 관리한다 — 오타가 타입 검사에서 걸리고,
// 무엇을 추적하는지 한 파일에서 보인다. 새 탭/모달을 만들면 여기에 이름을 추가하고 useTrackView를 붙인다.
export type ViewKind = 'tab' | 'modal' | 'panel' | 'drawer'

type PersonaKey = 'senior' | 'engineering' | 'purchasing'

export type ViewName =
  | `messenger:${PersonaKey}`
  | `vendor_phase:${'research' | 'select' | 'feedback'}`
  | `materials_doc:${'spec_form' | 'limit_sample'}`
  | `workspace_mode:${'draft' | 'final'}`
  | `round:${number}`

// navigate = 화면(screen)이 바뀌어서 이전 화면의 뷰를 자동으로 닫음
export type CloseHow = 'button' | 'esc' | 'backdrop' | 'switch' | 'unmount' | 'navigate'
