import { Card } from './Card'
import { Text } from './Text'

interface Collaborator {
  img: string
  name: string
  team: string
}

// "협업 관계자" 아바타 목록 카드 — session1/session2 Brief.tsx에 동일하게 복붙돼 있던
// 블록을 하나로 모음. 인원 구성 자체는 화면마다 달라서(세션2만 구매팀 김부장 추가) 데이터는
// 계속 각 화면에서 prop으로 받는다.
export function CollaboratorsCard({ collaborators }: { collaborators: Collaborator[] }) {
  return (
    <Card className="flex flex-col gap-6 p-6">
      <Text variant="title-lg" emphasis className="text-green-900">
        협업 관계자
      </Text>
      <div className="flex flex-wrap justify-between gap-y-6">
        {collaborators.map((c) => (
          <div key={c.name} className="flex flex-col items-center gap-3">
            <img src={c.img} alt="" loading="lazy" className="size-24 rounded-full bg-neutral-100 object-cover" />
            <div className="flex items-center gap-1">
              <Text variant="caption-sm" className="text-neutral-700">
                {c.name}
              </Text>
              <span className="size-0.5 rounded-full bg-neutral-400" />
              <Text variant="caption-sm" className="text-green-600">
                {c.team}
              </Text>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
