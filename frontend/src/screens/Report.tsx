import { useSession } from '../store/session'
import { Button } from '../components/Button'
import type { ActionLog } from '../types'

const TYPE_LABEL: Record<ActionLog['type'], string> = {
  doc_view: '자료 열람',
  ask: '관계자 질문',
  submit: '제출',
  branch: '방향 선택',
  revise: '재작성',
}

function Section({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="mb-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-400">{empty}</p>
      ) : (
        <ul className="list-inside list-disc space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
          {items.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function Report() {
  const report = useSession((s) => s.report)
  const actionLogs = useSession((s) => s.actionLogs)
  const resetSession = useSession((s) => s.resetSession)
  const goTo = useSession((s) => s.goTo)

  if (!report) return null

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">직무 이해 리포트</h1>

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">업무 행동 타임라인</h2>
        <ol className="flex flex-col gap-1 text-sm text-neutral-500">
          {actionLogs.map((log) => (
            <li key={log.seq} className="flex gap-2">
              <span className="w-5 text-neutral-300">{log.seq}</span>
              <span>
                {TYPE_LABEL[log.type]}
                {log.target ? ` · ${log.target}` : ''}
                {log.actor ? ` · ${log.actor}` : ''}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <Section title="강점" items={report.strengths} empty="이번 체험에서 특별히 강조할 점을 찾지 못했습니다." />
      <Section title="주의점" items={report.cautions} empty="특별한 주의점은 없었습니다." />
      <Section title="추가로 고려할 수 있었던 요소" items={report.missed} empty="놓친 요소가 없었습니다." />

      <p className="text-xs text-neutral-400">
        디자인 외에도 설계·원가 조율이 제품디자이너 업무의 핵심입니다. 반복 수정과 이해관계자 조율은 실제
        업무에서도 반복되는 과정입니다.
      </p>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => goTo('home')}>
          홈으로
        </Button>
        <Button onClick={() => resetSession()}>다시 체험하기</Button>
      </div>
    </div>
  )
}
