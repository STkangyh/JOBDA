-- 관리자 페이지: 모범답안을 몇 번 열었는지 (2026-11-05)
-- 실행: Supabase 대시보드 → SQL Editor에 붙여넣고 실행 (또는 supabase db push)
-- 이 파일은 뷰만 바꾼다. 실행해도 데이터는 바뀌지 않는다.
--
-- 모범답안은 언제든 볼 수 있어서(2026-11-03 결정) 이해도 점수에서는 빼지 않고, 본 횟수만 따로 보여준다
-- (2026-11-05 결정). 시방서 화면의 모범답안 칩이 남기는 model_answer_view 이벤트를 센다.
-- 끝에 컬럼 하나만 더한다 — 나머지는 20261104000000_admin_tools.sql과 같다.

create or replace view analytics.ut_sessions as
with s as (
  select session_id,
         max(participant)                                                       as participant,
         max(ut_round)                                                          as ut_round,
         max(flow)                                                              as flow,
         min(client_ts)                                                         as started_at,
         min(client_ts) filter (where name = 'session_complete')                as completed_at,
         min(client_ts) filter (where name = 'session_exit')                    as exited_at,
         max(client_ts)                                                         as last_at,
         count(*) filter (where name = 'ask')                                   as messages,
         count(*) filter (where name in ('chat_error', 'report_error', 'chat_retry')) as system_errors,
         (array_agg(screen order by client_ts desc, seq desc))[1]               as last_screen,
         (array_agg(props -> 'reasons' order by client_ts desc, seq desc) filter (where name = 'session_exit'))[1] as exit_reasons,
         (array_agg(props ->> 'note' order by client_ts desc, seq desc) filter (where name = 'session_exit'))[1]   as exit_note,
         count(*) filter (where name = 'model_answer_view')                     as model_answer_views
  from analytics.session_events
  where participant is not null
  group by session_id
),
sv as (
  select session_id, screen, client_ts,
         lead(client_ts) over (partition by session_id order by client_ts, seq) as next_ts
  from analytics.session_events
  where participant is not null
    and name = 'screen_view'
    and coalesce(props ->> 'via', '') <> 'jumper'
),
stage as (
  select x.session_id, jsonb_object_agg(x.screen, x.seconds) as stage_seconds
  from (select sv.session_id, sv.screen,
               round(sum(extract(epoch from coalesce(sv.next_ts, s.last_at) - sv.client_ts))::numeric) as seconds
        from sv join s using (session_id)
        group by sv.session_id, sv.screen) x
  group by x.session_id
),
act as (
  select a.session_id,
         bool_or(a.activity = 'reason_submit')                                  as m_first_judgment,
         min(a.ts) filter (where a.activity = 'feedback_receive')               as first_feedback_at,
         bool_or(a.activity = 'self_eval_submit')                               as m_self_eval,
         bool_or(a.activity = 'report_view')                                    as m_report,
         count(*) filter (where a.activity in ('material_open', 'stakeholder_open') and a.nth > 1) as repeat_opens
  from analytics.activity_log a
  where a.participant is not null
  group by a.session_id
),
rev as (
  select a.session_id, bool_or(a.activity = 'revision_submit' and a.ts > act.first_feedback_at) as m_revision
  from analytics.activity_log a join act using (session_id)
  group by a.session_id
),
last_act as (
  select distinct on (a.session_id) a.session_id, a.activity as last_activity, a.detail as last_detail, a.ts as last_activity_at
  from analytics.activity_log a
  where a.participant is not null and a.activity not in ('step_enter')
  order by a.session_id, a.ts desc, a.seq desc
)
select s.participant, s.session_id, s.flow, s.started_at, s.completed_at, s.last_at,
       case when s.completed_at is not null then 'completed'
            when s.exited_at is not null then 'exited'
            when s.last_at >= now() - interval '30 days' then 'in_progress'
            else 'incomplete' end                                               as status,
       round(extract(epoch from coalesce(s.completed_at, s.exited_at, s.last_at) - s.started_at)::numeric) as time_on_task_s,
       case when s.completed_at is null then s.last_screen end                  as exit_screen,
       s.messages, s.system_errors,
       coalesce(stage.stage_seconds, '{}'::jsonb)                               as stage_seconds,
       s.ut_round,
       s.last_screen,
       la.last_activity, la.last_detail, la.last_activity_at,
       coalesce(act.m_first_judgment, false)                                    as m_first_judgment,
       act.first_feedback_at is not null                                        as m_feedback,
       coalesce(rev.m_revision, false)                                          as m_revision,
       coalesce(act.m_self_eval, false)                                         as m_self_eval,
       coalesce(act.m_report, false)                                            as m_report,
       coalesce(act.repeat_opens, 0)                                            as repeat_opens,
       (select to_jsonb(r) - 'session_id' from public.ut_reviews r where r.session_id = s.session_id) as review,
       s.exit_reasons,
       s.exit_note,
       s.model_answer_views
from s
left join stage using (session_id)
left join act using (session_id)
left join rev using (session_id)
left join last_act la using (session_id);
