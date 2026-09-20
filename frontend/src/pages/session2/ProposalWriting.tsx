import { Sidebar } from '../../components/Sidebar'
import { IndicatorHeader } from '../../components/IndicatorHeader'
import { Card } from '../../components/Card'
import { Text } from '../../components/Text'
import { PrimaryCTAButton } from '../../components/PrimaryCTAButton'

// Figma 744:17828("UI Sample", 파일 x6feHLgVMyg8sh8C2jVPE1) — Indicator.tsx의 INDICATOR_STEPS엔
// "제안서 작성" 라벨이 이미 있었지만 대응하는 Stage/화면이 없었다(브리프→...→관계자 협업 다음
// 곧장 피드백 수정으로 건너뜀). 이 화면은 아직 콘텐츠 없이 배치만 잡아둔 저해상도 와이어프레임이라
// 실제 문구는 카드 제목뿐 — Stage enum은 다른 에이전트들이 동시에 건드릴 수 있어 늘리지 않는다는
// 기존 컨벤션(BranchSelect.tsx 참고)을 따라 세션 스토어에는 연결하지 않고 배치 확인용 독립
// 라우트(/proposal-writing)로만 둔다.
export function ProposalWriting() {
  return (
    <div className="flex min-h-svh gap-6 bg-neutral-75 p-6">
      <Sidebar active="apps" className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <IndicatorHeader current="제안서 작성" gridCols="grid-cols-1 lg:grid-cols-[340px_1fr_340px]" />

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-[340px_1fr_340px]">
            <div className="flex flex-col gap-3">
              <Card className="p-6">
                <Text variant="title-lg" emphasis className="text-green-900">
                  세션 목표
                </Text>
              </Card>
              <Card className="p-6">
                <Text variant="title-lg" emphasis className="text-green-900">
                  체크리스트
                </Text>
              </Card>
              <Card className="p-6">
                <Text variant="title-lg" emphasis className="text-green-900">
                  다음 행동
                </Text>
              </Card>
            </div>

            <Card className="flex flex-1 flex-col p-6">
              <Text variant="title-lg" emphasis className="text-green-900">
                업무 노트
              </Text>
            </Card>

            {/* Workspace.tsx 등과 동일 패턴 — 오른쪽 카드는 flex-1로 남는 세로 공간을 흡수해서
                제출 버튼을 칸 맨 아래로 붙이고, 이 래퍼의 h-full이 다른 칸과 전체 높이를 맞춘다. */}
            <div className="flex h-full flex-col gap-[18px]">
              <Card className="flex flex-1 flex-col p-6">
                <Text variant="title-lg" emphasis className="text-green-900">
                  업무 노트
                </Text>
              </Card>
              {/* 아직 실제 Stage가 없어 다음 화면으로 넘길 대상이 없다 — 배치 확인용이라 no-op. */}
              <PrimaryCTAButton onClick={() => {}}>제출하기</PrimaryCTAButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
