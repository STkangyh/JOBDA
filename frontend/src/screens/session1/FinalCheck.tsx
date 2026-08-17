import { useState } from 'react'
import { Text } from '../../components/Text'
import { Card } from '../../components/Card'
import { Checkbox } from '../../components/Checkbox'
import { Button } from '../../components/Button'
import { S1_ROUNDS, useSession1 } from '../../store/session1'

// Figma의 "최종 제출물 점검" 화면(652:4376)은 세션2 용어(시방서/한도견본)가 잘못 섞인 미완성
// 초안이라 그대로 옮기지 않고, 세션1 서사(파트 분할 협상)에 맞는 체크리스트로 새로 구성함.
const CHECK_ITEMS = [
  '최종 확정된 하우징 파트 분할안과 형태를 정리했다',
  '각 라운드에서 선택한 근거를 정리했다',
  '벨트라인 디자인 의도를 어떻게 유지했는지 설명했다',
  '설계팀과의 합의 여부를 확인했다',
]

export function Session1FinalCheck() {
  const [checked, setChecked] = useState<boolean[]>(CHECK_ITEMS.map(() => false))
  const confirmFinalCheck = useSession1((s) => s.confirmFinalCheck)
  const roundAnswers = useSession1((s) => s.roundAnswers)

  const allChecked = checked.every(Boolean)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <Text variant="headline-md" emphasis>
        최종 제출물 점검
      </Text>

      <Card className="flex flex-col gap-4 p-6">
        <Text variant="title-lg" emphasis>
          라운드별 결정 요약
        </Text>
        {S1_ROUNDS.map((round, i) => {
          const answer = roundAnswers[i]
          const choice = answer.selectedChoice !== null ? round.choices[answer.selectedChoice] : null
          return (
            <div key={round.roundNumber} className="border-t border-neutral-200 pt-3 first:border-t-0 first:pt-0">
              <Text variant="body-md" emphasis>
                {round.feedbackTitle}
              </Text>
              <Text variant="body-sm" className="text-neutral-600">
                선택: {choice ? choice.label : '미선택'}
              </Text>
              {answer.reasoning && (
                <Text variant="body-sm" className="text-neutral-500">
                  근거: {answer.reasoning}
                </Text>
              )}
            </div>
          )
        })}
      </Card>

      <Card className="flex flex-col gap-3 p-6">
        {CHECK_ITEMS.map((item, i) => (
          <Checkbox
            key={item}
            checked={checked[i]}
            onChange={(v) =>
              setChecked((prev) => {
                const next = [...prev]
                next[i] = v
                return next
              })
            }
            label={item}
          />
        ))}
      </Card>

      <Button
        variant="primary"
        className="h-[72px] w-[340px] self-end !rounded-xl !text-2xl"
        disabled={!allChecked}
        onClick={confirmFinalCheck}
      >
        최종 결과물 제출
      </Button>
    </div>
  )
}
