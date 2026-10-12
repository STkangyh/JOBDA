-- UT 운영 문서(Admin 중심) 반영
-- · 이벤트: UT 회차(props.ut_round), 단계 진입/완료 분리(step_enter/step_complete), 자기평가 완료,
--   오류(error_occurred), 명시적 종료(session_exit — 종료 버튼, 화면은 디자인 확정 후)
-- · 세션 상태: 완료 / 명시적 종료 / 진행 중(마지막 기록 후 30일 관찰) / 미완료
--   완료 기록이 없다고 바로 이탈로 보지 않는다 — 30일 안에 돌아올 수 있다.
-- · 관리자 검토(ut_reviews): 문제 유형·원인·근거·메모. 확인된 사실(로그)과 추정 원인을 분리해 기록한다.

-- ─────────────────────────────────────────────────────────────
-- 1. 관리자 검토 기록 — 관리자만 읽고 쓴다
-- ─────────────────────────────────────────────────────────────
create table if not exists public.ut_reviews (
  session_id  uuid primary key,
  issue_type  text not null check (issue_type in ('dropoff', 'friction', 'tech_error', 'none')),
  -- 원인 선택지는 팀이 정해서 바뀔 수 있으므로 DB에서 목록을 고정하지 않는다(기본값 = 원인 불명)
  reason      text not null default 'unknown' check (char_length(reason) between 1 and 64),
  evidence    text not null check (evidence in ('log', 'survey', 'recording', 'multiple')),
  note        text not null default '' check (char_length(note) <= 4000),
  reviewed_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.ut_reviews enable row level security;
drop policy if exists "admins read reviews" on public.ut_reviews;
drop policy if exists "admins write reviews" on public.ut_reviews;
drop policy if exists "admins update reviews" on public.ut_reviews;
create policy "admins read reviews" on public.ut_reviews for select to authenticated using (public.is_admin());
create policy "admins write reviews" on public.ut_reviews for insert to authenticated with check (public.is_admin());
create policy "admins update reviews" on public.ut_reviews for update to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.ut_reviews from anon, authenticated;
grant select, insert, update on public.ut_reviews to authenticated;

-- 수정할 때마다 누가 언제 고쳤는지 서버가 채운다(브라우저가 보낸 값은 믿지 않는다)
create or replace function public.ut_reviews_touch()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.reviewed_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists ut_reviews_touch on public.ut_reviews;
create trigger ut_reviews_touch before insert or update on public.ut_reviews
  for each row execute function public.ut_reviews_touch();

-- ─────────────────────────────────────────────────────────────
-- 2. 세션 이벤트 + 참가자 코드 + UT 회차 (회차 컬럼을 끝에 추가)
-- ─────────────────────────────────────────────────────────────
create or replace view analytics.session_events as
select e.*,
       max(e.props ->> 'ut') over (partition by e.session_id)       as participant,
       max(e.props ->> 'ut_round') over (partition by e.session_id) as ut_round
from analytics.events_clean e
where e.session_id is not null
  and e.flow in ('s1', 's2');

-- ─────────────────────────────────────────────────────────────
-- 3. Activity Log — UT 문서의 이벤트 이름
--    nth = 같은 세션에서 같은 활동·대상이 몇 번째인지(2 이상이면 재열람·재진입, 수정 횟수)
--    완료 없이 멈춘 세션의 "추정 이탈" 행은 더 이상 만들지 않는다 — 문서상 session_exit는
--    종료 버튼 클릭만 뜻하고, 미완료 여부는 세션 상태(ut_sessions.status)로 본다.
-- ─────────────────────────────────────────────────────────────
drop view if exists analytics.activity_log cascade;
create view analytics.activity_log as
with mapped as (
  select participant, ut_round, user_id, visit_id, session_id, flow, screen, client_ts as ts, seq,
         case
           when name = 'screen_view' and screen in ('session2/senior_feedback', 'session2/final_feedback') then 'feedback_receive'
           when name = 'view_open' and props ->> 'view' = 'vendor_phase:feedback'                          then 'feedback_receive'
           when name = 'screen_view' and screen like '%/self_assessment'                                    then 'self_eval_start'
           when name = 'screen_view' and screen like '%/report'                                             then 'report_view'
           when name = 'step_complete'                                                                      then 'step_complete'
           when name = 'view_open' and props ->> 'view' like 'materials_doc:%'                             then 'material_open'
           when name = 'view_open' and props ->> 'view' like 'messenger:%'                                 then 'stakeholder_open'
           when name = 'ask'                                                                                then 'message_send'
           when name = 'submit' and props ->> 'target' = 'self_assessment'                                  then 'self_eval_submit'
           when name in ('decision_select', 'branch')
             or (name = 'submit' and props ->> 'target' = 'vendor_proposal')                                then 'decision_select'
           when name = 'submit' and (props ->> 'target' like 'round\_%'
                                     or props ->> 'target' in ('draft', 'vendor_report'))                   then 'reason_submit'
           when name = 'revise'
             or (name = 'submit' and props ->> 'target' in ('final', 'final_approval'))                     then 'revision_submit'
           when name in ('chat_error', 'report_error')                                                      then 'error_occurred'
           when name = 'session_exit'                                                                       then 'session_exit'
           when name = 'session_complete'                                                                   then 'session_complete'
         end as activity,
         case
           when name in ('chat_error', 'report_error') then replace(name, '_error', '')
           when name = 'step_complete' then props ->> 'step'
           when name = 'screen_view' then split_part(screen, '/', 2)
           else coalesce(props ->> 'view', props ->> 'target', props ->> 'actor', props ->> 'step')
         end as detail,
         props - 'ut' - 'ut_round' as props
  from analytics.session_events
),
-- 단계 진입: 세션 단계 화면에 들어온 모든 순간(같은 단계 재진입 포함). 위 매핑과 별도 행이다.
enters as (
  select participant, ut_round, user_id, visit_id, session_id, flow, screen, client_ts as ts, seq,
         'step_enter' as activity, split_part(screen, '/', 2) as detail, '{}'::jsonb as props
  from analytics.session_events
  where name = 'screen_view' and coalesce(props ->> 'via', '') <> 'jumper'
),
starts as (
  select distinct on (session_id)
         participant, ut_round, user_id, visit_id, session_id, flow, screen, client_ts as ts, seq,
         'session_start' as activity, screen as detail, '{}'::jsonb as props
  from analytics.session_events
  order by session_id, client_ts, seq
),
rows_all as (
  select * from mapped where activity is not null
  union all select * from enters
  union all select * from starts
)
select r.*,
       row_number() over (partition by r.session_id, r.activity, r.detail order by r.ts, r.seq) as nth
from rows_all r;

-- ─────────────────────────────────────────────────────────────
-- 4. 참가자 세션 지표 (컬럼을 끝에 추가하므로 다시 만든다 — 위 cascade로 지워졌을 수 있음)
-- ─────────────────────────────────────────────────────────────
drop view if exists analytics.ut_stage_times;
drop view if exists analytics.ut_sessions;
create view analytics.ut_sessions as
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
         (array_agg(screen order by client_ts desc, seq desc))[1]               as last_screen
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
       (select to_jsonb(r) - 'session_id' from public.ut_reviews r where r.session_id = s.session_id) as review
from s
left join stage using (session_id)
left join act using (session_id)
left join rev using (session_id)
left join last_act la using (session_id);

create view analytics.ut_stage_times as
select u.flow, kv.key as screen,
       count(*)                                                                as sessions,
       round((percentile_cont(0.5) within group (order by kv.value::numeric))::numeric, 1) as median_s
from analytics.ut_sessions u
cross join lateral jsonb_each_text(u.stage_seconds) kv
group by u.flow, kv.key;

-- ─────────────────────────────────────────────────────────────
-- 5. 세션 타임라인 RPC — 반복 표시(nth)를 함께 돌려준다
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_activity_log(p_session uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('ts', a.ts, 'activity', a.activity, 'screen', a.screen,
                                                       'detail', a.detail, 'nth', a.nth)
                                    order by a.ts, a.seq,
                                             case a.activity when 'session_start' then 0 when 'step_enter' then 1 else 2 end)
                   from analytics.activity_log a
                   where a.session_id = p_session), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_activity_log(uuid) from public, anon;
grant execute on function public.admin_activity_log(uuid) to authenticated;
