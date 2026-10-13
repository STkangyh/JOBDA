import { useRef, useState } from 'react'
import designerArtwork from '../../assets/illustrations/welcome-designer.png'
import siteSupervisionArtwork from '../../assets/onboarding/similar-1.png'
import reportStack from '../../assets/illustrations/loading-report-stack.png'
import arrowIcon from '../../assets/explore/arrow-backward.svg'
import fieldIcon from '../../assets/explore/badge-field.svg'
import durationIcon from '../../assets/explore/badge-duration.svg'
import dotIcon from '../../assets/explore/dot.svg'
import { Sidebar } from '../../components/Sidebar'
import { ProfileMeter } from '../../components/ProfileMeter'
import { track } from '../../lib/analytics'
import { useSession } from '../../store/session'
import type { ProfileAxis } from '../../types'

// Figma "Desktop - 272"(2217:13409, 2026-10-13) — 탐색 홈. 직무는 "생활 가전 제품 디자이너" 하나만 남기고
// (여러 직무 캐러셀·Top 10은 삭제), 그 직무의 업무 카드 줄을 보여준다.
// 카드는 모두 업무 화면(/explore/job)으로 간다 — 업무 화면에서 실제로 고를 수 있는 단계는 시방서(세션2)뿐.
// 카드 줄은 화살표로만 넘긴다(2026-10-13 결정).
//
// 오른쪽 위 문구와 "내 직무 이해 프로필"은 세션2 진행 상태를 따른다(업무 페이지와 함께 연결, 2026-10-13).
// 앱에 "며칠차" 개념이 없어 Figma 예시의 "3일차"는 빼고 진행 단계로만 문구를 나눈다.

interface TaskCard {
  id: string
  title: string
  image: string
  // Figma에서 이 카드만 그림을 카드보다 크게 깔고 위치를 옮겨 둠(인물 구도)
  imageClass?: string
}

const TASKS: TaskCard[] = [
  {
    id: 'design_cmf',
    title: '디자인 확정 및 CMF 선정',
    image: designerArtwork,
  },
  {
    id: 'spec_vendor',
    title: '시방서 작성 및 외부업체 선정',
    image: designerArtwork,
  },
  {
    id: 'site_supervision',
    title: '현장 감리',
    image: siteSupervisionArtwork,
    imageClass: 'absolute top-[-8px] left-[-35px] h-[350px] w-[622px] max-w-none',
  },
  {
    id: 'job_overview_1',
    title: '생활 가전 제품 디자이너',
    image: designerArtwork,
  },
  {
    id: 'job_overview_2',
    title: '생활 가전 제품 디자이너',
    image: designerArtwork,
  },
]

const CARD_STEP = 430 + 12 // 카드 너비 + 간격

// 카드 높이에 맞춰 리포트 프로필 축 중 앞의 3개만 보여준다(종합 리포트에는 전부 나온다)
const PROFILE_AXES_SHOWN = 3

function progressLine(started: boolean, finished: boolean) {
  if (finished) return '다른 업무도 체험해 볼까요?'
  if (started) return '업무를 이어서 할까요?'
  return '첫 업무를 시작해 볼까요?'
}

function Dot() {
  return <img src={dotIcon} alt="" width={3} height={3} className="size-[3px]" />
}

function ArrowButton({ direction, onClick, disabled }: { direction: 'prev' | 'next'; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? '이전 업무' : '다음 업무'}
      className={`absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-[rgba(142,142,142,0.5)] transition-opacity disabled:pointer-events-none disabled:opacity-0 focus-visible:outline-2 focus-visible:outline-green-700 ${
        direction === 'prev'
          ? '-left-[22px] border-[rgba(179,179,179,0.5)] backdrop-blur-[3px]'
          : '-right-[22px] border-[rgba(179,179,179,0.25)] backdrop-blur-[1px]'
      }`}
    >
      <img src={arrowIcon} alt="" width={24} height={24} className={`size-6 ${direction === 'next' ? 'rotate-180' : ''}`} />
    </button>
  )
}

function PanelTitle({ children }: { children: string }) {
  return <h2 className="text-title-lg font-semibold whitespace-nowrap text-green-50">{children}</h2>
}

