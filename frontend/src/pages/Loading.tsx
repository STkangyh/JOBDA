import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import reportStack from '../assets/illustrations/loading-report-stack.png'
import spinner from '../assets/loading/spinner.svg'

// Figma "체험 준비 · Loading splash"(2217:9710, 2026-10-13). 시작 화면의 "체험 시작하기" 다음 화면.
// 진행 막대가 차는 만큼 오른쪽 아래 숫자가 같이 오르고, 다 찰 때까지 가운데 스피너가 계속 돈다.

// 다음 목적지: (예정) 로그인 → 온보딩. 두 화면 디자인이 오기 전까지는 체험 진입점인 직무 상세로 임시 연결한다.
const NEXT_PATH = '/explore/job'

// 실제로 기다릴 서버 작업이 아직 없어 정해진 시간 동안 채운다. 그 사이 다음 화면 코드를 미리 받아둔다.
export const LOADING_DURATION_MS = 2400
const TICK_MS = 30
// 100%가 된 모습을 잠깐 보여주고 넘어간다.
const HOLD_MS = 300

// 처음엔 천천히, 끝으로 갈수록 빠르게 차게(ease-in, 2026-10-13 요청)
const easeIn = (t: number) => t ** 2

export function Loading() {
  const navigate = useNavigate()
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    void import('./explore/JobDetail')
    let elapsed = 0
    const id = window.setInterval(() => {
      elapsed = Math.min(LOADING_DURATION_MS, elapsed + TICK_MS)
      setPercent(Math.round(easeIn(elapsed / LOADING_DURATION_MS) * 100))
      if (elapsed >= LOADING_DURATION_MS) window.clearInterval(id)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (percent < 100) return
    const id = window.setTimeout(() => navigate(NEXT_PATH, { replace: true }), HOLD_MS)
    return () => window.clearTimeout(id)
  }, [percent, navigate])

  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-950 px-4 py-12">
      <div className="rounded-[20px] bg-[rgba(44,44,44,0.75)] p-[60px]">
        <div className="flex w-[479px] max-w-full flex-col items-center gap-10">
          <img src={reportStack} alt="" width={437} height={265} className="h-[265px] w-[437px] max-w-full object-cover" />

          <div className="flex w-full flex-col items-center gap-4 text-center">
            <span className="flex size-[50px] items-center justify-center rounded-full bg-neutral-900 backdrop-blur-panel" aria-hidden>
              {/* 진행 중에는 계속 돈다(사용자 요청) — 동작 줄이기 설정에서도 멈추지 않는 기능성 표시 */}
              <img src={spinner} alt="" width={24} height={24} className="size-6 animate-spin [animation-duration:1.2s]" />
            </span>
            <h1 className="text-headline-lg text-green-50">체험 공간을 준비하고 있어요</h1>
            <p className="text-title-md font-medium text-neutral-500">잠시만 기다려 주세요.</p>
          </div>

          <div className="flex w-[360px] max-w-full flex-col gap-3">
            <div
              role="progressbar"
              aria-label="체험 자료 불러오는 중"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-1.5 w-full overflow-clip rounded-md bg-neutral-900"
            >
              <div className="h-full rounded-md bg-green-400" style={{ width: `${percent}%` }} />
            </div>
            <div className="flex justify-between text-caption-lg whitespace-nowrap">
              <p className="text-neutral-600">체험 자료 불러오는 중</p>
              <p className="text-green-400 tabular-nums" aria-hidden>
                {percent}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
