import { Card } from './Card'

// SelfAssessment.tsx가 제출 버튼을 누른 뒤 finishAssessment()(실측 1.8~3.7초 걸리는 /api/report
// 호출)가 끝날 때까지 보여주는 자리표시자. Report.tsx(823:52946)와 똑같은 442fr/855fr/340fr
// 3컬럼 그리드 위에 실제 콘텐츠 자리마다 펄스 블록만 채워서, 리포트가 도착하는 순간 레이아웃이
// 안 튀고 그대로 내용만 채워지는 것처럼 보이게 한다.

function Bar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-neutral-200 ${className}`} />
}

export function ReportSkeleton() {
  return (
    <div className="grid grid-cols-1 items-start gap-[19px] lg:grid-cols-[442fr_855fr_340fr]">
      <Card className="flex flex-col gap-[48px] px-6 py-8">
        <div className="flex flex-col gap-3">
          <Bar className="h-8 w-28" />
          <div className="flex flex-col gap-2 pt-2">
            <Bar className="h-5 w-4/5" />
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-3/4" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Bar className="h-8 w-28" />
          <div className="flex flex-col gap-2 pt-2">
            <Bar className="h-5 w-3/5" />
            <Bar className="h-4 w-full" />
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Bar className="h-8 w-28" />
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Bar key={i} className="h-[60px] w-full" />
            ))}
          </div>
        </div>
      </Card>

      <div className="flex min-w-0 flex-col gap-[18px]">
        <Card className="flex flex-col gap-6 px-6 py-8">
          <div className="flex items-center justify-between gap-3">
            <Bar className="h-8 w-40" />
            <Bar className="h-6 w-24" />
          </div>
          <div className="flex flex-col gap-3">
            <Bar className="h-16 w-full" />
            <Bar className="h-16 w-full" />
            <Bar className="h-16 w-full" />
          </div>
        </Card>
        <div className="flex flex-col gap-[19px] sm:flex-row">
          <Card className="flex flex-1 flex-col justify-between gap-6 p-6">
            <div className="flex items-start justify-between">
              <Bar className="h-6 w-16" />
              <Bar className="h-9 w-14" />
            </div>
            <Bar className="h-10 w-full" />
          </Card>
          <Card className="flex flex-1 flex-col justify-between gap-6 p-6">
            <div className="flex items-start justify-between">
              <Bar className="h-6 w-16" />
              <Bar className="h-9 w-14" />
            </div>
            <Bar className="h-10 w-full" />
          </Card>
        </div>
      </div>

      <div className="flex flex-col gap-[18px]">
        <Card className="flex flex-col gap-6 p-6">
          <Bar className="h-8 w-24" />
          <div className="flex flex-wrap gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <Bar key={i} className="h-9 w-20" />
            ))}
          </div>
        </Card>
        <Bar className="h-[72px] w-full !rounded-xl" />
      </div>
    </div>
  )
}
