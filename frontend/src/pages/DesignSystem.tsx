import { useState } from 'react'
import { Text } from '../components/Text'
import { Chip } from '../components/Chip'
import { Checkbox } from '../components/Checkbox'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { PrimaryCTAButton } from '../components/PrimaryCTAButton'
import { IndicatorHeader } from '../components/IndicatorHeader'
import { Sidebar, type SidebarItem } from '../components/Sidebar'
import { Indicator, INDICATOR_STEPS, type IndicatorStep } from '../components/Indicator'
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
  AppsIcon,
  DatabaseIcon,
  MailIcon,
  AsteriskIcon,
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
const GREEN_STEPS = [50, 100, 200, 500, 600, 700, 800, 900] as const
const GREEN_BG: Record<(typeof GREEN_STEPS)[number], string> = {
  50: 'bg-green-50',
  100: 'bg-green-100',
  200: 'bg-green-200',
  500: 'bg-green-500',
  600: 'bg-green-600',
  700: 'bg-green-700',
  800: 'bg-green-800',
  900: 'bg-green-900',
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
  { name: 'Apps', Icon: AppsIcon },
  { name: 'Database', Icon: DatabaseIcon },
  { name: 'Mail', Icon: MailIcon },
]

export function DesignSystem() {
  const [checked, setChecked] = useState(true)
  const [sidebarActive, setSidebarActive] = useState<SidebarItem>('apps')
  const [step, setStep] = useState<IndicatorStep>('관계자 협업')
  // 실제 화면에서는 제출 버튼 클릭 후 1200ms만 보이고 사라져서(Workspace.tsx 등) 눈으로 확인하기
  // 번거로웠다 — 토글로 계속 켜둔 채 스피너 3종(헤더 별표/제출 버튼/메신저 답변 대기 점 3개)을
  // 한 번에 비교할 수 있게 함.
  const [loading, setLoading] = useState(true)

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
          <div>
            <Text variant="body-sm" className="mb-2 text-neutral-600">
              Green (CTA / indicator accent — separate from Primary above)
            </Text>
            <div className="flex flex-wrap gap-2">
              {GREEN_STEPS.map((s) => (
                <Swatch key={s} label={String(s)} className={GREEN_BG[s]} />
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
          <Button variant="primary">제출하기</Button>
          <Button variant="outline">제출하기 (Outline)</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>
            제출하기 (Disabled)
          </Button>
        </div>
      </Section>

      <Section title="Sidebar (GNB)">
        <div className="flex h-[420px] items-start bg-neutral-100 p-4">
          <Sidebar active={sidebarActive} onSelect={setSidebarActive} />
        </div>
        <Text variant="caption-sm" className="text-neutral-500">
          선택됨: {sidebarActive}
        </Text>
      </Section>

      <Section title="Indicator">
        <Indicator current={step} />
        <div className="flex flex-wrap gap-2">
          {INDICATOR_STEPS.map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                s === step
                  ? 'border-green-700 bg-green-100 text-green-700'
                  : 'border-neutral-300 text-neutral-600 hover:border-neutral-500'
              }`}
            >
              {s}
            </button>
          ))}
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

      <Section title="Loading">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setLoading((v) => !v)}>
              {loading ? '로딩 끄기' : '로딩 켜기'}
            </Button>
            <Text variant="caption-sm" className="text-neutral-500">
              실제 화면에서는 제출 후 1200ms만 보이는 상태(Workspace 등)를 켜둔 채로 확인합니다.
            </Text>
          </div>

          <div>
            <Text variant="body-sm" className="mb-2 text-neutral-600">
              헤더 스피너 (IndicatorHeader loading)
            </Text>
            <div className="bg-neutral-100 p-4">
              <IndicatorHeader current="관계자 협업" gridCols="grid-cols-1 lg:grid-cols-[120px_1fr_120px]" loading={loading} />
            </div>
          </div>

          <div>
            <Text variant="body-sm" className="mb-2 text-neutral-600">
              제출 버튼 (PrimaryCTAButton)
            </Text>
            <PrimaryCTAButton disabled={loading} onClick={() => {}}>
              {loading ? '로딩 중...' : '초안 제출'}
            </PrimaryCTAButton>
          </div>

          <div>
            <Text variant="body-sm" className="mb-2 text-neutral-600">
              메신저 답변 대기 (Messenger sending indicator)
            </Text>
            {loading ? (
              <div className="flex w-fit items-center gap-1.5 rounded-br-xl rounded-tl-xl rounded-tr-xl bg-neutral-100 px-4 py-3.5">
                <span className="size-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '0ms' }} />
                <span className="size-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '150ms' }} />
                <span className="size-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <Text variant="caption-sm" className="text-neutral-400">
                (로딩 꺼짐 — 토글 켜서 확인)
              </Text>
            )}
          </div>

          <div>
            <Text variant="body-sm" className="mb-2 text-neutral-600">
              라우트 전환 스피너 (App.tsx RouteFallback)
            </Text>
            <div className="flex size-8 items-center justify-center rounded-full bg-neutral-950 text-neutral-500">
              <AsteriskIcon className={`size-5 ${loading ? 'animate-spin' : ''}`} />
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
