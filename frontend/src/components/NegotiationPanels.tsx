import { useState } from 'react'
import { Card } from './Card'
import { Text } from './Text'
import { Button } from './Button'
import { useSession } from '../store/session'
import { PERSONA_LABEL, type Persona } from '../types'

// 세션2 "관계자 협업" 라운드 화면들(Workspace/SeniorFeedback/FinalFeedback)이 전부 같은 메신저 +
// 업무노트 패널을 쓰길래(Figma 823:53571, 823:55090, 823:55878 등 전 라운드 공통 레이아웃) 세 화면에
// 각각 베껴 넣는 대신 여기 하나로 뽑았다. 실제 채팅은 store의 chatHistory/sendMessage(진짜 백엔드
// apiChat)를 그대로 쓰고, 화면별로 다른 건 기본 활성 탭과 시나리오 인트로 문구뿐이라 props로 받는다.

const PERSONAS: Persona[] = ['engineering', 'purchasing', 'senior']

interface MessengerProps {
  /** 라운드마다 피드백을 주는 사람이 달라서(1차는 선배 디자이너, 2차는 설계팀) 화면별로 다른 탭을 기본으로 연다. */
  defaultActive?: Persona
  /**
   * Figma 823:53614 — 라운드 시작 시 이미 와있는 시나리오 세팅 메시지(예: 선배 디자이너의 첫 요청).
   * 스토어 chatHistory에는 없는 연출용 문구라 로컬에서만 보여주고 store에는 절대 밀어넣지 않는다
   * (진짜 apiChat 응답 로그와 섞이면 안 됨).
   */
  intro?: { persona: Persona; text: string }
}

export function Messenger({ defaultActive = 'senior', intro }: MessengerProps) {
  const [active, setActive] = useState<Persona>(defaultActive)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const chatHistory = useSession((s) => s.chatHistory)
  const sendMessage = useSession((s) => s.sendMessage)
  const savedNotes = useSession((s) => s.savedNotes)
  const saveNote = useSession((s) => s.saveNote)

  const history = chatHistory[active]
  const showIntro = intro && intro.persona === active

  const send = async (text: string) => {
    if (!text.trim() || sending) return
    setSending(true)
    setInput('')
    try {
      await sendMessage(active, text)
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="flex h-full flex-col gap-4 p-6">
      <Text variant="title-lg" emphasis className="text-green-900">
        메신저
      </Text>
      <div className="flex gap-2">
        {PERSONAS.map((p) => (
          <button
            key={p}
            onClick={() => setActive(p)}
            className={`shrink-0 rounded-[20px] border px-3 py-2 text-body-md font-medium transition-colors ${
              active === p
                ? 'border-green-200 bg-green-50 text-green-900'
                : 'border-neutral-200 bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
            }`}
          >
            {PERSONA_LABEL[p]}
          </button>
        ))}
      </div>
      <div className="flex h-72 flex-col gap-3 overflow-y-auto">
        {showIntro && (
          <div className="max-w-[85%] rounded-br-xl rounded-tl-xl rounded-tr-xl bg-neutral-100 px-4 py-3">
            <Text variant="body-md" className="whitespace-pre-line text-neutral-700">
              {intro!.text}
            </Text>
          </div>
        )}
        {history.length === 0 && !showIntro && (
          <Text variant="body-sm" className="text-neutral-400">
            {PERSONA_LABEL[active]}에게 궁금한 걸 질문해보세요.
          </Text>
        )}
        {history.map((m, i) => (
          <div
            key={i}
            className={`flex max-w-[85%] flex-col gap-1.5 rounded-xl px-4 py-3 ${
              m.role === 'user' ? 'ml-auto bg-green-100 text-green-900' : 'bg-neutral-100 text-neutral-900'
            }`}
          >
            <Text variant="body-md">{m.content}</Text>
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
        {sending && (
          <Text variant="body-sm" className="text-neutral-400">
            답변 작성 중...
          </Text>
        )}
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
          className="flex-1 rounded-md bg-neutral-100 px-3 py-2 text-body-md text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
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

interface WorkNotesCardProps {
  groups: { label: string; tags: string[] }[]
}

// Figma 823:53679 "업무 노트" 패널 — 세션1 store/session1.ts의 NOTE_TAGS와 같은 발상이지만
// 세션2는 자체 CMF 협상 서사(화이트 오크 흡기구 -> 목재 접합 -> 한도 견본 판정표)가 있어서
// 화면마다 그룹 내용이 달라진다(특히 CMF 결정 사항은 1차 피드백 전후로 태그가 하나 늘어남).
export function WorkNotesCard({ groups }: WorkNotesCardProps) {
  const savedNotes = useSession((s) => s.savedNotes)

  return (
    <Card className="flex flex-col gap-6 p-6">
      <Text variant="title-lg" emphasis className="text-green-900">
        업무 노트
      </Text>
      {groups.map((g) => (
        <div key={g.label} className="flex flex-col gap-3">
          <Text variant="body-lg" className="text-neutral-600">
            {g.label}
          </Text>
          <div className="flex flex-wrap gap-2.5">
            {g.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border-2 border-neutral-200 bg-neutral-100 px-3 py-2 text-body-lg text-neutral-500"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}
      {savedNotes.length > 0 && (
        <div className="flex flex-col gap-3">
          <Text variant="body-lg" className="text-neutral-600">
            저장한 답변
          </Text>
          <ul className="flex flex-col gap-2">
            {savedNotes.map((note, i) => (
              <li key={i} className="rounded-md bg-neutral-100 px-3 py-2 text-body-md text-neutral-700">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
