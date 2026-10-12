// 첫 방문 화면(/welcome)을 본 브라우저인지 — 루트(/)에 처음 들어온 브라우저에만 시작 화면을 보여주고,
// 시작 화면의 버튼을 한 번 누르면 다시 띄우지 않는다(2026-10-13 결정). /welcome 주소로는 언제든 다시 볼 수 있다.
const KEY = 'jobda-welcome-seen'

export function hasSeenWelcome(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    // 저장소가 막힌 환경에서는 매번 시작 화면을 띄우는 대신 바로 홈을 보여준다.
    return true
  }
}

export function markWelcomeSeen() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // 저장 실패는 무시 — 다음 방문에 시작 화면이 한 번 더 보일 뿐이다.
  }
}
