import { useState } from 'react'
import { useSession } from '../store/session'
import { DocList } from '../components/DocList'
import { PersonaChat } from '../components/PersonaChat'
import { SpecForm } from '../components/SpecForm'

type Tab = 'docs' | 'chat' | 'spec'

export function Workspace() {
  const [tab, setTab] = useState<Tab>('docs')
  const draftSubmitted = useSession((s) => s.draftSubmitted)
  const finalSubmitted = useSession((s) => s.finalSubmitted)
  const draft = useSession((s) => s.draft)
  const final = useSession((s) => s.final)
  const updateDraft = useSession((s) => s.updateDraft)
  const updateFinal = useSession((s) => s.updateFinal)
  const submitDraft = useSession((s) => s.submitDraft)
  const submitFinal = useSession((s) => s.submitFinal)

  const editingFinal = draftSubmitted && !finalSubmitted

  const goal = !draftSubmitted
    ? '사용자 조사와 경쟁 제품 자료를 확인하고, 시방서 초안을 작성해 제출하세요.'
    : editingFinal
      ? '선임 디자이너 피드백을 반영해 시방서 최종본을 제출하세요.'
      : '다음 단계를 확인하세요.'

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md bg-neutral-100 px-4 py-2 text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
        {goal}
      </div>

      <div className="flex gap-4 border-b border-neutral-200 text-sm dark:border-neutral-800">
        {(['docs', 'chat', 'spec'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-1 pb-2 ${
              tab === t
                ? 'border-neutral-900 font-medium text-neutral-900 dark:border-white dark:text-white'
                : 'border-transparent text-neutral-400'
            }`}
          >
            {t === 'docs' ? '자료함' : t === 'chat' ? '업무 메신저' : '시방서'}
          </button>
        ))}
      </div>

      {tab === 'docs' && <DocList />}
      {tab === 'chat' && <PersonaChat />}
      {tab === 'spec' &&
        (editingFinal ? (
          <SpecForm value={final} onChange={updateFinal} onSubmit={submitFinal} submitLabel="최종본 제출" />
        ) : (
          <SpecForm value={draft} onChange={updateDraft} onSubmit={submitDraft} submitLabel="초안 검토 요청" />
        ))}
    </div>
  )
}
