import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fillDays, periodSince, screenLabel, viewLabel, formatDuration } from './report'
import { AdminDashboard } from './AdminDashboard'
import { AdminTools, type AdminToolsApi } from './AdminTools'
import type { UtApi } from './UserTestSection'
import { demoReport, demoTimeline } from './demoReport'

describe('report helpers', () => {
  it('"오늘" starts at midnight Korea time, not UTC midnight', () => {
    // 2026-10-06 08:30 KST = 2026-10-05 23:30 UTC
    const now = Date.parse('2026-10-05T23:30:00Z')
    expect(periodSince('today', now)).toBe('2026-10-05T15:00:00.000Z')
    expect(periodSince('7d', now)).toBe('2026-09-28T23:30:00.000Z')
    expect(periodSince('all', now)).toBeNull()
  })

  it('fills days with no visits as zeros so the trend is not distorted', () => {
    const now = Date.parse('2026-10-05T03:00:00Z')
    const rows = fillDays([{ day: '2026-10-03', visits: 4, users: 3, sessions_started: 1, sessions_completed: 0 }], '7d', now)
    expect(rows.map((r) => r.day)).toEqual(['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'])
    expect(rows.map((r) => r.visits)).toEqual([0, 0, 0, 0, 4, 0, 0])
  })

  it('turns raw screen/view keys into readable Korean labels', () => {
    expect(screenLabel('session2/vendor_compare')).toBe('세션2 · 업체 비교')
    expect(screenLabel('/explore/job')).toBe('직무 상세')
    expect(viewLabel('messenger:engineering')).toBe('메신저 · 설계팀')
    expect(viewLabel('round:2')).toBe('라운드 · 2')
    expect(formatDuration(412)).toBe('6분 52초')
  })
})

describe('AdminDashboard', () => {
  it('shows KPIs, both funnels with the biggest drop called out, and the tables', () => {
    render(<AdminDashboard report={demoReport()} period="30d" onPeriod={() => {}} loading={false} ut={noopUt} />)
    expect(screen.getByText('완료율')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '세션2 퍼널' })).toBeInTheDocument()
    expect(screen.getByText(/64명 이탈 · 가장 큰 이탈 구간/)).toBeInTheDocument()
    const exitTable = screen.getByRole('heading', { name: '화면별 이탈률' }).closest('section')!
    expect(within(exitTable).getByText('세션2 · 관계자 협업')).toBeInTheDocument()
    expect(within(exitTable).getByText('6분 52초')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /방문/ })).toHaveLength(30) // 일별 막대 = 기간 일수
  })

  it('changes the period from the filter row', async () => {
    const user = userEvent.setup()
    const onPeriod = vi.fn()
    render(<AdminDashboard report={demoReport()} period="30d" onPeriod={onPeriod} loading={false} ut={noopUt} />)
    await user.click(screen.getByRole('button', { name: '최근 7일' }))
    expect(onPeriod).toHaveBeenCalledWith('7d')
  })
})

const noopUt: UtApi = { loadTimeline: async () => [], saveReview: async () => {} }

