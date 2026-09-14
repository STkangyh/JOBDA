import brandLogo from '../assets/brand-logo.png'

// 사이드바 없이 로고 박스 하나로 헤더 폭을 맞추는 화면(Report.tsx, session1/SelfAssessment.tsx)
// 에 동일하게 복붙돼 있던 마크업을 하나로 모음.
export function BrandLogoBox() {
  return (
    <div className="hidden shrink-0 lg:block">
      <div className="flex size-[83px] items-center justify-center rounded-xl bg-neutral-900 p-2">
        <img src={brandLogo} alt="JOB:SIM" className="size-[67px] rounded-lg object-cover" />
      </div>
    </div>
  )
}
