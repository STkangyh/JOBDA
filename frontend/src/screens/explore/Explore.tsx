import { useRef, useState } from 'react'
import bannerImg from '../../assets/jobs/explore-banner.png'
import productDesignerImg from '../../assets/jobs/product-designer.png'
import softwareEngineerImg from '../../assets/jobs/software-engineer.png'
import academyInstructorImg from '../../assets/jobs/academy-instructor.png'
import securityOfficerImg from '../../assets/jobs/security-officer.png'
import b2bManagerImg from '../../assets/jobs/b2b-solution-manager.png'
import dataAnalystImg from '../../assets/jobs/data-analyst.png'
import softwareEngineer2Img from '../../assets/jobs/software-engineer-2.png'
import qaEngineerImg from '../../assets/jobs/qa-engineer.png'
import hrManagerImg from '../../assets/jobs/hr-manager.png'
import academyInstructor2Img from '../../assets/jobs/academy-instructor-2.png'
import digitalMarketerImg from '../../assets/jobs/digital-marketer.png'
import communityManagerImg from '../../assets/jobs/community-manager.png'
import careerCounselorImg from '../../assets/jobs/career-counselor.png'
import { Sidebar } from '../../components/Sidebar'
import { Text } from '../../components/Text'
import { SearchIcon, ProfileIcon, ArrowBackIosIcon, WorkIcon, ClockLoaderIcon } from '../../components/icons'

interface JobPreview {
  id: string
  title: string
  image: string
  real?: boolean
}

// New Arrival 캐로셀 5장. 실제로 구현된 직무는 "생활 가전 제품 디자이너" 하나뿐이라
// 나머지 4장은 미리보기(선택 시 하단 패널만 갱신)만 되고 입장은 안 됨.
const NEW_ARRIVAL: JobPreview[] = [
  { id: 'software-engineer', title: '소프트웨어 엔지니어', image: softwareEngineerImg },
  { id: 'product-designer', title: '생활 가전 제품 디자이너', image: productDesignerImg, real: true },
  { id: 'academy-instructor', title: '학원 강사', image: academyInstructorImg },
  { id: 'security-officer', title: '보안 담당자', image: securityOfficerImg },
  { id: 'b2b-manager', title: 'B2B 솔루션 매니저', image: b2bManagerImg },
]

const TOP10: JobPreview[] = [
  { id: 'top-product-designer', title: '생활 가전 제품 디자이너', image: productDesignerImg, real: true },
  { id: 'top-data-analyst', title: '데이터 분석가', image: dataAnalystImg },
  { id: 'top-software-engineer', title: '소프트웨어 엔지니어', image: softwareEngineer2Img },
  { id: 'top-qa-engineer', title: 'QA엔지니어', image: qaEngineerImg },
  { id: 'top-hr-manager', title: '인사담당자', image: hrManagerImg },
  { id: 'top-academy-instructor', title: '학원 강사', image: academyInstructor2Img },
  { id: 'top-digital-marketer', title: '디지털 마케터', image: digitalMarketerImg },
  { id: 'top-community-manager', title: '커뮤니티 매니저', image: communityManagerImg },
  { id: 'top-career-counselor', title: '직업 상담사', image: careerCounselorImg },
  { id: 'top-security-officer', title: '보안 담당자', image: securityOfficerImg },
]

function Dot() {
  return <span className="mx-1 inline-block size-[3px] shrink-0 rounded-full bg-green-900 align-middle" />
}

