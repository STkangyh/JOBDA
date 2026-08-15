import { useState } from 'react'
import { useSession } from '../store/session'
import { PERSONA_LABEL, type Persona } from '../types'
import { SUGGESTED_QUESTIONS } from '../data/suggestedQuestions'
import { Button } from './Button'

const PERSONAS: Persona[] = ['senior', 'engineering', 'purchasing']

export function PersonaChat() {
  const [active, setActive] = useState<Persona>('senior')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const chatHistory = useSession((s) => s.chatHistory)
  const sendMessage = useSession((s) => s.sendMessage)

  const history = chatHistory[active]

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
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {PERSONAS.map((p) => (
          <button
            key={p}
            onClick={() => setActive(p)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              active === p
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'border border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400'
            }`}
          >
            {PERSONA_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="flex h-64 flex-col gap-2 overflow-y-auto rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
        {history.length === 0 && (
          <p className="text-sm text-neutral-400">{PERSONA_LABEL[active]}에게 궁금한 걸 질문해보세요.</p>
        )}
        {history.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'ml-auto bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && <p className="text-xs text-neutral-400">답변 작성 중...</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS[active].map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            {q}
          </button>
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
          placeholder="질문을 입력하세요 (최대 300자)"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <Button type="submit" disabled={sending || !input.trim()}>
          전송
        </Button>
      </form>
    </div>
  )
}
