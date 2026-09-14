// 초록 알약 배지 — session1/session2 Brief.tsx의 "초기 조건" 태그 등에 동일하게 복붙돼
// 있던 로컬 컴포넌트를 하나로 모음. Report.tsx의 SectionTag(테두리 green-300)와는 다른,
// 채워진 green-400 테두리 스타일.
export function Tag({ children }: { children: string }) {
  return (
    <span className="shrink-0 rounded-[20px] border border-green-400 bg-green-50 px-3 py-2 text-body-lg font-medium text-green-900">
      {children}
    </span>
  )
}
