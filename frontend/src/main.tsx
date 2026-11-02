import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.tsx'
import { ANALYTICS_ENABLED } from './lib/analytics/analytics'
import { captureParticipant } from './lib/analytics/participant'

// 라우터가 주소를 바꾸기 전에 테스트 링크의 참가자 코드를 먼저 잡아둔다.
captureParticipant()

if (ANALYTICS_ENABLED) {
  void import('./lib/analytics/supabase').then((m) => m.startSupabaseAnalytics())
  // 로그인한 계정의 진행을 계정에 계속 저장한다(lib/progress.ts)
  void import('./lib/progress').then((m) => m.startProgressSync())
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    <Analytics />
  </StrictMode>,
)