export function Explore({ onOpenJob }: { onOpenJob: () => void }) {
  const currentStage = useSession((s) => s.currentStage)
  const report = useSession((s) => s.report)
  const profile: ProfileAxis[] = report?.profile.slice(0, PROFILE_AXES_SHOWN) ?? []
  const trackRef = useRef<HTMLUListElement>(null)
  const [scroll, setScroll] = useState({ atStart: true, atEnd: false })

  const updateEdges = () => {
    const el = trackRef.current
    if (!el) return
    setScroll({
      atStart: el.scrollLeft <= 1,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    })
  }

  const move = (direction: 1 | -1) => {
    trackRef.current?.scrollBy({
      left: direction * CARD_STEP,
      behavior: 'smooth',
    })
  }

  const openTask = (task: TaskCard) => {
    track('task_select', { task: task.id })
    onOpenJob()
  }

  return (
    <div className="flex h-svh gap-[clamp(24px,3.1vw,54px)] overflow-hidden bg-neutral-950 pt-[clamp(24px,5svh,56px)] pr-[clamp(32px,3.1vw,54px)] pb-[clamp(16px,3svh,32px)] pl-8">
      <Sidebar active="home" />

      {/* 위쪽(제목·카드 줄·설명)은 고정 높이, 아래 카드 3개가 남는 높이를 나눠 쓴다 — 페이지는 스크롤되지 않는다 */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-[clamp(12px,3svh,48px)] pt-[clamp(0px,4svh,48px)]">
        <div className="flex shrink-0 flex-col gap-[clamp(12px,3svh,32px)]">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="text-display-lg font-medium tracking-[-0.12px] text-green-400">생활 가전 제품 디자이너</h1>
            <p className="text-headline-md font-semibold text-neutral-300">{progressLine(currentStage !== 'brief', Boolean(report))}</p>
          </header>

          <div className="relative">
            <ul
              ref={trackRef}
              onScroll={updateEdges}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="업무 목록"
            >
              {TASKS.map((task) => (
                <li key={task.id} className="shrink-0 snap-start">
                  <button
                    type="button"
                    onClick={() => openTask(task)}
                    className="group relative block h-[clamp(160px,27.7svh,310px)] w-[clamp(240px,38.5svh,430px)] overflow-clip rounded-lg bg-neutral-800 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
                  >
                    <img src={task.image} alt="" width={1200} height={675} className={task.imageClass ?? 'h-[318px] w-full rounded-[4px] object-cover'} />
                    <span className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.5)_1.774%,rgba(0,0,0,0)_56.129%)]" />
                    <span className="absolute top-6 left-6 text-headline-md font-semibold text-green-50">{task.title}</span>
                    {/* Figma "Selected" 효과(흰색 안쪽 빛) — 가리키거나 키보드로 고른 카드 */}
                    <span className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 shadow-[inset_0_0_30px_20px_white] transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                  </button>
                </li>
              ))}
            </ul>
            {/* 양끝이 배경으로 스며드는 그라데이션 */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-[100px] bg-[linear-gradient(to_left,rgba(44,44,44,0),#2c2c2c_106%)]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[100px] bg-[linear-gradient(to_right,rgba(44,44,44,0),#2c2c2c_106%)]" />
            <ArrowButton direction="prev" onClick={() => move(-1)} disabled={scroll.atStart} />
            <ArrowButton direction="next" onClick={() => move(1)} disabled={scroll.atEnd} />
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex gap-2">
              <span className="flex items-center gap-2 rounded-[15px] bg-green-500 px-2 py-1 text-body-lg text-green-900">
                <img src={fieldIcon} alt="" width={20} height={20} className="size-5" />
                <span className="flex items-center gap-1">
                  문화
                  <Dot />
                  예술
                </span>
              </span>
              <span className="flex items-center gap-2 rounded-[15px] bg-green-500 px-2 py-1 text-body-lg text-green-900">
                <img src={durationIcon} alt="" width={20} height={20} className="size-5" />
                <span className="flex items-center gap-1">
                  2주일
                  <Dot />
                  매일 2시간
                </span>
              </span>
            </div>
            <p className="text-title-lg text-neutral-500">
              C 가전회사에서 초임 디자이너로 근무하고 있는 심재현씨가 되어 인하우스 디자인 업무를 체험해보세요.
              <br />
              탁상형 공기청정기 제품 기획부터 아이데이션, 시각화, 설계, 양산 프로젝트 사후 관리까지 모두 시뮬레이션할 수 있어요.
            </p>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-3 gap-4">
          <section className="flex min-h-0 flex-col justify-between gap-[clamp(8px,2svh,24px)] overflow-hidden rounded-lg bg-[rgba(44,44,44,0.75)] p-[clamp(16px,2.2svh,24px)] shadow-gnb backdrop-blur-gnb">
            <PanelTitle>이번에 경험한 업무</PanelTitle>
            <img src={reportStack} alt="" width={874} height={530} className="min-h-0 w-full flex-1 object-contain object-bottom" />
          </section>
          <section className="flex min-h-0 flex-col justify-between gap-[clamp(8px,2svh,24px)] overflow-hidden rounded-lg bg-[rgba(44,44,44,0.75)] p-[clamp(16px,2.2svh,24px)] shadow-gnb backdrop-blur-gnb">
            <PanelTitle>체험해 볼 만한 유사한 업무</PanelTitle>
            <img src={reportStack} alt="" width={874} height={530} className="min-h-0 w-full flex-1 object-contain object-bottom" />
          </section>
          <section className="flex min-h-0 flex-col justify-between gap-[clamp(8px,2svh,24px)] overflow-hidden rounded-lg bg-[rgba(44,44,44,0.75)] p-[clamp(16px,2.2svh,24px)] shadow-gnb backdrop-blur-gnb">
            <div className="flex flex-col gap-1">
              <PanelTitle>내 직무 이해 프로필</PanelTitle>
              <p className="text-body-lg text-neutral-400">사용자 패턴에서 반복적으로 나타난 판단, 협업 성향을 보여줍니다.</p>
            </div>
            {profile.length > 0 ? (
              <div className="flex min-h-0 flex-col gap-[clamp(12px,2.2svh,24px)] overflow-y-auto pt-1">
                {profile.map((axis) => (
                  <ProfileMeter key={axis.caption} {...axis} />
                ))}
              </div>
            ) : (
              // 업무를 끝내기 전 — 온보딩 화면(2217:9726)의 빈 프로필 안내 문구를 쓴다
              <p className="text-body-md leading-[1.6] text-neutral-500">
                아직은 빈 프로필이에요.
                <br />
                업무 속 선택이 쌓이면 나의 성향을 확인할 수 있어요.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
