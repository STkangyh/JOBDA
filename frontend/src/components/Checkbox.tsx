import { CheckIcon } from './icons'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  className?: string
}

export function Checkbox({ checked, onChange, label, className = '' }: CheckboxProps) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2.5 ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded border ${
          checked ? 'border-neutral-900 bg-neutral-900' : 'border-neutral-400 bg-white'
        }`}
      >
        {checked && <CheckIcon className="size-3.5 text-white" />}
      </span>
      {label && <span className="text-body-lg text-neutral-900">{label}</span>}
    </label>
  )
}
