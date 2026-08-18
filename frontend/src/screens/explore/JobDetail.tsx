import { useState } from 'react'
import brandLogo from '../../assets/brand-logo.png'
import illustration from '../../assets/illustrations/illustration-desk-work.svg'
import { Text } from '../../components/Text'
import { Button } from '../../components/Button'
import { CancelIcon } from '../../components/icons'

const PROCESS_STEPS = [
  '프로젝트 기획 및 제안',
  '사용자 리서치 및 분석',
  '전략 수립 및 컨셉 설정',
  '아이디어 발상 및 구체화',
  '아이디어 시각화',
  '모형 제작 및 설계 검토',
  '품평회 및 디자인 확정',
  '시방서 작성 및 설계 이관',
  '설계 과정 감리',
  '양산 과정 감리',
  '프로젝트 사후 관리',
] as const

// 실제로 구현된 세션 2개: 6번(모형 제작 및 설계 검토 = prototype_revision/세션1),
// 8번(시방서 작성 및 설계 이관 = cmf_outsourcing/세션2)만 선택 가능하게 함.
const AVAILABLE_STEP_INDICES = [5, 7]
const DEFAULT_STEP_INDEX = 7

// Figma "Desktop - 64" (652:16286) — 직무 상세 페이지. 브랜드/GNB 없이 전체화면 다크 레이아웃.
export function JobDetail({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (stepIndex: number) => void
}) {
  const [selected, setSelected] = useState<number | null>(DEFAULT_STEP_INDEX)

  return (
    <div className="flex min-h-svh flex-col gap-[18px] bg-neutral-950 p-7">
      <div className="flex items-start justify-between">
        <img src={brandLogo} alt="JOB:SIM" className="size-[75px] rounded-xl bg-neutral-800 object-cover" />
        <button
          type="button"
          onClick={onClose}
          className="flex size-[50px] items-center justify-center rounded-full bg-error-200 text-white"
        >
          <CancelIcon className="size-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-[18px] lg:flex-row">
        <div className="relative flex flex-1 flex-col justify-end overflow-hidden rounded-lg bg-neutral-800 p-6">
          <img
            src={illustration}
            alt=""
            className="pointer-events-none absolute inset-0 size-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/10 to-transparent" />
          <div className="relative flex flex-col gap-3">
            <Text variant="display-md" emphasis className="text-green-400">
              생활 가전 제품디자이너
            </Text>
            <Text variant="body-lg" className="text-neutral-300">
              C 가전회사에서 초임 디자이너로 근무하고 있는 심재현씨가 되어 인하우스 디자인 업무를
              체험해보세요.
            </Text>
          </div>
        </div>

        <div className="flex w-full flex-col gap-6 rounded-lg bg-neutral-900 p-6 lg:w-[340px]">
          <div className="flex flex-col gap-3">
            <Text variant="title-lg" emphasis className="text-primary-400">
              업무 프로세스
            </Text>
            <Text variant="body-lg" className="text-neutral-200">
              희망하는 대표 세션을 선택하세요
            </Text>
          </div>
          <div className="flex flex-col gap-4">
            {PROCESS_STEPS.map((step, i) => {
              const isAvailable = AVAILABLE_STEP_INDICES.includes(i)
              const isSelected = selected === i
              return (
                <button
                  key={step}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => setSelected(i)}
                  className={`flex h-12 items-center gap-0.5 rounded-xl border px-6 text-xl transition-colors ${
                    isSelected
                      ? 'border-green-400 bg-neutral-800 font-semibold text-neutral-100'
                      : `border-neutral-800 bg-neutral-900 text-neutral-300 ${isAvailable ? 'hover:border-neutral-600 hover:text-neutral-100' : ''}`
                  } ${isAvailable ? '' : 'cursor-not-allowed opacity-50'}`}
                >
                  <span>{i + 1}.</span>
                  <span>{step}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        className="h-[72px] w-[340px] self-end !rounded-xl !text-2xl"
        disabled={selected === null}
        onClick={() => selected !== null && onSubmit(selected)}
      >
        제출하기
      </Button>
    </div>
  )
}