describe('UserTestSection', () => {
  const renderUt = (ut = noopUt) =>
    render(<AdminDashboard report={demoReport()} period="30d" onPeriod={() => {}} loading={false} ut={ut} />)
  const utSection = () => screen.getByRole('heading', { name: '유저 테스트' }).closest('section')!

  it('shows the UT KPIs from the plan — completion counts every started session', () => {
    renderUt()
    const ut = utSection()
    // 5개 세션 중 완료 2 → 40%, 30일 넘게 멈춘 세션 1개가 미완료(나가기로 끝낸 세션은 '명시적 종료')
    expect(within(within(ut).getByText('전체 완주율').parentElement!).getByText('40%')).toBeInTheDocument()
    expect(within(within(ut).getByText('미완료 세션').parentElement!).getByText('1')).toBeInTheDocument()
    expect(within(ut).getByRole('heading', { name: '세션2 업무 마일스톤' })).toBeInTheDocument()
    expect(within(ut).getByText('미완료')).toBeInTheDocument()
    // 저장된 검토는 표에 유형으로 보인다
    expect(within(ut).getByText('Drop-off')).toBeInTheDocument()
  })

  it('timeline marks steps, re-opened materials, errors and the last action', async () => {
    const user = userEvent.setup()
    const loadTimeline = vi.fn(async () => demoTimeline())
    renderUt({ ...noopUt, loadTimeline })
    await user.click(within(utSection()).getAllByRole('button', { name: '기록·검토' })[0])
    const log = await screen.findByRole('list', { name: '활동 기록' })
    expect(loadTimeline).toHaveBeenCalledWith(demoReport().ut_sessions![0].session_id)
    expect(within(log).getByText('자료탐색 단계')).toBeInTheDocument()
    expect(within(log).getByText('재열람')).toBeInTheDocument()
    expect(within(log).getByText('AI 채팅 응답 실패')).toBeInTheDocument()
    expect(within(log).getByText('마지막 행동').closest('li')).toHaveTextContent('세션 완료')
  })

  it('starts the review from a log-based suggestion, marks a log-only cause as presumed, and saves', async () => {
    const user = userEvent.setup()
    const saveReview = vi.fn(async () => {})
    renderUt({ ...noopUt, saveReview })
    await user.click(within(utSection()).getAllByRole('button', { name: '기록·검토' })[0])
    expect(screen.getByText('자동 제안 — 확인 후 저장하세요')).toBeInTheDocument()
    expect(screen.getByLabelText('문제 확인되지 않음')).toBeChecked()

    await user.click(screen.getByLabelText('Friction — 혼란·막힘 의심'))
    await user.selectOptions(screen.getByLabelText('원인 분류'), 'other')
    expect(screen.getByText(/이 원인은 "추정"으로 표시돼요/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('관리자 메모'), '메신저 재진입 반복')
    await user.click(screen.getByRole('button', { name: '검토 저장' }))

    expect(saveReview).toHaveBeenCalledWith(demoReport().ut_sessions![0].session_id, {
      issue_type: 'friction',
      reason: 'other',
      evidence: 'log',
      note: '메신저 재진입 반복',
    })
    expect(await screen.findByText('저장했어요')).toBeInTheDocument()
    expect(within(utSection()).getByText('Friction')).toBeInTheDocument()
  })

  it('shows the reasons an exited participant picked and starts the review from them', async () => {
    const user = userEvent.setup()
    const saveReview = vi.fn(async () => {})
    renderUt({ ...noopUt, saveReview })
    const exited = demoReport().ut_sessions!.findIndex((s) => s.participant === 'P05')
    await user.click(within(utSection()).getAllByRole('button', { name: '기록·검토' })[exited])

    const reasons = screen.getByRole('list', { name: '참가자가 고른 종료 이유' })
    expect(within(reasons).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['업무 내용이 어려워요', '기타: 다른 일정이 생겼어요'])
    // 참가자 응답이 근거라 "추정"이 아니다
    expect(screen.getByLabelText('원인 분류')).toHaveValue('hard_task')
    expect(screen.getByLabelText('참가자 설문 응답 확인')).toBeChecked()
    expect(screen.queryByText(/"추정"으로 표시돼요/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '검토 저장' }))
    expect(saveReview).toHaveBeenCalledWith(demoReport().ut_sessions![exited].session_id, {
      issue_type: 'dropoff',
      reason: 'hard_task',
      evidence: 'survey',
      note: '참가자가 고른 이유: 업무 내용이 어려워요 / 기타: 다른 일정이 생겼어요',
    })
  })

  it('marks sessions that opened the model answer and shows how many times', async () => {
    const user = userEvent.setup()
    renderUt()
    const rows = within(utSection()).getAllByRole('row')
    const p04 = rows.find((r) => r.textContent?.startsWith('P04'))!
    expect(within(p04).getByText('모범답안 봄')).toBeInTheDocument()
    expect(rows.filter((r) => r.textContent?.includes('모범답안 봄'))).toHaveLength(1)

    await user.click(within(p04).getByRole('button', { name: '기록·검토' }))
    expect(screen.getByText('모범답안 열람').nextElementSibling).toHaveTextContent('3회')
  })

  it('shows how to start when there are no participant sessions yet', () => {
    render(<AdminDashboard report={{ ...demoReport(), ut_sessions: [], ut_stages: [] }} period="30d" onPeriod={() => {}} loading={false} ut={noopUt} />)
    expect(screen.getByText(/테스트 링크에 \?ut=참가자코드/)).toBeInTheDocument()
  })
})

