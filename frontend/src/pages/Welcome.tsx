import { useNavigate } from 'react-router-dom'
import wordmark from '../assets/jobda-wordmark.png'
import designerArtwork from '../assets/illustrations/welcome-designer.png'
import { Sidebar } from '../components/Sidebar'
import { track } from '../lib/analytics'
import { markWelcomeSeen } from '../lib/welcome'

// Figma "첫 방문 · Welcome splash"(2217:9804, 2026-10-13). 디자이너 메모 없음.
// 이 화면의 GNB가 새 공통 GNB 디자인의 기준이다(components/Sidebar.tsx).

const JOURNEY = [
  { title: '아이디어를 발견하고', body: '생활 속 문제에서 제품의 가능성을 찾아요.' },
  { title: '디자인으로 구체화하고', body: '스케치부터 설계까지, 생각을 형태로 만들어요.' },
  { title: '하나의 제품을 완성해요', body: '소재 선정과 양산까지, 전체 과정을 경험해요.' },
]

// 체험 시작하기 → (예정) 로딩 → 로그인(로그인 상태 유지 체크) → 온보딩. 세 화면 디자인이 오기 전까지는
// 지금의 체험 진입점인 직무 상세로 임시 연결한다.
const START_PATH = '/explore/job'

export function Welcome() {
  const navigate = useNavigate()

  const go = (cta: 'welcome_start' | 'welcome_explore', path: string) => {
    track('cta', { name: cta })
    markWelcomeSeen()
    navigate(path)
  }

  return (
    <div className="flex min-h-svh gap-[clamp(24px,3.1vw,54px)] bg-neutral-950 pt-[54px] pr-8 pb-12 pl-12">
      <Sidebar active="home" />

      <main className="flex min-w-0 flex-1 flex-col justify-center gap-0 pr-[clamp(0px,1.4vw,22px)]">
        {/* Figma 소개 영역 높이 720px(1117px 화면 기준) — 낮은 화면에서는 비율대로 줄인다 */}
        <section className="grid min-h-[clamp(560px,64.5svh,720px)] grid-cols-[minmax(0,742px)_minmax(0,650px)] items-center gap-[clamp(32px,4.6vw,80px)] py-20">
          <div className="flex flex-col gap-20">
            <img src={wordmark} alt="JOB:DA" width={240} height={67} className="h-[67px] w-60 object-contain object-left" />
            <div className="flex flex-col gap-8">
              <h1 className="text-headline-lg font-medium text-green-400">
                생활을 바꾸는 디자인,
                <br />
                직접 경험해 보세요
              </h1>
              <p className="text-body-lg text-neutral-500">
                생활 가전 제품 디자이너가 되어
                <br />
                아이디어부터 제품 완성까지 만나보세요.
              </p>
              <div className="flex flex-wrap gap-4 pt-3">
                <button
                  type="button"
                  onClick={() => go('welcome_start', START_PATH)}
                  className="h-16 w-56 rounded-[32px] border-2 border-green-100 bg-green-300 text-title-md font-medium text-neutral-700 shadow-[inset_0_0_12px_6px_var(--color-green-100),var(--shadow-gnb)] transition-colors active:bg-[#c7dab5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
                >
                  체험 시작하기
                </button>
                <button
                  type="button"
                  onClick={() => go('welcome_explore', '/explore')}
                  className="h-16 w-56 rounded-[32px] border-2 border-[rgba(225,225,225,0.5)] bg-[rgba(245,245,245,0.5)] text-title-md font-medium text-neutral-900 shadow-gnb backdrop-blur-gnb focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
                >
                  직무 알아보기
                </button>
              </div>
            </div>
          </div>
          <div className="aspect-[650/482] w-full overflow-clip rounded-3xl">
            <img src={designerArtwork} alt="" width={1200} height={675} className="size-full object-cover" />
          </div>
        </section>

        <ul className="grid min-h-[185px] grid-cols-3 gap-5" aria-label="체험 과정">
          {JOURNEY.map((step) => (
            <li key={step.title} className="flex flex-col items-center justify-center gap-2 rounded-lg bg-[rgba(44,44,44,0.75)] px-5 py-10 text-center">
              <p className="text-title-lg text-green-500">{step.title}</p>
              <p className="text-body-lg text-neutral-500">{step.body}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
