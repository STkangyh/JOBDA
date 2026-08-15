import type { SpecDraft } from '../types'
import { Button } from './Button'

interface Props {
  value: SpecDraft
  onChange: (fields: Partial<SpecDraft>) => void
  onSubmit: () => void
  submitLabel: string
}

const FIELDS: { key: keyof SpecDraft; label: string; placeholder: string }[] = [
  { key: 'size', label: '사이즈', placeholder: '예: 가로 220 x 세로 340 x 두께 18mm' },
  { key: 'method', label: '제작 방식', placeholder: '예: 오크 원목 밴딩, 오일 마감' },
  { key: 'cmf', label: 'CMF', placeholder: '예: Color 내추럴 오크 / Material 원목 / Finish 오일' },
  { key: 'colorChip', label: '컬러칩', placeholder: '예: 오크 내추럴 #4' },
]

export function SpecForm({ value, onChange, onSubmit, submitLabel }: Props) {
  const requiredMissing = FIELDS.some((f) => !value[f.key].toString().trim())

  return (
    <div className="flex flex-col gap-4">
      {FIELDS.map((f) => (
        <label key={f.key} className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-500">{f.label}</span>
          <input
            value={value[f.key] as string}
            onChange={(e) => onChange({ [f.key]: e.target.value })}
            placeholder={f.placeholder}
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
      ))}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.limitSampleAttached}
          onChange={(e) => onChange({ limitSampleAttached: e.target.checked })}
        />
        <span>한도 견본 판정표 별첨함</span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-500">관계부서 전달사항 (선택)</span>
        <textarea
          value={value.vendorNotes}
          onChange={(e) => onChange({ vendorNotes: e.target.value })}
          rows={3}
          className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>

      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={requiredMissing}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