describe('AdminPage', () => {
  const fake = {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(async () => ({ error: null })),
    },
    rpc: vi.fn(),
  }

  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_test')
    vi.doMock('../../lib/supabaseClient', () => ({ getSupabase: () => fake }))
    fake.auth.getSession.mockReset()
    fake.auth.signInWithPassword.mockReset()
    fake.rpc.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.doUnmock('../../lib/supabaseClient')
  })

  async function renderPage() {
    const { AdminPage } = await import('./AdminPage')
    render(<AdminPage />)
  }

  it('treats the anonymous analytics session as signed out and shows the login form', async () => {
    fake.auth.getSession.mockResolvedValue({ data: { session: { user: { is_anonymous: true } } } })
    await renderPage()
    expect(await screen.findByRole('button', { name: '로그인' })).toBeInTheDocument()
    expect(fake.rpc).not.toHaveBeenCalled()
  })

  it('logs in and loads the last-7-days report', async () => {
    const user = userEvent.setup()
    fake.auth.getSession.mockResolvedValue({ data: { session: null } })
    fake.auth.signInWithPassword.mockResolvedValue({ data: { user: { email: 'team@jobda.dev' } }, error: null })
    fake.rpc.mockResolvedValue({ data: demoReport(), error: null })
    await renderPage()

    await user.type(await screen.findByLabelText('이메일'), 'team@jobda.dev')
    await user.type(screen.getByLabelText('비밀번호'), 'secret-pw')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('heading', { name: '일별 방문' })).toBeInTheDocument()
    expect(fake.rpc).toHaveBeenCalledWith('admin_report', { p_since: expect.any(String) })
    expect(screen.getByText('team@jobda.dev')).toBeInTheDocument()
  })

  it('shows a clear message for a wrong password', async () => {
    const user = userEvent.setup()
    fake.auth.getSession.mockResolvedValue({ data: { session: null } })
    fake.auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid login credentials' } })
    await renderPage()

    await user.type(await screen.findByLabelText('이메일'), 'x@y.z')
    await user.type(screen.getByLabelText('비밀번호'), 'nope')
    await user.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('이메일 또는 비밀번호가 맞지 않아요.')
  })

  it('says what to fix when the account exists but was never confirmed', async () => {
    const user = userEvent.setup()
    fake.auth.getSession.mockResolvedValue({ data: { session: null } })
    fake.auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { code: 'email_not_confirmed', message: 'Email not confirmed', status: 400 } })
    await renderPage()

    await user.type(await screen.findByLabelText('이메일'), 'new@jobda.dev')
    await user.type(screen.getByLabelText('비밀번호'), 'pw')
    await user.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('아직 확인되지 않은 계정이에요')
  })

  it('tells a signed-in non-admin they lack permission (42501 from admin_report)', async () => {
    fake.auth.getSession.mockResolvedValue({ data: { session: { user: { email: 'guest@x.com', is_anonymous: false } } } })
    fake.rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'admin only' } })
    await renderPage()
    expect(await screen.findByText('관리자 권한이 없는 계정이에요')).toBeInTheDocument()
  })

  it('signs out back to the login form', async () => {
    const user = userEvent.setup()
    fake.auth.getSession.mockResolvedValue({ data: { session: { user: { email: 'team@jobda.dev', is_anonymous: false } } } })
    fake.rpc.mockResolvedValue({ data: demoReport(), error: null })
    await renderPage()
    await user.click(await screen.findByRole('button', { name: '로그아웃' }))
    await waitFor(() => expect(fake.auth.signOut).toHaveBeenCalled())
    expect(await screen.findByRole('button', { name: '로그인' })).toBeInTheDocument()
  })
})

