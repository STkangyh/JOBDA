// Figma 823:52946(Desktop-121) "흥미도"/"이해도" 카드의 도트 매트릭스 — 원본은 SVG로 미리
// 그려진 정적 이미지(퍼센트가 39%/26%로 고정)라, 실제 데이터에 따라 값이 바뀌어야 하는 이
// 화면 특성상 그대로 이미지로 박아둘 수 없어 진짜 퍼센트를 반영하는 그리드로 다시 구현했다.
// 원본 도트 배치는 채움 경계에 약간의 지터가 섞인 장식적 배치였고, 그 개별 좌표까지 그대로
// 재현하는 건 과함 — "아래에서 위로, 왼쪽에서 오른쪽으로 채워진다"는 시각적 의미만 재현한다.
export function DotMatrix({ percent, columns = 15, rows = 10 }: { percent: number; columns?: number; rows?: number }) {
  const total = columns * rows
  const filled = Math.round((Math.max(0, Math.min(100, percent)) / 100) * total)

  return (
    <div className="grid w-full gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: total }, (_, i) => {
        const row = Math.floor(i / columns)
        const col = i % columns
        const orderFromBottom = (rows - 1 - row) * columns + col
        const isFilled = orderFromBottom < filled
        return <span key={i} className={`aspect-square rounded-full ${isFilled ? 'bg-[#b1dc88]' : 'bg-neutral-200'}`} />
      })}
    </div>
  )
}
