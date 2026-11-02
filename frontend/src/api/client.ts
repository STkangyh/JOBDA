import type { ChatRequest, ChatResponse, Finding, FindingCode, ReportRequest, ReportResponse, SessionLogRequest } from '../types'
import { mockChat } from './mock/chat'
import { mockReport, computeJourney, computeProfile, WORK_OVERVIEW, JOB_MEANING } from './mock/report'

// 백엔드가 BACKEND_SPEC_v4로 배포됨 (GitHub 이슈 #1). v2와의 갭은 이 파일 경계에서만
// 흡수한다 — 호출부(store)와 내부 타입은 v2 모델 그대로 유지.
// API 서버는 2026-11-02부터 이 저장소의 frontend/api/(같은 Vercel 프로젝트)에 있다. 그래서 배포 빌드는
// 같은 출처(/api/...)를 부르고, 개발·테스트는 목데이터를 쓴다. VITE_API_BASE_URL을 주면 그 주소가 우선한다.
const ENV_API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined
const API_BASE: string | undefined = ENV_API_BASE || (import.meta.env.PROD ? '' : undefined)
const USE_MOCK = API_BASE === undefined
const SCENARIO = 'cmf_outsourcing'

async function postJson<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status}`)
  }
  return res.json() as Promise<TRes>
}

export async function chat(req: ChatRequest): Promise<ChatResponse> {
  if (USE_MOCK) return mockChat(req)
  return postJson('/api/chat', { scenario: SCENARIO, context: null, ...req })
}

// finding code -> 배열 분류. 이슈 #1의 API.md 기본 배정을 따름 (mock/report.ts의
// SENTENCE 버킷과 동일하게 맞춰둠 — 실제 API와 오프라인 목데이터가 같은 분류를 쓰게).
const FINDING_BUCKET: Record<FindingCode, 'strengths' | 'cautions' | 'missed'> = {
  asked_capability_before_final: 'strengths',
  limit_sample_attached_in_draft: 'strengths',
  cost_impact_checked: 'strengths',
  deadline_margin_considered: 'strengths',
  limit_sample_missing_in_draft: 'cautions',
  spec_field_missing: 'cautions',
  vendor_criteria_incomplete: 'cautions',
  capability_never_asked: 'missed',
  budget_never_asked: 'missed',
  deadline_margin_ignored: 'missed',
}

export async function report(req: ReportRequest): Promise<ReportResponse> {
  if (USE_MOCK) return mockReport(req)
  const pick = (bucket: 'strengths' | 'cautions' | 'missed'): Finding[] =>
    req.findings.filter((f) => FINDING_BUCKET[f.code] === bucket)
  const res = await postJson<unknown, ReportResponse>('/api/report', {
    scenario: SCENARIO,
    strengths_findings: pick('strengths'),
    cautions_findings: pick('cautions'),
    missed_findings: pick('missed'),
    action_logs: req.action_logs,
    scores: req.scores,
    branch: req.branch,
  })
  // "내 직무 이해 프로필"과 work_overview/job_meaning은 BACKEND_SPEC_v2.md의 /api/report
  // 응답에 아예 없는 필드(strengths/cautions/missed 셋뿐)라 여기서 채워 넣는다 — mock과
  // 동일한 시나리오 문구를 재사용(이슈 #2/백엔드 #14, 백엔드가 나중에 필드를 추가하면 그
  // 값이 우선하도록 ?? 로 덮어쓰기만 함).
  // strengths/cautions/missed도 Report.tsx(823:52946)가 .length/.map()으로 직접 순회하는데,
  // 백엔드가 필드를 아예 빼고 보내면(undefined) 그 순간 화면이 죽는다 — 실제 API 응답이 TS
  // 타입을 강제하지 않으니 이 경계에서 최소한의 형태를 보장한다.
  return {
    ...res,
    strengths: res.strengths ?? [],
    cautions: res.cautions ?? [],
    missed: res.missed ?? [],
    work_overview: res.work_overview ?? WORK_OVERVIEW[req.branch],
    job_meaning: res.job_meaning ?? JOB_MEANING,
    // api/report.ts가 항상 3줄을 주지만, 응답 형태가 어긋나면 같은 규칙의 기본값으로 채운다.
    journey: Array.isArray(res.journey) && res.journey.length === 3 ? res.journey : computeJourney(req),
    profile: res.profile ?? computeProfile(req),
  }
}

export async function sessionLog(req: SessionLogRequest): Promise<void> {
  if (USE_MOCK) return
  await postJson('/api/session-log', { scenario: SCENARIO, ...req })
}
