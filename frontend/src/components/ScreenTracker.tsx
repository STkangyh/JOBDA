import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSession } from '../store/session'
import { useSession1 } from '../store/session1'
import { setContext, setScreen, type Flow } from '../lib/analytics'

// 화면(screen) = 주소, 단 세션은 주소가 하나(/session1, /session2)뿐이라 단계까지 붙인다
// (예: session2/vendor_compare). 이탈률·퍼널이 이 단위로 계산된다.
export function ScreenTracker({ narrow }: { narrow: boolean }) {
  const { pathname } = useLocation()
  const s2Stage = useSession((s) => s.currentStage)
  const s2Id = useSession((s) => s.sessionId)
  const s1Stage = useSession1((s) => s.currentStage)
  const s1Id = useSession1((s) => s.sessionId)

  useEffect(() => {
    const flow: Flow = pathname.startsWith('/session2') ? 's2' : pathname.startsWith('/session1') ? 's1' : 'explore'
    setContext(flow, flow === 's2' ? s2Id : flow === 's1' ? s1Id : null)
    if (narrow) setScreen('mobile_notice')
    else if (flow === 's2') setScreen(`session2/${s2Stage}`)
    else if (flow === 's1') setScreen(`session1/${s1Stage}`)
    else setScreen(pathname)
  }, [pathname, narrow, s2Stage, s2Id, s1Stage, s1Id])

  return null
}
