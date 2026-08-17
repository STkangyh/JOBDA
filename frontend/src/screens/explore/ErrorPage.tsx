import illustration from '../../assets/illustrations/illustration-error-window.png'
import { Text } from '../../components/Text'

// Figma "Component 221 / Dark Mode" (652:29022) — 404/일반 오류 화면.
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
        <Text variant="headline-md" emphasis className="text-error-200">
          Error
        </Text>
        <Text variant="body-lg" className="text-neutral-50">
          {message}
        </Text>
      </div>
      <button
        type="button"
        onClick={onConfirm}
        className="h-[72px] w-[340px] rounded-xl bg-neutral-100 text-2xl font-semibold text-neutral-900 transition-colors hover:bg-white"
      >
        확인
      </button>
    </div>
  )
}