// Figma "Desktop - 76"(744:23143) — 탐색 페이지. macOS 메뉴바 목업은 항상 그래왔듯 제외.
// New Arrival 캐로셀 + 실시간 인기 직무 Top 10을 전체 구현. 진짜 만들어진 직무는 1개뿐이라
// 나머지는 시각적으로만 채우고(Figma 원본 목업 이미지 그대로) 클릭해도 입장은 안 되게 막았다.
export function Explore({ onOpenJob }: { onOpenJob: () => void }) {
  const [selected, setSelected] = useState(1)
  const carouselRef = useRef<HTMLDivElement>(null)
  const selectedJob = NEW_ARRIVAL[selected]

  const selectCard = (i: number) => {
    setSelected(i)
    if (NEW_ARRIVAL[i].real) onOpenJob()
  }

  const scrollCarousel = (dir: 1 | -1) => {
    carouselRef.current?.scrollBy({ left: dir * 460, behavior: 'smooth' })
  }

  return (
    <div className="flex min-h-svh gap-6 bg-neutral-950 p-6">
      <Sidebar active="apps" />

      <div className="flex flex-1 flex-col gap-8">
        <div
          className="flex items-center justify-end gap-4 rounded-lg bg-neutral-900 bg-cover bg-center px-6 py-5"
          style={{ backgroundImage: `url(${bannerImg})` }}
        >
          <div className="flex h-[50px] w-full max-w-[400px] items-center gap-2 rounded-full bg-neutral-700/80 px-4 text-neutral-300 backdrop-blur">
            <SearchIcon className="size-5" />
            <span className="text-body-md">직무 검색</span>
          </div>
          <div className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-green-500 text-neutral-900">
            <ProfileIcon className="size-5" />
          </div>
        </div>

        <div className="flex flex-col gap-6 rounded-lg bg-neutral-900 px-12 py-6">
          <div className="flex items-end justify-between">
            <Text variant="display-md" emphasis className="text-green-400 tracking-[-0.09px]">
              New Arrival
            </Text>
            <Text variant="headline-md" className="text-neutral-300">
              요청해주신 새로운 직무가 추가되었어요!
            </Text>
          </div>

          <div className="relative">
            <div ref={carouselRef} className="flex gap-3 overflow-x-auto scroll-smooth">
              {NEW_ARRIVAL.map((job, i) => {
                const isSelected = i === selected
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => selectCard(i)}
                    className={`relative h-[310px] w-[430px] shrink-0 overflow-hidden rounded-lg text-left transition-opacity ${
                      isSelected ? 'border-4 border-white' : 'hover:opacity-90'
                    }`}
                  >
                    <img src={job.image} alt="" className="absolute inset-0 size-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
                    {isSelected && (
                      <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0px_0px_30px_20px_white]" />
                    )}
                    <p
                      className={`relative p-6 text-headline-md text-green-50 ${isSelected ? 'font-semibold' : 'font-normal'}`}
                    >
                      {job.title}
                    </p>
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => scrollCarousel(-1)}
              className="absolute left-[-22px] top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-neutral-500/25 bg-neutral-700/50 text-green-50 backdrop-blur-sm hover:bg-neutral-700/80"
              aria-label="이전"
            >
              <ArrowBackIosIcon className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel(1)}
              className="absolute right-[-22px] top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border-2 border-neutral-500/25 bg-neutral-700/50 text-green-50 backdrop-blur-sm hover:bg-neutral-700/80"
              aria-label="다음"
            >
              <ArrowBackIosIcon className="size-3 rotate-180" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-headline-md font-semibold text-neutral-50">{selectedJob.title}</p>
            {selectedJob.real ? (
              <>
                <div className="flex gap-2">
                  <span className="flex items-center gap-2 rounded-[15px] bg-green-500 px-2 py-1">
                    <WorkIcon className="size-5 text-green-900" />
                    <span className="text-body-lg text-green-900">
                      문화
                      <Dot />
                      예술
                    </span>
                  </span>
                  <span className="flex items-center gap-2 rounded-[15px] bg-green-500 px-2 py-1">
                    <ClockLoaderIcon className="size-5 text-green-900" />
                    <span className="text-body-lg text-green-900">
                      2주일
                      <Dot />
                      매일 2시간
                    </span>
                  </span>
                </div>
                <p className="max-w-2xl text-title-md font-medium leading-tight text-neutral-500">
                  C 가전회사에서 초임 디자이너로 근무하고 있는 심재현씨가 되어 인하우스 디자인 업무를 체험해보세요.
                  <br />
                  탁상형 공기청정기 제품 기획부터 아이데이션, 시각화, 설계, 양산 프로젝트 사후 관리까지 모두
                  시뮬레이션할 수 있어요.
                </p>
              </>
            ) : (
              <p className="text-title-md font-medium text-neutral-500">아직 준비 중인 직무예요. 곧 만나보실 수 있어요!</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Text variant="headline-lg" emphasis className="text-white">
            실시간 인기 직무 Top 10
          </Text>
          <div className="grid grid-cols-5 gap-3">
            {TOP10.map((job, i) => {
              const rank = i + 1
              const Wrapper = job.real ? 'button' : 'div'
              return (
                <Wrapper
                  key={job.id}
                  type={job.real ? 'button' : undefined}
                  onClick={job.real ? onOpenJob : undefined}
                  className={`relative flex h-[216px] items-end overflow-hidden rounded-xl ${
                    job.real ? 'transition-[filter] hover:brightness-110' : ''
                  }`}
                >
                  <img src={job.image} alt="" className="absolute inset-0 size-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <div className="relative flex items-end gap-2 p-3">
                    <span className="text-[48px] leading-none font-black text-green-500 italic [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)]">
                      {rank}
                    </span>
                    <span className="text-[15px] leading-tight font-semibold text-neutral-50">{job.title}</span>
                  </div>
                </Wrapper>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
