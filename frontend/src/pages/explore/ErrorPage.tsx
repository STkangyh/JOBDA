import illustration from '../../assets/illustrations/illustration-error-window.png'

// Figma "에러창"(652:29005 계열) — 404/일반 오류 화면. Desktop-98(744:17317)에서
// 같은 컴포넌트를 다시 실측해보니 이전에 옮겨둔 버전과 두 군데가 달랐음:
// "Error" 제목이 24px가 아니라 40px였고, 확인 버튼도 밝은 배경이 아니라
// bg-#2c2c2c(neutral-900)+밝은 텍스트였음(반대로 되어 있었음) — 둘 다 이 실측값으로 정정.
export function ErrorPage({
  message = '알 수 없는 오류가 발생했습니다.',
  onConfirm,
}: {
  message?: string
  onConfirm: () => void
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-neutral-900/80 px-4 py-10">
      <img src={illustration} alt="" className="w-full max-w-md" />
      <div className="flex flex-col items-center gap-2">
        <p className="text-[40px] font-semibold leading-tight text-error-200">Error</p>
        <p className="text-body-lg font-semibold text-neutral-50">{message}</p>
      </div>
      <button
        type="button"
        onClick={onConfirm}
        className="h-[72px] w-[340px] rounded-xl bg-neutral-900 text-2xl font-semibold text-neutral-50 transition-colors hover:bg-neutral-800"
      >
        확인
      </button>
    </div>
  )
}
