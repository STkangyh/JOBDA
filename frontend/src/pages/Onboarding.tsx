import { useNavigate } from 'react-router-dom'
import designerArtwork from '../assets/illustrations/welcome-designer.png'
import similarWork1 from '../assets/onboarding/similar-1.png'
import similarWork2 from '../assets/onboarding/similar-2.png'
import similarWork3 from '../assets/onboarding/similar-3.png'
import checkBoxIcon from '../assets/onboarding/check-box.svg'
import profileIcon from '../assets/onboarding/profile.svg'
import { Sidebar } from '../components/Sidebar'
import { track } from '../lib/analytics'

// Figma "생활 가전 제품 디자이너 · 온보딩"(2217:9726, 2026-10-13). 로그인·가입 인증 뒤 도착하는 화면(lib/auth AFTER_AUTH_PATH).
// 상단 탭: "체험 안내"가 이 화면, "직무 소개"는 직무 상세(/explore/job).
// "체험 시작하기"는 직무 상세의 체험 시작과 같은 곳(세션2)으로 간다.
const START_PATH = '/session2'

const TASKS = ['디자인 확정 및 CMF 선정', '시방서 작성 및 외부업체 선정', '현장 감리']

// Figma에서 2·3번째 썸네일은 1번 그림 위에 불투명한 그림을 겹친 구성이라, 보이는 맨 위 그림만 쓴다.
const SIMILAR_WORK = [similarWork1, similarWork2, similarWork3]

function CardHeading({ badge, title, body }: { badge: string; title: string; body: string }) {
  return (
    <div className="flex flex-col items-start gap-2.5">
      <span className="rounded-[15px] bg-green-500 px-2 py-1 text-body-lg text-green-900">{badge}</span>
      <h3 className="text-headline-md text-green-50">{title}</h3>
      <p className="text-[15px] leading-[1.6] text-neutral-500">{body}</p>
    </div>
  )
}

