import type { ChatRequest, ChatResponse, ReportRequest, ReportResponse, SessionLogRequest } from '../types'
import { mockChat } from './mock/chat'
import { mockReport } from './mock/report'

// 백엔드 준비되면 .env 에 VITE_API_BASE_URL 만 설정하면 실제 API로 전환된다.
// 요청/응답 형태는 BACKEND_SPEC_v2.md 6~10번 섹션과 동일하게 맞춰뒀다.
const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined

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
  return postJson<ChatRequest, ChatResponse>('/api/chat', req)
}

export async function report(req: ReportRequest): Promise<ReportResponse> {
  if (!API_BASE) return mockReport(req)
  return postJson<ReportRequest, ReportResponse>('/api/report', req)
}

export async function sessionLog(req: SessionLogRequest): Promise<void> {
  if (!API_BASE) return
  await postJson('/api/session-log', req)
}
