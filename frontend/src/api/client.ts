import type { ChatRequest, ChatResponse, Finding, FindingCode, ReportRequest, ReportResponse, SessionLogRequest } from '../types'
import { mockChat } from './mock/chat'
import { mockReport } from './mock/report'

// 백엔드가 BACKEND_SPEC_v4로 배포됨 (GitHub 이슈 #1). v2와의 갭은 이 파일 경계에서만
// 흡수한다 — 호출부(store)와 내부 타입은 v2 모델 그대로 유지.
const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined
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
  if (!API_BASE) return mockChat(req)
  return postJson('/api/chat', { scenario: SCENARIO, context: null, ...req })
}

// finding code -> 배열 분류. 이슈 #1의 API.md 기본 배정을 따름 (mock/report.ts의
// SENTENCE 버킷과 동일하게 맞춰둠 — 실제 API와 오프라인 목데이터가 같은 분류를 쓰게).
const FINDING_BUCKET: Record<FindingCode, 'strengths' | 'cautions' | 'missed'> = {
  asked_capability_before_final: 'strengths',
  vendor_compared_three: 'strengths',
  limit_sample_missing_in_draft: 'cautions',
  spec_field_missing: 'cautions',
  vendor_criteria_incomplete: 'cautions',
  revisited_after_branch: 'cautions',
  concept_abandoned: 'cautions',
  capability_never_asked: 'missed',
  budget_never_asked: 'missed',
  deadline_margin_ignored: 'missed',
}

export async function report(req: ReportRequest): Promise<ReportResponse> {
  if (!API_BASE) return mockReport(req)
  const pick = (bucket: 'strengths' | 'cautions' | 'missed'): Finding[] =>
    req.findings.filter((f) => FINDING_BUCKET[f.code] === bucket)
  return postJson('/api/report', {
    scenario: SCENARIO,
    strengths_findings: pick('strengths'),
    cautions_findings: pick('cautions'),
    missed_findings: pick('missed'),
    action_logs: req.action_logs,
    scores: req.scores,
    branch: req.branch,
  })
}

export async function sessionLog(req: SessionLogRequest): Promise<void> {
  if (!API_BASE) return
  await postJson('/api/session-log', { scenario: SCENARIO, ...req })
}
