import illustration from '../../assets/illustrations/error-window-nobg.png'

// Figma 오류 페이지(2217:13356 Dark · 2217:13381 White, 2026-10-31). 반투명 막 위에 에러창 그림·제목·확인 버튼.
// dark: 어두운 화면(탐색·인증 등) 위, light: 밝은 업무 화면 위. 주소를 잘못 입력했을 때는 dark를 쓴다.
export function ErrorPage({
  message = '알 수 없는 오류가 발생했습니다.',
  tone = 'dark',
  onConfirm,
}: {
  message?: string
  tone?: 'dark' | 'light'
  onConfirm: () => void
}) {
  const dark = tone === 'dark'
  return (
    <div
      role="alert"
      className={`flex h-svh flex-col items-center justify-center overflow-hidden px-4 ${dark ? 'bg-[#2b2b2b]' : 'bg-neutral-400'}`}
    >
      {/* 그림 아래쪽이 제목과 겹치도록(-82px) 붙인다 — Figma 배치 그대로 */}
      <div className="-mb-[clamp(40px,7.3svh,82px)] aspect-[2/1] w-[min(746px,90vw,66svh)] overflow-hidden">
        <img src={illustration} alt="" className="size-full object-cover object-bottom" />
      </div>
      <div className="relative flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[40px] leading-[1.2] font-semibold text-error-200">Error</p>
          <p className={`text-body-lg font-semibold ${dark ? 'text-neutral-75' : 'text-neutral-900'}`}>{message}</p>
        </div>
        <button
          type="button"
          onClick={onConfirm}
          className={`h-[72px] w-[340px] max-w-full rounded-xl text-headline-md font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 ${
            dark ? 'bg-neutral-100 text-neutral-900 hover:bg-neutral-50' : 'bg-neutral-900 text-neutral-75 hover:bg-neutral-800'
          }`}
        >
          확인
        </button>
      </div>
    </div>
  )
}
