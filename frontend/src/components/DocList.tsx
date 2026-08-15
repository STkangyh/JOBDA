import { useState } from 'react'
import { DOCS } from '../data/docs'
import { useSession } from '../store/session'

export function DocList() {
  const viewDoc = useSession((s) => s.viewDoc)
  const viewedDocs = useSession((s) => s.viewedDocs)
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (key: string) => {
    setSelected(key)
    if (!viewedDocs[key]) viewDoc(key)
  }

  const selectedDoc = DOCS.find((d) => d.key === selected)

  return (
    <div className="grid grid-cols-2 gap-4">
      <ul className="flex flex-col gap-1">
        {DOCS.map((doc) => (
          <li key={doc.key}>
            <button
              onClick={() => handleSelect(doc.key)}
              className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                selected === doc.key
                  ? 'border-neutral-900 dark:border-white'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              <div className="text-xs text-neutral-400">{doc.category}</div>
              <div className="text-neutral-900 dark:text-neutral-100">{doc.title}</div>
              {!viewedDocs[doc.key] && <span className="text-xs text-amber-600">미열람</span>}
            </button>
          </li>
        ))}
      </ul>
      <div className="rounded-md border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        {selectedDoc ? (
          <>
            <h3 className="mb-2 font-medium text-neutral-900 dark:text-neutral-100">{selectedDoc.title}</h3>
            <p className="text-neutral-600 dark:text-neutral-400">{selectedDoc.body}</p>
          </>
        ) : (
          <p className="text-neutral-400">왼쪽에서 자료를 선택하세요.</p>
        )}
      </div>
    </div>
  )
}
