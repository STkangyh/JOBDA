import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 사용자 요청 — 실제 배포 서버(수동 빌드/배포)가 최신 커밋을 반영했는지 콘솔에서 바로 확인할
// 수 있게, 빌드 시점의 git 커밋 해시를 번들에 심어둔다(main.tsx에서 콘솔에 찍음).
const commitHash = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
})()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_COMMIT__: JSON.stringify(commitHash),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
