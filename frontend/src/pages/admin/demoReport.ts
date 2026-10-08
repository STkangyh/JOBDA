import { kstDay, type ActivityRow, type AdminReport, type UtSession } from './report'

// 개발 서버 /admin?demo 전용 샘플 — 실제 데이터 없이 화면 배치·라벨·차트를 확인하는 용도.
export function demoReport(now = Date.now()): AdminReport {
  const daily = Array.from({ length: 30 }, (_, i) => {
    const visits = Math.round(18 + 10 * Math.sin(i / 3) + i * 0.6)
    const started = Math.round(visits * 0.45)
    return {
      day: kstDay(now - (29 - i) * 86_400_000),
      visits,
      users: Math.round(visits * 0.8),
      sessions_started: started,
      sessions_completed: Math.round(started * 0.38),
    }
  })
  const sum = (k: 'visits' | 'users' | 'sessions_started' | 'sessions_completed') => daily.reduce((a, d) => a + d[k], 0)
  const s2 = [214, 188, 161, 97, 88, 70, 64, 61]
  const s2Stages = ['brief', 'materials', 'workspace', 'senior_feedback', 'final_feedback', 'vendor_compare', 'self_assessment', 'report']
  const s1 = [92, 80, 71, 52, 49, 47]
  const s1Stages = ['brief', 'materials', 'round', 'final_check', 'self_assessment', 'report']
  return {
    since: null,
    overview: { visits: sum('visits'), users: sum('users'), sessions_started: sum('sessions_started'), sessions_completed: sum('sessions_completed') },
    daily,
    funnel_s2: s2Stages.map((stage, i) => ({ ord: i + 1, stage, sessions: s2[i], pct_of_start: Math.round((s2[i] / s2[0]) * 1000) / 10 })),
    funnel_s1: s1Stages.map((stage, i) => ({ ord: i + 1, stage, sessions: s1[i], pct_of_start: Math.round((s1[i] / s1[0]) * 1000) / 10 })),
    screens: [
      { screen: '/', views: 612, visits: 540, exits: 198, exit_rate_pct: 32.4, median_duration_s: 21 },
      { screen: '/explore/job', views: 401, visits: 377, exits: 92, exit_rate_pct: 22.9, median_duration_s: 48 },
      { screen: 'session2/brief', views: 230, visits: 214, exits: 18, exit_rate_pct: 7.8, median_duration_s: 95 },
      { screen: 'session2/workspace', views: 290, visits: 161, exits: 54, exit_rate_pct: 18.6, median_duration_s: 412 },
      { screen: 'session2/senior_feedback', views: 101, visits: 97, exits: 6, exit_rate_pct: 5.9, median_duration_s: 64 },
      { screen: 'session2/vendor_compare', views: 75, visits: 70, exits: 6, exit_rate_pct: 8, median_duration_s: 301 },
      { screen: 'session1/round', views: 140, visits: 71, exits: 19, exit_rate_pct: 13.6, median_duration_s: 188 },
    ],
    bounce: [
      { landing: '/', visits: 498, bounces: 141, bounce_rate_pct: 28.3 },
      { landing: '/explore/job', visits: 42, bounces: 9, bounce_rate_pct: 21.4 },
      { landing: 'session2/workspace', visits: 31, bounces: 4, bounce_rate_pct: 12.9 },
    ],
    views: [
      { screen: 'session2/workspace', view: 'messenger:senior', kind: 'tab', opens: 320, visits: 160, open_rate_pct: 99.4, median_duration_s: 96, close_how: { switch: 201, navigate: 110 }, exits_in_view: 21 },
      { screen: 'session2/workspace', view: 'messenger:engineering', kind: 'tab', opens: 188, visits: 120, open_rate_pct: 74.5, median_duration_s: 71, close_how: { switch: 140, navigate: 41 }, exits_in_view: 17 },
      { screen: 'session2/workspace', view: 'workspace_mode:draft', kind: 'panel', opens: 161, visits: 161, open_rate_pct: 100, median_duration_s: 280, close_how: { switch: 97, navigate: 60 }, exits_in_view: 33 },
      { screen: 'session2/materials', view: 'materials_doc:limit_sample', kind: 'panel', opens: 122, visits: 109, open_rate_pct: 58, median_duration_s: 34, close_how: { switch: 40, navigate: 79 }, exits_in_view: 3 },
      { screen: 'session2/vendor_compare', view: 'vendor_phase:research', kind: 'panel', opens: 70, visits: 70, open_rate_pct: 100, median_duration_s: 210, close_how: { switch: 64, navigate: 2 }, exits_in_view: 4 },
    ],
    exits: [
      { screen: '/', view: null, last_action: 'screen_view', visits: 141 },
      { screen: '/', view: null, last_action: 'job_select', visits: 57 },
      { screen: 'session2/workspace', view: 'messenger:engineering', last_action: 'ask', visits: 22 },
      { screen: 'session2/workspace', view: 'workspace_mode:draft', last_action: 'chat_error', visits: 9 },
      { screen: 'session1/round', view: 'round:2', last_action: 'submit', visits: 8 },
    ],
    ut_sessions: demoUtSessions(now),
    ut_stages: [
      { flow: 's1', screen: 'session1/brief', sessions: 4, median_s: 95 },
      { flow: 's1', screen: 'session1/materials', sessions: 4, median_s: 160 },
      { flow: 's1', screen: 'session1/round', sessions: 4, median_s: 620 },
      { flow: 's1', screen: 'session1/self_assessment', sessions: 3, median_s: 140 },
      { flow: 's2', screen: 'session2/brief', sessions: 3, median_s: 110 },
      { flow: 's2', screen: 'session2/workspace', sessions: 3, median_s: 905 },
      { flow: 's2', screen: 'session2/vendor_compare', sessions: 2, median_s: 330 },
    ],
  }
}

