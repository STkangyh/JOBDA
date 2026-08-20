import { useEffect, useRef, useState } from 'react'
import { Card } from './Card'
import { Text } from './Text'
import { ArrowUpwardIcon } from './icons'
import { useSession } from '../store/session'
import { PERSONA_LABEL, PERSONA_SENDER_NAME, type Persona } from '../types'

function formatTime(t: number): string {
  const d = new Date(t)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

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

  // Figma 823:56235("Frame 2147227201") 주석 원문: "현재 활성화된 메신저창이 아닌 다른 상대로부터
  // 메시지가 올 경우 상태 표시등 점등". intro가 defaultActive와 다른 사람 몫이면(예: 823:56196
  // Desktop-137에서 기본 탭은 설계팀인데 인트로는 선배 디자이너 것) 그 사람 탭에 안읽음 점을 켠다.
  const [unreadPersonas, setUnreadPersonas] = useState<Set<Persona>>(() =>
    intro && intro.persona !== defaultActive ? new Set([intro.persona]) : new Set(),
  )

  const history = chatHistory[active]
  const showIntro = intro && intro.persona === active
  const scrollRef = useRef<HTMLDivElement>(null)

  const selectTab = (p: Persona) => {
    setActive(p)
    setUnreadPersonas((prev) => {
      if (!prev.has(p)) return prev
      const next = new Set(prev)
      next.delete(p)
      return next
    })
  }

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

  // Figma 823:53612 — 메신저 메시지 영역은 justify-end라 메시지가 적을 땐 위쪽이 비고 아래쪽에
  // 붙어 있다(우리가 처음엔 위에서부터 채워서 어긋났었음). overflow가 생겨도 항상 최신 메시지가
  // 보이도록 justify-end만으론 브라우저마다 스크롤 위치가 들쭉날쭉해서 직접 맨 아래로 스크롤한다.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [history.length, sending, showIntro])

  return (
    <Card className="flex h-full max-h-[1400px] flex-col gap-6 p-6">
      <Text variant="title-lg" emphasis className="text-green-900">
        메신저
      </Text>
      <div className="flex gap-2">
        {PERSONAS.map((p) => {
          const isUnread = unreadPersonas.has(p)
          return (
            <button
              key={p}
              onClick={() => selectTab(p)}
              className={`flex shrink-0 items-center gap-2 rounded-[20px] border px-3 py-2 text-body-md font-medium transition-colors ${
                isUnread
                  ? 'border-neutral-200 bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                  : active === p
                    ? 'border-green-200 bg-green-50 text-green-900'
                    : 'border-neutral-200 bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }`}
            >
              {isUnread && <span className="size-2 shrink-0 rounded-full bg-success-200" />}
              {PERSONA_LABEL[p]}
            </button>
          )
        })}
      </div>
      {/* flex-col + justify-end를 스크롤 컨테이너에 직접 걸면(예전 방식) 크로미움에서
          overflow가 생겨도 scrollHeight가 clientHeight와 같게 보고돼 스크롤이 막힌다 — 스크롤은
          바깥의 평범한 overflow-y-auto 블록이 담당하고, justify-end(짧을 때 아래 정렬)는 안쪽
          min-h-full 래퍼에게 넘긴다. 넘치면 min-h-full은 컨텐츠 실제 높이로 자라 justify-end가
          무력화되고 위에서 아래로 자연스럽게 쌓여 스크롤이 정상 동작한다. */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col justify-end gap-3">
          {showIntro && (
            <div className="flex items-end gap-2 self-start">
              <div className="flex max-w-[85%] flex-col gap-2 rounded-br-xl rounded-tl-xl rounded-tr-xl bg-neutral-100 px-4 py-3">
                <Text variant="body-md" className="whitespace-pre-line text-neutral-700">
                  {intro!.text}
                </Text>
                <div className="flex gap-2">
                  <span className="shrink-0 rounded-md bg-neutral-50 px-2.5 py-2 text-xs text-neutral-500">
                    {PERSONA_SENDER_NAME[intro!.persona]}
                  </span>
                  <button
                    type="button"
                    onClick={() => saveNote(intro!.text)}
                    disabled={savedNotes.includes(intro!.text)}
                    className="self-start rounded-md bg-neutral-50 px-2.5 py-2 text-xs text-neutral-500 transition-colors hover:bg-white hover:text-neutral-700 disabled:cursor-not-allowed disabled:text-neutral-300"
                  >
                    {savedNotes.includes(intro!.text) ? '노트에 저장됨' : '답변 내용 노트에 저장'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {history.length === 0 && !showIntro && (
            <Text variant="body-sm" className="text-neutral-400">
              {PERSONA_LABEL[active]}에게 궁금한 걸 질문해보세요.
            </Text>
          )}
          {history.map((m, i) => (
            <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'flex-row-reverse self-end' : 'self-start'}`}>
              <div
                className={`flex max-w-[85%] flex-col gap-2 px-4 py-3 ${
                  m.role === 'user'
                    ? 'rounded-bl-xl rounded-tl-xl rounded-tr-xl bg-green-100 text-green-900'
                    : 'rounded-br-xl rounded-tl-xl rounded-tr-xl bg-neutral-100 text-neutral-900'
                }`}
              >
                <Text variant="body-md">{m.content}</Text>
                {m.role === 'assistant' && (
                  <div className="flex gap-2">
                    <span className="shrink-0 rounded-md bg-neutral-50 px-2.5 py-2 text-xs text-neutral-500">
                      {PERSONA_SENDER_NAME[active]}
                    </span>
                    <button
                      type="button"
                      onClick={() => saveNote(m.content)}
                      disabled={savedNotes.includes(m.content)}
                      className="self-start rounded-md bg-neutral-50 px-2.5 py-2 text-xs text-neutral-500 transition-colors hover:bg-white hover:text-neutral-700 disabled:cursor-not-allowed disabled:text-neutral-300"
                    >
                      {savedNotes.includes(m.content) ? '노트에 저장됨' : '답변 내용 노트에 저장'}
                    </button>
                  </div>
                )}
              </div>
              {m.t && (
                <Text variant="caption-sm" className="shrink-0 text-neutral-400">
                  {formatTime(m.t)}
                </Text>
              )}
            </div>
          ))}
          {sending && (
            <Text variant="body-sm" className="text-neutral-400">
              답변 작성 중...
            </Text>
          )}
        </div>
      </div>
      {/* Figma 823:53615 — 입력창과 안내 문구는 4px 간격으로 붙어있는 한 묶음(메시지 영역과의
          24px 간격은 바깥 Card의 gap-6가 담당). */}
      <div className="flex flex-col gap-1">
        <form
          className="flex h-[50px] items-center justify-between gap-2 rounded-[4px] bg-neutral-100 py-[9px] pl-3 pr-[9px]"
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
            className="h-full flex-1 bg-transparent text-body-lg text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex h-8 w-11 shrink-0 items-center justify-center rounded-[4px] bg-neutral-400 text-white transition-colors disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            <ArrowUpwardIcon className="size-6" />
          </button>
        </form>
        <Text variant="caption-sm" className="text-center text-neutral-400">
          AI는 관계자의 담당 범위 안에서만 정보를 제공합니다.
        </Text>
      </div>
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

  // h-full: 라운드/피드백 화면에서 Messenger와 나란한 그리드 칸에 바로 들어갈 때 행 높이만큼
  // 늘어나게 함. flex-1: Workspace.tsx처럼 "초안 제출" 버튼과 flex-col로 한 칸을 나눠 쓸 때는
  // flex-basis가 h-full보다 우선이라 남는 공간만 채우고 버튼을 밀어내지 않는다.
  return (
    <Card className="flex h-full flex-1 flex-col gap-6 p-6">
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
