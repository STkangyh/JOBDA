import brandLogo from '../assets/brand-logo.png'
import { Text } from './Text'

// Web Analytics로 실제 모바일 방문이 확인됨(적은 수지만 0은 아님) — 화면 전부가 Figma 데스크톱
// 프레임 그대로(w-[430px], grid-cols-5, 고정폭 사이드바 등)라 좁은 화면에서는 레이아웃이
// 깨진다. 반응형으로 다시 짜는 건 이번 스코프를 벗어나서, 대신 화면 크기로 감지해 안내만
// 띄운다 — App.tsx가 이 컴포넌트를 라우트 전체 대신 렌더링한다.
export function MobileNotice() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-neutral-950 px-6 py-10 text-center">
      <img src={brandLogo} alt="JOB:SIM" className="size-[67px] rounded-lg object-cover" />
      <div className="flex flex-col items-center gap-2">
        <Text variant="headline-md" emphasis className="text-neutral-50">
          PC 화면에서 이용해주세요
        </Text>
        <Text variant="body-lg" className="max-w-xs text-neutral-400">
          이 서비스는 아직 모바일 화면에 맞춰져 있지 않아요. 더 넓은 화면의 PC나 노트북으로
          접속하시면 정상적으로 이용하실 수 있어요.
        </Text>
      </div>
    </div>
  )
}
