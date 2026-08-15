import { useState } from 'react'
import { Text } from '../components/Text'
import { Chip } from '../components/Chip'
import { Checkbox } from '../components/Checkbox'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import {
  PlusIcon,
  ShareIcon,
  CancelIcon,
  CheckIcon,
  ChevronDownIcon,
  DeleteIcon,
  EditIcon,
  SearchIcon,
  ProfileIcon,
  ImageIcon,
  MoreIcon,
} from '../components/icons'

const NEUTRAL_STEPS = [50, 75, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
const NEUTRAL_BG: Record<(typeof NEUTRAL_STEPS)[number], string> = {
  50: 'bg-neutral-50',
  75: 'bg-neutral-75',
  100: 'bg-neutral-100',
  200: 'bg-neutral-200',
  300: 'bg-neutral-300',
  400: 'bg-neutral-400',
  500: 'bg-neutral-500',
  600: 'bg-neutral-600',
  700: 'bg-neutral-700',
  800: 'bg-neutral-800',
  900: 'bg-neutral-900',
  950: 'bg-neutral-950',
}
const PRIMARY_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const
const PRIMARY_BG: Record<(typeof PRIMARY_STEPS)[number], string> = {
  50: 'bg-primary-50',
  100: 'bg-primary-100',
  200: 'bg-primary-200',
  300: 'bg-primary-300',
  400: 'bg-primary-400',
  500: 'bg-primary-500',
  600: 'bg-primary-600',
  700: 'bg-primary-700',
  800: 'bg-primary-800',
  900: 'bg-primary-900',
}
const SUCCESS_STEPS = [100, 200, 300, 400] as const
const SUCCESS_BG: Record<(typeof SUCCESS_STEPS)[number], string> = {
  100: 'bg-success-100',
  200: 'bg-success-200',
  300: 'bg-success-300',
  400: 'bg-success-400',
}
const ERROR_STEPS = [100, 200, 300, 400] as const
const ERROR_BG: Record<(typeof ERROR_STEPS)[number], string> = {
  100: 'bg-error-100',
  200: 'bg-error-200',
  300: 'bg-error-300',
  400: 'bg-error-400',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-neutral-300 pt-8">
      <Text variant="title-lg" emphasis>
        {title}
      </Text>
      {children}
    </section>
  )
}

function Swatch({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`size-10 rounded border border-neutral-300 ${className}`} />
      <Text variant="caption-sm" className="text-neutral-600">
        {label}
      </Text>
    </div>
  )
}

const ICONS = [
  { name: 'Plus', Icon: PlusIcon },
  { name: 'Share', Icon: ShareIcon },
  { name: 'Cancel', Icon: CancelIcon },
  { name: 'Check', Icon: CheckIcon },
  { name: 'ChevronDown', Icon: ChevronDownIcon },
  { name: 'Delete', Icon: DeleteIcon },
  { name: 'Edit', Icon: EditIcon },
  { name: 'Search', Icon: SearchIcon },
  { name: 'Profile', Icon: ProfileIcon },
  { name: 'Image', Icon: ImageIcon },
  { name: 'More', Icon: MoreIcon },
]

export function DesignSystem() {
  const [checked, setChecked] = useState(true)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10">
      <div>
        <Text variant="display-md" emphasis>
          Design System
        </Text>
        <Text variant="body-md" className="text-neutral-600">
          Figma "Design System" (node 391:589) 기준 토큰/컴포넌트. src/index.css의 @theme과
          src/components/를 그대로 반영합니다.
        </Text>
      </div>

      <Section title="Colors">
        <div className="flex flex-col gap-4">
          <div>
            <Text variant="body-sm" className="mb-2 text-neutral-600">
              Neutral
            </Text>
            <div className="flex flex-wrap gap-2">
              {NEUTRAL_STEPS.map((s) => (
                <Swatch key={s} label={String(s)} className={NEUTRAL_BG[s]} />
              ))}
            </div>
          </div>
          <div>
            <Text variant="body-sm" className="mb-2 text-neutral-600">
              Primary
            </Text>
            <div className="flex flex-wrap gap-2">
              {PRIMARY_STEPS.map((s) => (
                <Swatch key={s} label={String(s)} className={PRIMARY_BG[s]} />
              ))}
            </div>
          </div>
          <div>
            <Text variant="body-sm" className="mb-2 text-neutral-600">
              Success
            </Text>
            <div className="flex flex-wrap gap-2">
              {SUCCESS_STEPS.map((s) => (
                <Swatch key={s} label={String(s)} className={SUCCESS_BG[s]} />
              ))}
            </div>
          </div>
          <div>
            <Text variant="body-sm" className="mb-2 text-neutral-600">
              Error
            </Text>
            <div className="flex flex-wrap gap-2">
              {ERROR_STEPS.map((s) => (
                <Swatch key={s} label={String(s)} className={ERROR_BG[s]} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-2">
          <Text variant="display-xl">Display XL — Emphasis only</Text>
          <Text variant="display-lg" emphasis>
            Display LG
          </Text>
          <Text variant="display-md">Display MD (Baseline)</Text>
          <Text variant="headline-lg" emphasis>
            Headline LG
          </Text>
          <Text variant="headline-md">Headline MD (Baseline)</Text>
          <Text variant="title-lg" emphasis>
            Title LG
          </Text>
          <Text variant="title-md">Title MD (Baseline)</Text>
          <Text variant="title-md" emphasis>
            Title MD (Emphasis — semibold)
          </Text>
          <Text variant="body-lg">Body LG (Baseline)</Text>
          <Text variant="body-md" emphasis>
            Body MD (Emphasis)
          </Text>
          <Text variant="body-sm" className="text-neutral-600">
            Body SM muted
          </Text>
          <Text variant="caption-lg" className="text-neutral-600">
            Caption LG
          </Text>
          <Text variant="caption-sm" className="text-neutral-600">
            Caption SM
          </Text>
        </div>
      </Section>

      <Section title="Icons">
        <div className="flex flex-wrap gap-6 text-neutral-900">
          {ICONS.map(({ name, Icon }) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <Icon className="size-5" />
              <Text variant="caption-sm" className="text-neutral-600">
                {name}
              </Text>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="Chip">
        <div className="flex flex-wrap gap-2">
          <Chip>01 1차 협상</Chip>
          <Chip active>02 2차 협상 (active)</Chip>
        </div>
      </Section>

      <Section title="Checkbox">
        <Checkbox checked={checked} onChange={setChecked} label="체크박스 라벨" />
      </Section>

      <Section title="Card">
        <Card className="p-4">
          <Text variant="body-md">카드 컴포넌트 내부입니다.</Text>
        </Card>
      </Section>
    </div>
  )
}