function demoUtSessions(now: number): UtSession[] {
  const at = (minAgo: number) => new Date(now - minAgo * 60_000).toISOString()
  const row = (p: string, flow: 's1' | 's2', ago: number, status: UtSession['status'], dur: number, exit: string | null, messages: number, errors: number): UtSession => ({
    participant: p,
    session_id: `00000000-0000-0000-0000-${String(ago).padStart(12, '0')}`,
    flow,
    started_at: at(ago),
    completed_at: status === 'completed' ? at(ago - dur / 60) : null,
    last_at: at(ago - dur / 60),
    status,
    time_on_task_s: dur,
    exit_screen: exit,
    messages,
    system_errors: errors,
    stage_seconds: {},
  })
  return [
    row('P04', 's2', 20, 'in_progress', 840, null, 6, 0),
    row('P03', 's2', 90, 'exited', 1310, 'session2/workspace', 9, 2),
    row('P02', 's1', 180, 'completed', 1490, null, 7, 0),
    row('P01', 's1', 300, 'completed', 1720, null, 11, 1),
  ]
}

export function demoTimeline(now = Date.now()): ActivityRow[] {
  const t = (sec: number) => new Date(now - 3_600_000 + sec * 1000).toISOString()
  return [
    { ts: t(0), activity: 'session_start', screen: 'session1/brief', detail: 'session1/brief' },
    { ts: t(95), activity: 'material_open', screen: 'session1/materials', detail: 'materials_doc:concept_a' },
    { ts: t(130), activity: 'material_open', screen: 'session1/materials', detail: 'materials_doc:design_guide' },
    { ts: t(260), activity: 'stakeholder_open', screen: 'session1/round', detail: 'messenger:engineering' },
    { ts: t(300), activity: 'message_send', screen: 'session1/round', detail: 'engineering' },
    { ts: t(420), activity: 'decision_select', screen: 'session1/round', detail: 'round_1' },
    { ts: t(510), activity: 'reason_submit', screen: 'session1/round', detail: 'round_1' },
    { ts: t(1300), activity: 'self_eval_start', screen: 'session1/self_assessment', detail: null },
    { ts: t(1440), activity: 'report_view', screen: 'session1/report', detail: null },
    { ts: t(1490), activity: 'session_complete', screen: 'session1/report', detail: null },
  ]
}
