/// <reference types="vite/client" />

// vite.config.ts에서 define으로 심어주는 빌드 시점 상수 — main.tsx가 콘솔에 찍어서
// 실제 배포 서버가 어느 커밋을 반영했는지 바로 확인할 수 있게 한다.
declare const __BUILD_COMMIT__: string
declare const __BUILD_TIME__: string
