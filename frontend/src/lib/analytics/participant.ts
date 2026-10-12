// 유저 테스트 참가자 코드 — 테스트 링크(?ut=P07)로 들어온 탭의 모든 이벤트에 props.ut로 붙는다.
// 탭 단위(sessionStorage)로 둔다: 같은 노트북으로 다음 참가자를 받을 때 이전 코드가 남아 기록이
// 섞이는 것보다, 새 탭에서 코드가 빠지는 쪽이 티가 나서 낫다. ?ut=off 로 지울 수 있다.
const KEY = 'jobda-ut'
const ROUND_KEY = 'jobda-ut-round'
const CODE = /^[A-Za-z0-9_-]{1,32}$/
const ROUND = /^[A-Za-z0-9_.-]{1,16}$/

// UT 회차는 링크의 &round=V1 — 같은 참가자 코드로 여러 회차를 돌려도 결과를 나눠 볼 수 있다.
export function captureParticipant(search = window.location.search) {
  const params = new URLSearchParams(search)
  const code = params.get('ut')
  if (code === null) return
  const round = params.get('round')
  try {
    if (CODE.test(code) && code !== 'off') {
      sessionStorage.setItem(KEY, code)
      if (round && ROUND.test(round)) sessionStorage.setItem(ROUND_KEY, round)
      else sessionStorage.removeItem(ROUND_KEY)
    } else {
      sessionStorage.removeItem(KEY)
      sessionStorage.removeItem(ROUND_KEY)
    }
  } catch {
    // 저장소 접근이 막힌 환경에서는 참가자 코드 없이 일반 방문으로 기록된다.
  }
}

export function currentParticipant(): string | null {
  try {
    const code = sessionStorage.getItem(KEY)
    return code && CODE.test(code) ? code : null
  } catch {
    return null
  }
}

export function currentRound(): string | null {
  try {
    const round = sessionStorage.getItem(ROUND_KEY)
    return currentParticipant() && round && ROUND.test(round) ? round : null
  } catch {
    return null
  }
}
