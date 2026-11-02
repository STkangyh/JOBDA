import { useEffect, useRef, useState } from 'react'
import { Text } from './Text'
import { ArrowUpwardIcon, WarningIcon } from './icons'
import { useSession } from '../store/session'
import { PERSONA_LABEL, PERSONA_SENDER_NAME, type Persona } from '../types'
import { track, useTrackView } from '../lib/analytics'
import { LoginRequiredError, note as apiNote } from '../api/client'
import { ChatRetentionNotice } from './ChatRetentionNotice'
import seniorAvatar from '../assets/work/avatars/senior.png'
import engineeringAvatar from '../assets/work/avatars/engineering.png'
import purchasingAvatar from '../assets/work/avatars/purchasing.png'

// 관계자 얼굴 — 디자인 시스템 이미지 에셋(2026-10-31). 메신저 칩·받은 말풍선·입력 중 표시에 붙는다.
const AVATAR: Record<Persona, string> = { senior: seniorAvatar, engineering: engineeringAvatar, purchasing: purchasingAvatar }

function Avatar({ persona, size = 32 }: { persona: Persona; size?: number }) {
  return <img src={AVATAR[persona]} alt="" width={size} height={size} className="shrink-0 rounded-full bg-neutral-50 object-cover" style={{ width: size, height: size }} />
}

// "답변 내용 노트에 저장" — 누르면 /api/note가 답변을 짧은 메모 줄로 줄여 메모장에 저장한다(2026-11-02).
// 메모할 사실이 없는 답변(되묻기 등)이면 저장하지 않고 그렇게 알려준다.
type NoteStatus = 'idle' | 'saving' | 'saved' | 'empty'
const NOTE_LABEL: Record<NoteStatus, string> = {
  idle: '답변 내용 노트에 저장',
  saving: '노트에 정리하는 중…',
  saved: '노트에 저장됨',
  empty: '저장할 내용이 없어요',
}

function NoteButton({ status, onSave }: { status: NoteStatus; onSave: () => void }) {
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={status !== 'idle'}
      aria-busy={status === 'saving' || undefined}
      className="self-start rounded-md bg-neutral-50 px-2.5 py-2 text-xs text-neutral-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:text-neutral-400"
    >
      {NOTE_LABEL[status]}
    </button>
  )
}

