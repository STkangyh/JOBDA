import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import sceneWelcome from '../../assets/illustrations/session2-brief-1-welcome.png'
import sceneProduct from '../../assets/illustrations/session2-brief-2-product.png'
import sceneProblem from '../../assets/illustrations/session2-brief-3-problem.png'
import sceneRequirements from '../../assets/illustrations/session2-brief-4-requirements.png'
import sceneFlow from '../../assets/illustrations/session2-brief-6-flow.png'
import sceneCollaborators from '../../assets/illustrations/session2-brief-7-collaborators.png'
import { ChapterProgress, DialogueBox, GlassChipButton, RoundArrowButton } from '../../components/StoryControls'
import { useSession } from '../../store/session'
import { ExitConfirm, type ExitAnswer } from '../../components/ExitConfirm'
import { track, useTrackView } from '../../lib/analytics'

// Figma 라벨 원문은 "Misson" — 오타라 Mission으로 고침(2026-10-12 확인).
const CHAPTERS = ['Your Role', 'Background', 'Mission', 'Session Flow'] as const

interface Scene {
  chapter: number
  image: string | null
  lines: [string, string]
}

// Figma Desktop-230~236, 238. 대사는 디자인 원문 그대로(6번 장면 쉼표 없음도 원문 유지 — 2026-10-12 확인).
// 4·5번 장면은 같은 요구사항 보드 그림을 쓴다. 마지막 장면은 그림 없이 진행 막대가 모두 채워진다.
const SCENES: Scene[] = [
  { chapter: 0, image: sceneWelcome, lines: ['김기럭 사원님 반가워요. 저는 앞으로 사원님의 회사 생활', '전반을 도울 생활 가전 부서 선임 디자이너 고프로예요.'] },
  { chapter: 1, image: sceneProduct, lines: ['이번에 다룰 제품은 탁상용 공기청정기예요.', '오크 원목을 하우징 소재로 사용할 예정이에요.'] },
  { chapter: 1, image: sceneProblem, lines: ['문제는 회사 공장에는 목재 접합 설비가 없어서', '외주 업체에 맡기거나 CMF를 변경해야 하는 상황이에요.'] },
  { chapter: 2, image: sceneRequirements, lines: ['설계팀 이관 일정은 12일 뒤에요. 먼저 지금까지 회의 내용을', '바탕으로 설계팀에 넘길 디자인 시방서를 작성해 주세요.'] },
  { chapter: 2, image: sceneRequirements, lines: ['이어서 양산에 필요한 생산 공정을 확인하고, 적절한 외주 업체를 찾아주세요.', '적합한 후보군 3사를 조사하고, 없다면 CMF 변경 건도 함께 고려해 주세요.'] },
  { chapter: 3, image: sceneFlow, lines: ['실무 체험은 시방서 초안 작성으로 시작하여 피드백에 따른', '시방서 수정 외주 업체 컨택 순서로 진행될 예정이에요.'] },
  { chapter: 3, image: sceneCollaborators, lines: ['다음은 함께 일하게 될 협업 관계자예요. 얼굴 익혀두시고 궁금한', '사항은 워크스페이스 우측에 위치한 메신저에 질문을 남겨주세요.'] },
  { chapter: CHAPTERS.length, image: null, lines: ['지금 나눈 대화는 워크스페이스 Flow Mode 화면 앞부분에서', '다시 확인할 수 있어요. 그럼 업무를 시작해볼까요?'] },
]

const LAST = SCENES.length - 1
// Skip 뒤 막대가 다 찬 모습을 보여주는 시간
const SKIP_HOLD_MS = 600

// 배경: Figma 프레임의 방사형 그라데이션(중심 #CACACA → 가장자리 #E1E1E1, 반지름 = 화면의 63%)
const BACKGROUND = 'radial-gradient(63.1% 63.1% at 50% 50%, #cacaca 0%, #e1e1e1 100%)'