describe('AdminTools', () => {
  const makeApi = (): AdminToolsApi & { reset: ReturnType<typeof vi.fn> } => ({
    counts: vi.fn(async () => ({ events_prod: 1200, events_dev: 30, chat_logs: 8, ut_reviews: 2, user_progress: 5, participants: ['P01', 'P02'] })),
    exportData: vi.fn(async () => ({})),
    reset: vi.fn(async () => ({ events: 30, chat_logs: 2, ut_reviews: 0, user_progress: 0 })),
  })

  it('shows how much data there is', async () => {
    render(<AdminTools api={makeApi()} />)
    expect(await screen.findByText('1,200')).toBeInTheDocument()
    expect(within(screen.getByText('활동 기록 (개발)').parentElement!).getByText('30')).toBeInTheDocument()
  })

  it('only deletes after the exact phrase is typed, then reports what was removed and refreshes', async () => {
    const user = userEvent.setup()
    const api = makeApi()
    const onChanged = vi.fn()
    render(<AdminTools api={api} onChanged={onChanged} />)
    const run = screen.getByRole('button', { name: '개발 기록 삭제' })
    expect(run).toBeDisabled()

    await user.type(screen.getByLabelText('개발 기록 삭제 확인 문구'), '개발 기록')
    expect(run).toBeDisabled()
    await user.type(screen.getByLabelText('개발 기록 삭제 확인 문구'), ' 삭제')
    await user.click(run)

    expect(api.reset).toHaveBeenCalledWith('dev', '개발 기록 삭제')
    expect(await screen.findByRole('status')).toHaveTextContent('활동 기록 30건, 채팅 원문 2건을 지웠어요.')
    expect(onChanged).toHaveBeenCalled()
    expect(api.counts).toHaveBeenCalledTimes(2)
  })

  it('deletes one participant only after choosing the code and typing it back', async () => {
    const user = userEvent.setup()
    const api = makeApi()
    render(<AdminTools api={api} />)
    const run = screen.getByRole('button', { name: '참가자 기록 삭제' })
    await screen.findByRole('option', { name: 'P02' })
    expect(screen.getByLabelText('참가자 기록 삭제 확인 문구')).toBeDisabled()

    await user.selectOptions(screen.getByLabelText('참가자 코드'), 'P02')
    await user.type(screen.getByLabelText('참가자 기록 삭제 확인 문구'), 'P01')
    expect(run).toBeDisabled()
    await user.clear(screen.getByLabelText('참가자 기록 삭제 확인 문구'))
    await user.type(screen.getByLabelText('참가자 기록 삭제 확인 문구'), 'P02')
    await user.click(screen.getByRole('button', { name: '참가자 기록 삭제' }))
    expect(api.reset).toHaveBeenCalledWith('participant', 'P02', 'P02')
  })

  it('says so when deleting fails', async () => {
    const user = userEvent.setup()
    const api = makeApi()
    api.reset.mockRejectedValueOnce(new Error('confirm mismatch'))
    render(<AdminTools api={api} />)
    await user.type(screen.getByLabelText('전체 초기화 확인 문구'), '전체 초기화')
    await user.click(screen.getByRole('button', { name: '전체 초기화' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('지우지 못했어요')
  })
})