function formatTime(t: number): string {
  const d = new Date(t)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 세션2 "관계자 협업" 라운드 화면들(Workspace/SeniorFeedback/FinalFeedback)이 전부 같은 메신저 +
// 업무노트 패널을 쓰길래(Figma 823:53571, 823:55090, 823:55878 등 전 라운드 공통 레이아웃) 세 화면에
// 각각 베껴 넣는 대신 여기 하나로 뽑았다. 실제 채팅은 store의 chatHistory/sendMessage(진짜 백엔드
// apiChat)를 그대로 쓰고, 화면별로 다른 건 기본 활성 탭과 시나리오 인트로 문구뿐이라 props로 받는다.

// 디자인 순서: 선배 디자이너 → 설계팀 → 구매팀
const PERSONAS: Persona[] = ['senior', 'engineering', 'purchasing']

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
  // apiChat이 네트워크 오류/503(llm_unavailable)로 실패해도 store의 sendMessage는 그냥 던지기만
  // 해서, 여기서 안 잡으면 사용자는 입력만 사라지고 답장도 에러도 못 보는 채 멈춘다(백엔드
  // handler 주석의 "frontend shows a retry button" 전제가 실제로는 구현 안 돼 있었음). 실패한
  // 원문을 들고 있다가 재시도 버튼이 같은 텍스트로 다시 보낸다.
  // login: API가 로그인을 요구해서 실패함 — 재시도 대신 로그인 안내를 띄운다
  const [failed, setFailed] = useState<{ persona: Persona; text: string; login?: boolean } | null>(null)
  const chatHistory = useSession((s) => s.chatHistory)
  const sendMessage = useSession((s) => s.sendMessage)
  const savedNotes = useSession((s) => s.savedNotes)
  const savedNoteMeta = useSession((s) => s.savedNoteMeta)
  const saveNote = useSession((s) => s.saveNote)
  // 저장 중·저장할 내용 없음은 화면에서만 들고 있는다(저장된 것만 store에 남는다). 키는 답변 원문.
  const [noteStatus, setNoteStatus] = useState<Record<string, 'saving' | 'empty'>>({})
  // 보낸 메시지는 답장이 올 때까지 store에 안 들어가서(답장과 한 쌍으로 저장) 그동안 화면에서 먼저 보여준다.
  const [pending, setPending] = useState<{ persona: Persona; text: string; t: number } | null>(null)

  // Figma 823:56235("Frame 2147227201") 주석 원문: "현재 활성화된 메신저창이 아닌 다른 상대로부터
  // 메시지가 올 경우 상태 표시등 점등". intro가 defaultActive와 다른 사람 몫이면(예: 823:56196
  // Desktop-137에서 기본 탭은 설계팀인데 인트로는 선배 디자이너 것) 그 사람 탭에 안읽음 점을 켠다.
  const [unreadPersonas, setUnreadPersonas] = useState<Set<Persona>>(() =>
    intro && intro.persona !== defaultActive ? new Set([intro.persona]) : new Set(),
  )

  const history = chatHistory[active]
  useTrackView({ kind: 'tab', name: `messenger:${active}` })
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
    setFailed(null)
    setPending({ persona: active, text, t: Date.now() })
    try {
      await sendMessage(active, text)
      setPending(null)
    } catch (err) {
      // 실패해도 보낸 말풍선은 남겨 두고 그 아래에 재시도(또는 로그인 안내)를 띄운다
      setFailed({ persona: active, text, login: err instanceof LoginRequiredError })
    } finally {
      setSending(false)
    }
  }

  const statusOf = (text: string): NoteStatus => (savedNotes.includes(text) ? 'saved' : (noteStatus[text] ?? 'idle'))

  const saveAnswer = async (text: string, persona: Persona, question?: string) => {
    if (statusOf(text) !== 'idle') return
    setNoteStatus((prev) => ({ ...prev, [text]: 'saving' }))
    // 같은 관계자 메모에 이미 있는 줄은 빼고 정리하도록 넘긴다
    const existing = savedNotes.filter((n) => savedNoteMeta[n]?.persona === persona).flatMap((n) => savedNoteMeta[n]?.lines ?? [n])
    let lines: string[]
    try {
      lines = await apiNote({ speaker: PERSONA_SENDER_NAME[persona], team: PERSONA_LABEL[persona], question, reply: text, existing })
    } catch {
      // 서버에 닿지 못했을 때도 저장은 되게 — 관계자가 한 말 그대로라 틀린 메모가 되지 않는다
      lines = [text.trim()]
    }
    if (lines.length === 0) {
      setNoteStatus((prev) => ({ ...prev, [text]: 'empty' }))
      track('note_save', { actor: persona, status: 'empty' })
      return
    }
    saveNote(text, persona, lines)
    setNoteStatus((prev) => {
      const next = { ...prev }
      delete next[text]
      return next
    })
    track('note_save', { actor: persona, status: 'saved', lines: lines.length })
  }

  // store에 실제 대화가 들어온 순간 보낸 말풍선은 거기서 보여주므로 화면용 말풍선은 숨긴다(한 프레임 겹침 방지)
  const lastUser = [...history].reverse().find((m) => m.role === 'user')
  const showPending =
    pending !== null && pending.persona === active && !(lastUser && lastUser.content === pending.text && (lastUser.t ?? 0) >= pending.t)

  // Figma 823:53612 — 메신저 메시지 영역은 justify-end라 메시지가 적을 땐 위쪽이 비고 아래쪽에
  // 붙어 있다(우리가 처음엔 위에서부터 채워서 어긋났었음). overflow가 생겨도 항상 최신 메시지가
  // 보이도록 justify-end만으론 브라우저마다 스크롤 위치가 들쭉날쭉해서 직접 맨 아래로 스크롤한다.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [history.length, sending, showIntro, failed, pending])

  return (
    // 업무 페이지 새 디자인(2342:15295 등, 2026-10-31): 화면 오른쪽 끝에 붙은 회색 반투명 패널, 관계자 칩에 얼굴.
    <section data-coach="messenger" className="flex h-full min-h-0 flex-col gap-4 rounded-l-lg bg-[rgba(234,234,234,0.75)] p-8 shadow-[-4px_0_16px_rgba(0,0,0,0.04)] backdrop-blur-[6px]">
      <h2 className="text-title-lg font-semibold text-neutral-700">메신저</h2>
      <div className="flex flex-wrap gap-2">
        {PERSONAS.map((p) => {
          const isUnread = unreadPersonas.has(p)
          return (
            <button
              key={p}
              onClick={() => selectTab(p)}
              aria-pressed={active === p}
              className={`flex h-[42px] shrink-0 items-center gap-1 rounded-[80px] border-2 py-[3px] pr-3 pl-[3px] text-body-lg text-neutral-700 drop-shadow-[0_0_8px_rgba(0,0,0,0.04)] transition-colors ${
                active === p && !isUnread ? 'border-green-200 bg-green-300' : 'border-neutral-100 bg-green-50 hover:bg-green-100'
              }`}
            >
              <Avatar persona={p} />
              {isUnread && <span className="size-2 shrink-0 rounded-full bg-success-200" aria-label="새 메시지" />}
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
              <Avatar persona={intro!.persona} />
              <div className="flex max-w-[260px] flex-col gap-2 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl bg-neutral-100 px-[18px] py-3">
                <Text variant="body-md" className="whitespace-pre-line text-neutral-700">
                  {intro!.text}
                </Text>
                <div className="flex gap-2">
                  <span className="shrink-0 rounded-md bg-neutral-50 px-2.5 py-2 text-xs text-neutral-700">
                    {PERSONA_SENDER_NAME[intro!.persona]}
                  </span>
                  <NoteButton status={statusOf(intro!.text)} onSave={() => saveAnswer(intro!.text, intro!.persona)} />
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
              {m.role === 'assistant' && <Avatar persona={active} />}
              <div
                className={`flex max-w-[260px] flex-col gap-2 px-[18px] py-3 ${
                  m.role === 'user'
                    ? 'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl bg-green-300 text-green-900'
                    : 'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl bg-neutral-100 text-neutral-700'
                }`}
              >
                <Text variant="body-md">{m.content}</Text>
                {m.role === 'assistant' && (
                  <div className="flex gap-2">
                    <span className="shrink-0 rounded-md bg-neutral-50 px-2.5 py-2 text-xs text-neutral-700">
                      {PERSONA_SENDER_NAME[active]}
                    </span>
                    <NoteButton
                      status={statusOf(m.content)}
                      onSave={() => saveAnswer(m.content, active, history[i - 1]?.role === 'user' ? history[i - 1].content : undefined)}
                    />
                  </div>
                )}
              </div>
              {m.t && (
                <Text variant="caption-sm" className="shrink-0 text-[12px] text-neutral-700">
                  {formatTime(m.t)}
                </Text>
              )}
            </div>
          ))}
          {/* 이전엔 작은 회색 텍스트 한 줄("답변 작성 중...")뿐이라 실제 응답 대기(2~4초
              실측)를 잘 놓쳤다는 피드백 — 다른 관계자 말풍선과 같은 모양(rounded-br-xl 등)의
              점 3개 바운스 애니메이션으로 바꿔서 "지금 뭔가 진행 중"이 시각적으로 분명하게 함. */}
          {showPending && (
            <div className="flex flex-row-reverse items-end gap-2 self-end" data-pending>
              <div className="flex max-w-[260px] flex-col gap-2 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl bg-green-300 px-[18px] py-3 text-green-900">
                <Text variant="body-md">{pending.text}</Text>
              </div>
              <Text variant="caption-sm" className="shrink-0 text-[12px] text-neutral-700">
                {formatTime(pending.t)}
              </Text>
            </div>
          )}
          {sending && (
            <div className="flex items-end gap-2 self-start" role="status" aria-label={`${PERSONA_LABEL[active]} 답변 작성 중`}>
              <Avatar persona={active} />
              <div className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-4 py-3">
                <span className="size-2 animate-bounce rounded-full bg-neutral-600" style={{ animationDelay: '0ms' }} />
                <span className="size-2 animate-bounce rounded-full bg-neutral-600" style={{ animationDelay: '150ms' }} />
                <span className="size-2 animate-bounce rounded-full bg-neutral-600" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          {failed && failed.persona === active && failed.login && (
            <div className="flex items-center gap-2 self-start rounded-md border border-error-100 bg-error-100/20 px-3 py-2">
              <WarningIcon className="size-4 shrink-0 text-error-200" />
              <Text variant="body-sm" className="text-error-300">
                로그인해야 관계자와 대화할 수 있어요.
              </Text>
              <a href="/login" className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-medium text-error-300 transition-colors hover:bg-error-100/40">
                로그인하기
              </a>
            </div>
          )}
          {failed && failed.persona === active && !failed.login && (
            <div className="flex items-center gap-2 self-start rounded-md border border-error-100 bg-error-100/20 px-3 py-2">
              <WarningIcon className="size-4 shrink-0 text-error-200" />
              <Text variant="body-sm" className="text-error-300">
                메시지 전송에 실패했어요.
              </Text>
              <button
                type="button"
                onClick={() => {
                  track('chat_retry', { actor: failed.persona })
                  send(failed.text)
                }}
                className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-medium text-error-300 transition-colors hover:bg-error-100/40"
              >
                재시도
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Figma 823:53615 — 입력창과 안내 문구는 4px 간격으로 붙어있는 한 묶음(메시지 영역과의
          24px 간격은 바깥 Card의 gap-6가 담당). */}
      <div className="flex flex-col gap-1">
        <form
          className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
        >
          <input
            value={input}
            maxLength={300}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요"
            className="h-8 min-w-0 flex-1 bg-transparent text-title-lg text-neutral-700 placeholder:text-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="메시지 보내기"
            disabled={sending || !input.trim()}
            className="flex h-8 w-11 shrink-0 items-center justify-center rounded-[4px] bg-green-500 text-neutral-900 transition-colors disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            <ArrowUpwardIcon className="size-6" />
          </button>
        </form>
        <Text variant="caption-sm" className="text-center text-neutral-400">
          AI는 관계자의 담당 범위 안에서만 정보를 제공합니다.
        </Text>
        <ChatRetentionNotice />
      </div>
    </section>
  )
}

// ── 업무 노트 + 메신저 (업무 페이지 새 디자인 2262:12359 · 2263:16757 · 2262:12350, 디자인 시스템 Component 249, 2026-10-31) ──
// 오른쪽 칸에서 둘 중 하나만 펼친다. 접힌 쪽은 제목 막대로 남고, 업무 노트 막대에는 남은 할 일 수,
// 메신저 막대에는 접혀 있는 동안 온 메시지 수를 빨간 배지로 띄운다.
// 업무 노트는 두 탭: 업무 일정(우선순위가 붙은 할 일 카드, Remove/Done) · 메모장(대화 요약 + 저장한 답변).

export type SidePanelMode = 'messenger' | 'notes'
export type NotesTab = 'tasks' | 'memo'

interface WorkTask {
  id: string
  title: string
  priority: 1 | 2
  body: string
}

// 업무 일정은 지금 할 일을 알려주도록 단계마다 바뀐다(2026-11-02 결정). 초안 단계 카드만 Figma 원문이고,
// 나머지 단계 문구는 초안이라 팀 확인이 필요하다. id가 단계마다 달라 완료·지움 상태도 단계별로 따로 남는다.
type TaskPhase = 'draft' | 'revise' | 'direction' | 'vendor'

const WORK_TASKS: Record<TaskPhase, WorkTask[]> = {
  draft: [
    { id: 'write_spec', title: '시방서 작성하기', priority: 1, body: '마루의 CMF 선정 작업이 완료되었어요.\n설계팀 이관을 위한 시방서를 작성해요.' },
    {
      id: 'team_meeting',
      title: '업무 회의',
      priority: 2,
      body: '설계팀에 문서를 이관하기 전 디자인팀 안에서 작성한 시방서를 가지고 수정사항을 다같이 확인해요. 2번 미팅룸으로 모이세요.',
    },
  ],
  revise: [
    { id: 'revise_spec', title: '시방서 수정하기', priority: 1, body: '고프로의 피드백이 도착했어요.\n피드백을 반영해 시방서를 고친 뒤 수정안을 제출해요.' },
    { id: 'revise_ask', title: '관계부서 의견 듣기', priority: 2, body: '고치다가 막히는 부분은 메신저로 설계팀·구매팀에 물어봐요.' },
  ],
  direction: [
    { id: 'pick_direction', title: '수정 방향 정하기', priority: 1, body: '시방서를 넘긴 뒤 생산 문제가 생겼어요.\n세 가지 방향 중 하나를 골라요.' },
    { id: 'direction_ask', title: '관계부서 의견 듣기', priority: 2, body: '방향을 고르기 전에 필요한 정보를 메신저로 확인해요.' },
  ],
  vendor: [
    { id: 'research_vendors', title: '외주업체 조사하기', priority: 1, body: '외부 업체를 찾기로 했어요.\n후보 업체를 조사해 비교표를 채워요.' },
    { id: 'pick_vendor', title: '업체 선정하기', priority: 2, body: '비교표를 바탕으로 함께할 업체를 골라 구매팀에 제안해요.' },
  ],
}

function taskPhase(s: { currentStage: string; draftSubmitted: boolean; finalSubmitted: boolean }): TaskPhase {
  if (s.currentStage === 'vendor_compare') return 'vendor'
  if (s.currentStage === 'final_feedback') return 'direction'
  if (s.draftSubmitted && !s.finalSubmitted) return 'revise'
  return 'draft'
}

// Figma 메모장 카드 원문 — 체험 전에 있었던 회의 대화 요약(시나리오 자료)
const SCENARIO_MEMOS = [
  { title: '고프로와의 대화', time: '10.12.23:11', body: '상하부 하우징은 5000번대 알루미늄,\n스트랩은 가죽으로. 컬러는 미정\n토출구 커버는 목재로. 이것도 아직 미정' },
  { title: '이프로와의 대화', time: '10.13.23:11', body: '목재는 화이트 오크 원목으로 결정\n부식 방지를 위해 유성 스테인 마감으로' },
]

function Badge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null
  return (
    <span aria-label={label} className="flex h-8 min-w-8 items-center justify-center rounded-2xl bg-error-200 px-2.5 text-body-lg font-medium text-white">
      {String(count).padStart(2, '0')}
    </span>
  )
}

const BAR = 'flex h-16 shrink-0 items-center justify-between rounded-l-lg bg-[rgba(234,234,234,0.75)] px-8 text-left text-title-lg font-semibold text-neutral-700 shadow-[-4px_0_16px_rgba(0,0,0,0.04)] backdrop-blur-[6px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-green-700'

function formatMemoTime(t: number) {
  const d = new Date(t)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}.${p(d.getDate())}.${p(d.getHours())}:${p(d.getMinutes())}`
}

interface WorkSidePanelProps {
  messenger: MessengerProps
  /** 펼칠 칸·탭을 바깥에서 정할 때(예: 코치 마크가 업무 일정/메모장을 짚을 때) */
  mode?: SidePanelMode
  onModeChange?: (mode: SidePanelMode) => void
  tab?: NotesTab
  onTabChange?: (tab: NotesTab) => void
}

export function WorkSidePanel({ messenger, mode: modeProp, onModeChange, tab: tabProp, onTabChange }: WorkSidePanelProps) {
  const [modeState, setModeState] = useState<SidePanelMode>('messenger')
  const [tabState, setTabState] = useState<NotesTab>('tasks')
  const mode = modeProp ?? modeState
  const tab = tabProp ?? tabState
  const setMode = (m: SidePanelMode) => {
    setModeState(m)
    onModeChange?.(m)
    track('side_panel', { open: m })
  }
  const setTab = (t: NotesTab) => {
    setTabState(t)
    onTabChange?.(t)
  }

  const phase = useSession(taskPhase)
  const taskStatus = useSession((s) => s.workTaskStatus)
  const setWorkTaskStatus = useSession((s) => s.setWorkTaskStatus)
  const updateTask = (id: string, status: 'done' | 'removed') => {
    setWorkTaskStatus(id, status)
    track('work_task', { task: id, status })
  }
  const visibleTasks = WORK_TASKS[phase].filter((t) => taskStatus[t.id] !== 'removed')
  const pendingTasks = visibleTasks.filter((t) => taskStatus[t.id] !== 'done').length

  // 메신저가 접혀 있는 동안 도착한 답장 수
  const chatHistory = useSession((s) => s.chatHistory)
  const assistantTotal = Object.values(chatHistory).reduce((n, list) => n + list.filter((m) => m.role === 'assistant').length, 0)
  const [seenTotal, setSeenTotal] = useState(assistantTotal)
  useEffect(() => {
    if (mode === 'messenger') setSeenTotal(assistantTotal)
  }, [mode, assistantTotal])
  const unread = mode === 'notes' ? assistantTotal - seenTotal : 0

  const savedNotes = useSession((s) => s.savedNotes)
  const savedNoteMeta = useSession((s) => s.savedNoteMeta)

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {mode === 'messenger' ? (
        <button type="button" onClick={() => setMode('notes')} aria-expanded={false} className={BAR}>
          업무노트
          <Badge count={pendingTasks} label={`남은 할 일 ${pendingTasks}개`} />
        </button>
      ) : (
        <section data-coach="notes" aria-label="업무 노트" className="flex min-h-0 flex-1 flex-col gap-6 rounded-l-lg bg-[rgba(234,234,234,0.75)] p-8 shadow-[-4px_0_16px_rgba(0,0,0,0.04)] backdrop-blur-[6px]">
          <div className="flex flex-col gap-4">
            <button type="button" onClick={() => setMode('messenger')} aria-expanded className="w-fit text-title-lg font-semibold text-neutral-700">
              업무 노트
            </button>
            <div role="tablist" className="flex gap-2">
              {(
                [
                  ['tasks', '업무 일정'],
                  ['memo', '메모장'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`h-[42px] rounded-[80px] border-2 px-3 text-body-lg text-neutral-700 drop-shadow-[0_0_8px_rgba(0,0,0,0.04)] ${
                    tab === id ? 'border-green-200 bg-green-300' : 'border-neutral-100 bg-green-50 hover:bg-green-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div role="tabpanel" className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
            {tab === 'tasks' ? (
              visibleTasks.length === 0 ? (
                <p className="text-body-md text-neutral-500">남은 업무 일정이 없어요.</p>
              ) : (
                visibleTasks.map((t) => {
                  const done = taskStatus[t.id] === 'done'
                  return (
                    <article key={t.id} className={`overflow-hidden rounded-2xl bg-neutral-100 ${done ? 'opacity-60' : ''}`}>
                      <div className="flex flex-col gap-2 px-6 pt-6 pb-5">
                        <h3 className={`text-title-lg font-semibold text-neutral-900 ${done ? 'line-through' : ''}`}>{t.title}</h3>
                        <span className={`w-fit rounded-md px-2 py-0.5 text-body-md ${t.priority === 1 ? 'bg-error-200 text-white' : 'bg-error-100 text-error-300'}`}>
                          우선순위 {t.priority}
                        </span>
                        <p className="text-body-md whitespace-pre-line text-neutral-600">{t.body}</p>
                      </div>
                      <div className="flex bg-neutral-50">
                        <button type="button" onClick={() => updateTask(t.id, 'removed')} className="h-12 flex-1 text-body-lg font-medium text-neutral-500 hover:text-neutral-700">
                          Remove
                        </button>
                        <button type="button" disabled={done} onClick={() => updateTask(t.id, 'done')} className="h-12 flex-1 text-body-lg font-medium text-neutral-500 hover:text-neutral-700 disabled:text-green-800">
                          {done ? '완료' : 'Done'}
                        </button>
                      </div>
                    </article>
                  )
                })
              )
            ) : (
              <>
                {SCENARIO_MEMOS.map((m) => (
                  <article key={m.title} className="flex flex-col gap-4 rounded-2xl bg-neutral-100 px-7 py-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-title-lg font-semibold text-neutral-900">{m.title}</h3>
                      <span className="text-caption-lg text-neutral-500">{m.time}</span>
                    </div>
                    <p className="text-body-md whitespace-pre-line text-neutral-600">{m.body}</p>
                  </article>
                ))}
                {/* 메신저에서 "답변 내용 노트에 저장"한 답변 */}
                {savedNotes.map((note) => {
                  const meta = savedNoteMeta[note]
                  return (
                    <article key={note} className="flex flex-col gap-4 rounded-2xl bg-neutral-100 px-7 py-6">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-title-lg font-semibold text-neutral-900">{meta ? `${PERSONA_SENDER_NAME[meta.persona]}와의 대화` : '저장한 답변'}</h3>
                        {meta && <span className="text-caption-lg text-neutral-500">{formatMemoTime(meta.t)}</span>}
                      </div>
                      <p className="text-body-md whitespace-pre-line text-neutral-600">{meta?.lines?.length ? meta.lines.join('\n') : note}</p>
                    </article>
                  )
                })}
              </>
            )}
          </div>
        </section>
      )}

      {/* 메신저는 접혀도 대화 상대·입력 중인 글이 유지되게 숨기기만 한다 */}
      <div className={mode === 'messenger' ? 'min-h-0 flex-1' : 'hidden'}>
        <Messenger {...messenger} />
      </div>
      {mode === 'notes' && (
        <button type="button" onClick={() => setMode('messenger')} aria-expanded={false} className={BAR}>
          메신저
          <Badge count={unread} label={`새 메시지 ${unread}개`} />
        </button>
      )}
    </div>
  )
}