export function Brief() {
  const goTo = useSession((s) => s.goTo)
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  // 장면 중간에 Skip을 누르면 진행 막대를 끝까지 채운 뒤 업무 화면으로 넘어간다 —
  // Figma Desktop-239·240(브리프 재생 중간에 메인 화면으로 나가려는 경우, 2026-11-02 확인): Skip만 남고 막대가 모두 찬 모습.
  const [skipping, setSkipping] = useState(false)
  const scene = SCENES[index]
  const isLast = index === LAST
  useTrackView({ kind: 'panel', name: `brief_scene:${index + 1}` })

  const prev = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(LAST, i + 1))

  // Skip(장면 중간) · Next(마지막 장면) 모두 자료탐색으로 — 끝까지 봤는지는 via로 구분한다.
  const finish = (via: 'skip' | 'next') => {
    track('step_complete', { step: 'brief', via, scene: index + 1 })
    if (via === 'next') return goTo('materials')
    setSkipping(true)
  }
  useEffect(() => {
    if (!skipping) return
    const id = window.setTimeout(() => goTo('materials'), SKIP_HOLD_MS)
    return () => window.clearTimeout(id)
  }, [skipping, goTo])

  // UT의 "명시적 종료" — 관리자 페이지에서 세션 상태가 '명시적 종료'로 집계된다.
  // 업무 화면 ✕와 같이 확인 창에서 "나가기"를 눌렀을 때만 기록한다(2026-11-02).
  const [confirmExit, setConfirmExit] = useState(false)
  const stay = useCallback(() => {
    track('exit_confirm', { step: 'brief', action: 'stay' })
    setConfirmExit(false)
  }, [])
  const exit = ({ reasons, note }: ExitAnswer) => {
    track('session_exit', { step: 'brief', scene: index + 1, reasons, ...(note && { note }) })
    navigate('/explore')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(LAST, i + 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // 다음 장면 그림을 미리 받아 전환할 때 빈 화면이 보이지 않게 한다.
  useEffect(() => {
    const upcoming = SCENES[index + 1]?.image
    if (upcoming) new Image().src = upcoming
  }, [index])

  return (
    <div className="relative min-h-svh overflow-hidden" style={{ backgroundImage: BACKGROUND }}>
      {scene.image && (
        <div className="pointer-events-none absolute inset-x-0 top-[160px] bottom-[128px] flex items-end justify-center">
          <img
            key={scene.image}
            src={scene.image}
            alt=""
            width={1728}
            height={1117}
            className="h-full max-h-[789px] w-auto max-w-[min(1220px,100%)] object-contain motion-safe:animate-story-fade"
          />
        </div>
      )}

      <div className="absolute top-0 right-0 flex items-center gap-3 px-8 pt-[54px]">
        {!skipping && (
          <GlassChipButton
            tone="exit"
            onClick={() => {
              track('exit_confirm', { step: 'brief', action: 'open' })
              setConfirmExit(true)
            }}
          >
            Exit
          </GlassChipButton>
        )}
        {isLast && !skipping ? (
          <GlassChipButton tone="next" onClick={() => finish('next')}>
            Next
          </GlassChipButton>
        ) : (
          <GlassChipButton onClick={() => !skipping && finish('skip')}>Skip</GlassChipButton>
        )}
      </div>

      {/* 첫 장면에는 ← 이전, 마지막 장면에는 → 다음을 숨긴다(2026-10-13 결정). 마지막 장면의 진행은 Next 버튼으로. */}
      {index > 0 && !skipping && <RoundArrowButton direction="prev" onClick={prev} className="absolute top-[calc(50%-10.5px)] left-8 -translate-y-1/2" />}
      {!isLast && !skipping && <RoundArrowButton direction="next" onClick={next} className="absolute top-[calc(50%-10.5px)] right-8 -translate-y-1/2" />}

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 px-[clamp(32px,7.58vw,131px)] pb-8">
        <ChapterProgress chapters={CHAPTERS} current={skipping ? CHAPTERS.length : scene.chapter} />
        <DialogueBox>
          <p>{scene.lines[0]}</p>
          <p>{scene.lines[1]}</p>
        </DialogueBox>
        <p className="sr-only">
          {index + 1} / {SCENES.length}
        </p>
      </div>
      <ExitConfirm open={confirmExit} onStay={stay} onLeave={exit} />
    </div>
  )
}