export function Onboarding() {
  const navigate = useNavigate()

  const start = () => {
    track('cta', { name: 'onboarding_start' })
    navigate(START_PATH)
  }

  return (
    <div className="flex h-svh gap-[clamp(24px,3.1vw,54px)] overflow-hidden bg-neutral-950 pt-[clamp(24px,5svh,56px)] pr-[clamp(32px,3.1vw,54px)] pb-[clamp(16px,3svh,32px)] pl-8">
      <Sidebar active="home" />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-[clamp(12px,3svh,32px)] pt-3">
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-headline-lg font-medium text-green-50">처음 오셨나요?</h1>
            <p className="text-body-lg font-medium text-neutral-600">시작 전, 체험을 안내해 드릴게요.</p>
          </div>
          <nav aria-label="직무 안내" className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/explore/job')}
              className="h-14 rounded-[32px] border-2 border-[rgba(225,225,225,0.5)] bg-neutral-900 px-6 text-body-lg text-neutral-400 shadow-gnb backdrop-blur-gnb transition-colors hover:text-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            >
              직무 소개
            </button>
            <span
              aria-current="page"
              className="flex h-14 items-center rounded-[32px] border-2 border-green-100 bg-green-300 px-6 text-body-lg font-medium text-[#1b1b1b] shadow-[inset_0_0_12px_6px_var(--color-green-100),var(--shadow-gnb)]"
            >
              체험 안내
            </span>
          </nav>
        </header>

        {/* 소개·버튼은 고정, 안내 카드 줄이 남는 높이를 쓰고 넘치면 카드 안에서 스크롤 — 페이지는 스크롤되지 않는다 */}
        <main className="flex min-h-0 flex-1 flex-col justify-between gap-[clamp(12px,3svh,48px)]">
          <section className="flex shrink-0 items-end gap-[clamp(24px,3.2vw,56px)]" aria-label="체험 소개">
            <div className="flex min-w-0 flex-1 flex-col gap-5">
              <h2 className="text-headline-lg font-medium text-green-50">
                당신의 첫 디자인 업무,
                <br />
                여기서 시작해 보세요.
              </h2>
              <p className="text-title-lg text-neutral-500">
                C 가전회사의 초임 디자이너 심재현씨가 되어 보세요.
                <br />
                탁상형 공기청정기의 기획부터 아이데이션, 시각화, 설계,
                <br />
                양산 프로젝트 사후 관리까지 직접 경험할 수 있어요.
              </p>
            </div>
            <img
              src={designerArtwork}
              alt=""
              width={1200}
              height={675}
              className="aspect-[550/356] max-h-[26svh] w-auto max-w-[40%] shrink-0 rounded-xl object-cover"
            />
          </section>

          <section className="flex min-h-0 flex-1 flex-col gap-[clamp(8px,1.8svh,20px)]" aria-labelledby="onboarding-areas">
            <h2 id="onboarding-areas" className="text-headline-md font-bold text-green-50">
              이렇게 체험하고, 나를 알아가요
            </h2>
            <div className="grid min-h-0 flex-1 grid-cols-3 gap-[18px]">
              <article className="flex max-h-[288px] min-h-0 flex-col justify-between gap-[clamp(8px,2svh,24px)] overflow-y-auto rounded-xl bg-neutral-900 p-[clamp(16px,2.2svh,24px)]">
                <CardHeading badge="업무 경험" title="이번에 경험한 업무" body="하루의 업무를 따라가며 디자이너의 판단과 협업을 경험해요." />
                <ul className="flex flex-col gap-2">
                  {TASKS.map((task) => (
                    <li key={task} className="flex items-center gap-2.5 text-[15px] text-neutral-300">
                      <img src={checkBoxIcon} alt="" width={18} height={18} className="size-[18px] shrink-0" />
                      {task}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="flex max-h-[288px] min-h-0 flex-col justify-between gap-[clamp(8px,2svh,24px)] overflow-y-auto rounded-xl bg-neutral-900 p-[clamp(16px,2.2svh,24px)]">
                <CardHeading badge="관심 확장" title="체험해 볼 만한 유사한 업무" body="경험한 업무와 연결되는 다른 업무를 살펴보며 관심의 폭을 넓혀요." />
                <div className="flex gap-4">
                  {SIMILAR_WORK.map((src) => (
                    <img key={src} src={src} alt="" width={142} height={92} className="aspect-[142/92] w-[142px] min-w-0 shrink rounded-lg object-cover" />
                  ))}
                </div>
              </article>

              <article className="flex max-h-[288px] min-h-0 flex-col justify-between gap-[clamp(8px,2svh,24px)] overflow-y-auto rounded-xl bg-neutral-900 p-[clamp(16px,2.2svh,24px)]">
                <CardHeading badge="나의 발견" title="내 직무 이해 프로필" body="사용자 패턴에서 반복적으로 나타난 판단, 협업 성향을 보여줍니다." />
                <div className="flex flex-col gap-3">
                  <p className="flex items-center gap-2.5 text-body-md text-neutral-300">
                    <img src={profileIcon} alt="" width={20} height={20} className="size-5 shrink-0" />
                    판단 · 피드백 · 협업 성향
                  </p>
                  <hr className="h-px border-0 bg-[#3a3a3a]" />
                  <p className="text-body-md leading-[1.6] text-neutral-500">
                    아직은 빈 프로필이에요.
                    <br />
                    업무 속 선택이 쌓이면 나의 성향을 확인할 수 있어요.
                  </p>
                </div>
              </article>
            </div>
          </section>

          <div className="flex shrink-0 justify-end">
            <button
              type="button"
              onClick={start}
              className="h-[clamp(56px,6.4svh,72px)] w-[340px] rounded-xl bg-green-500 text-headline-md font-semibold text-[#1b1b1b] transition-colors hover:bg-green-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            >
              체험 시작하기
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
