import { useState } from 'react'
import { Text } from '../../components/Text'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'
import { Sidebar, type SidebarItem } from '../../components/Sidebar'
import { Indicator } from '../../components/Indicator'
import { WarningIcon, CloudSavedIcon, ProfileIcon } from '../../components/icons'
import { S1_ROUNDS, S1_PERSONA_LABEL, useSession1, type S1Persona } from '../../store/session1'

const PERSONAS: S1Persona[] = ['engineering', 'purchasing', 'senior']
// Figma 744:16874 사이드바 실측: apps/work/history(검색 아이콘 없음), work가 active.
const SIDEBAR_TOP_ITEMS: readonly SidebarItem[] = ['apps', 'work', 'history']

const NOTE_TAGS = {
  userNeeds: ['저소음', '공간 효율', '따뜻함', '관리 용이', '인테리어 오브제 느낌'],
  constraints: [
    '파팅라인 단차 0.5mm 이격할 것',
    '에어케어 제품과 내부 설계 공유',
    '전면부 하우징은 하나로',
    '나사산 위치 수정',
  ],
}

function Messenger() {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const activePersona = useSession1((s) => s.activePersona)
  const setActivePersona = useSession1((s) => s.setActivePersona)
  const chatHistory = useSession1((s) => s.chatHistory)
  const sendMessage = useSession1((s) => s.sendMessage)
  const savedNotes = useSession1((s) => s.savedNotes)
  const saveNote = useSession1((s) => s.saveNote)

  const history = chatHistory[activePersona]

  const send = async (text: string) => {
    if (!text.trim() || sending) return
    setSending(true)
    setInput('')
    sendMessage(activePersona, text)
    setSending(false)
  }

  return (
    <Card className="flex h-full flex-col gap-4 p-6">
      <Text variant="title-lg" emphasis>
        메신저
      </Text>
      <div className="flex gap-2">
        {PERSONAS.map((p) => (
          <button
            key={p}
            onClick={() => setActivePersona(p)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activePersona === p
                ? 'border border-green-200 bg-green-50 text-green-900'
                : 'border border-neutral-200 bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {S1_PERSONA_LABEL[p]}
          </button>
        ))}
      </div>
      <div className="flex h-72 flex-col gap-2 overflow-y-auto">
        {history.length === 0 && (
          <Text variant="body-sm" className="text-neutral-400">
            {S1_PERSONA_LABEL[activePersona]}에게 궁금한 걸 질문해보세요.
          </Text>
        )}
        {history.map((m, i) => (
          <div
            key={i}
            className={`flex max-w-[80%] flex-col gap-1.5 rounded-lg px-3 py-2 text-sm ${
              m.role === 'user' ? 'ml-auto bg-green-100 text-green-900' : 'bg-neutral-100 text-neutral-900'
            }`}
          >
            {m.content}
            {m.role === 'assistant' && (
              <button
                type="button"
                onClick={() => saveNote(m.content)}
                disabled={savedNotes.includes(m.content)}
                className="self-start rounded-md bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-500 transition-colors hover:bg-white hover:text-neutral-700 disabled:cursor-not-allowed disabled:text-neutral-300"
              >
                {savedNotes.includes(m.content) ? '노트에 저장됨' : '답변 내용 노트에 저장'}
              </button>
            )}
          </div>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          value={input}
          maxLength={300}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={sending || !input.trim()}>
          전송
        </Button>
      </form>
      <Text variant="caption-sm" className="text-center text-neutral-400">
        AI는 관계자의 담당 범위 안에서만 정보를 제공합니다.
      </Text>
    </Card>
  )
}

function ReviewAndChoice() {
  const currentRoundIndex = useSession1((s) => s.currentRoundIndex)
  const roundAnswers = useSession1((s) => s.roundAnswers)
  const selectChoice = useSession1((s) => s.selectChoice)
  const setReasoning = useSession1((s) => s.setReasoning)
  const submitRound = useSession1((s) => s.submitRound)

  const round = S1_ROUNDS[currentRoundIndex]
  const answer = roundAnswers[currentRoundIndex]
  // Figma 실측(744:16874 등): 1라운드 시점에 "3회 남음"으로 표시됨 — 이번 라운드까지 포함한
  // 개수. 마지막 라운드(합의 성사)에서는 기존처럼 배지 자체를 숨김.
  const remaining = S1_ROUNDS.length - currentRoundIndex
  const isLastRound = currentRoundIndex === S1_ROUNDS.length - 1

  const canSubmit = answer.selectedChoice !== null && answer.reasoning.trim().length > 0

  // Figma 744:16874 등(라운드 전환 로딩 상태) — 제출 직후 다음 라운드 내용이 채워지기 전까지
  // 짧게 로딩 표시. 실제 응답 지연은 없지만(클라이언트 계산이라 즉시 끝남) 그 순간을 재현.
  const [isSubmitting, setIsSubmitting] = useState(false)
  const handleSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      submitRound()
      setIsSubmitting(false)
    }, 1200)
  }

  return (
    <Card className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-3">
        <Text variant="title-lg" emphasis>
          {round.draftLabel}
        </Text>
        <div className="flex gap-6">
          {round.draftImage && (
            <img
              src={round.draftImage}
              alt=""
              className="h-[149px] w-[200px] shrink-0 rounded-md bg-neutral-100 object-cover"
            />
          )}
          <Text variant="body-lg" className="text-neutral-600">
            {round.draftDescription}
          </Text>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Text variant="title-lg" emphasis>
            {round.feedbackTitle}
          </Text>
          {!isLastRound && (
            <div className="flex items-end gap-1">
              <WarningIcon className={`size-5 shrink-0 text-error-200 ${isSubmitting ? 'animate-spin' : ''}`} />
              <Text variant="body-sm" className="text-neutral-400">
                가능 피드백 세션 {remaining}회 남음
              </Text>
            </div>
          )}
        </div>
        <Text variant="body-lg" className="whitespace-pre-line text-neutral-600">
          {round.feedbackText}
        </Text>
      </div>

      <div className="flex flex-col gap-3">
        <Text variant="title-lg" emphasis>
          수정 방향 선택
        </Text>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {round.choices.map((choice, i) => {
            const selected = answer.selectedChoice === i
            return (
              <button
                key={choice.label}
                onClick={() => selectChoice(i as 0 | 1)}
                className={`flex flex-col items-start gap-1 rounded-md p-5 text-left transition-colors ${
                  selected
                    ? 'bg-green-400 text-neutral-900'
                    : 'border border-neutral-200 bg-white hover:border-green-400 hover:bg-green-50'
                }`}
              >
                <Text variant="caption-lg" className={selected ? 'text-green-800' : 'text-neutral-400'}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <Text variant="title-lg" emphasis>
                  {choice.label}
                </Text>
                {choice.sublabel && (
                  <Text variant="body-md" className="text-neutral-600">
                    {choice.sublabel}
                  </Text>
                )}
                {choice.optionalNote && (
                  <Text variant="body-sm" className="text-neutral-500">
                    {choice.optionalNote}
                  </Text>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Text variant="title-lg" emphasis>
          선택 근거 입력
        </Text>
        <textarea
          value={answer.reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          rows={3}
          placeholder="이 방향을 선택한 이유를 적어주세요."
          className="rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm"
        />
      </div>

      <Button
        variant="primary"
        className="h-[72px] w-[340px] self-end !rounded-xl !text-2xl"
        disabled={!canSubmit || isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? '로딩중' : round.roundNumber === S1_ROUNDS.length ? '최종 설계안 제출' : '수정안 제출'}
      </Button>
    </Card>
  )
}

function WorkNotes() {
  const savedNotes = useSession1((s) => s.savedNotes)

  return (
    <Card className="flex flex-col gap-6 p-6">
      <Text variant="title-lg" emphasis>
        업무 노트
      </Text>
      <div>
        <Text variant="body-md" className="mb-2 text-neutral-600">
          사용자 요구
        </Text>
        <div className="flex flex-wrap gap-2">
          {NOTE_TAGS.userNeeds.map((tag) => (
            <span key={tag} className="rounded-full border-2 border-neutral-200 bg-neutral-100 px-3 py-1.5 text-sm text-neutral-600">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div>
        <Text variant="body-md" className="mb-2 text-neutral-600">
          제조 제약
        </Text>
        <div className="flex flex-wrap gap-2">
          {NOTE_TAGS.constraints.map((tag) => (
            <span key={tag} className="rounded-full border-2 border-neutral-200 bg-neutral-100 px-3 py-1.5 text-sm text-neutral-600">
              {tag}
            </span>
          ))}
        </div>
      </div>
      {savedNotes.length > 0 && (
        <div>
          <Text variant="body-md" className="mb-2 text-neutral-600">
            저장한 답변
          </Text>
          <ul className="flex flex-col gap-2">
            {savedNotes.map((note, i) => (
              <li key={i} className="rounded-md bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

const INDICATOR_STEPS_S1 = ['브리프', '자료탐색', '설계 수정1', '설계 수정2', '설계 확정', '자기 평가', '직무 리포트'] as const
// round index -> indicator label. "자료탐색"은 별도 화면(Materials)이 생겼으니 라운드 화면에서는
// 안 씀 — 이전엔 자료탐색 화면이 없어서 라운드1을 임시로 그 라벨에 매핑해뒀던 실수였음.
const ROUND_STEP_LABELS = ['설계 수정1', '설계 수정2', '설계 확정'] as const

export function Session1Workspace() {
  const currentRoundIndex = useSession1((s) => s.currentRoundIndex)
  const step = ROUND_STEP_LABELS[currentRoundIndex]

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-50 p-6">
      <Sidebar active="work" topItems={SIDEBAR_TOP_ITEMS} className="shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* Figma(744:15857 등)와 동일하게 인디케이터는 가운데 컬럼 폭에만, 저장상태/프로필
            아이콘은 우측 상단에 — 브리프에서 정리한 것과 같은 3열 헤더 행. */}
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-[340px_1fr_340px]">
          <div className="hidden lg:block" />
          <Indicator current={step} steps={INDICATOR_STEPS_S1} />
          <div className="hidden items-center justify-end gap-[18px] lg:flex">
            <div className="flex size-[50px] items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <CloudSavedIcon className="size-5" />
            </div>
            <div className="flex size-[50px] items-center justify-center rounded-full bg-neutral-900 text-neutral-50">
              <ProfileIcon className="size-5" />
            </div>
          </div>

          <Messenger />
          <ReviewAndChoice />
          <WorkNotes />
        </div>
      </div>
    </div>
  )
}
