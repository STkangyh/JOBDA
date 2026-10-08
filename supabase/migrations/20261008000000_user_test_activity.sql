-- 유저 테스트용 Activity Log와 지표
-- 참가자는 테스트 링크(?ut=P07)로 들어오고, 그 탭의 모든 이벤트에 props.ut로 참가자 코드가 붙는다.
-- 원본 이벤트 이름은 바꾸지 않는다(쌓인 데이터·기존 집계가 깨지므로) — 아래 뷰가 유저 테스트 기획서의
-- 12개 활동 이름으로 바꿔 보여준다. 그래서 이 마이그레이션 이전에 쌓인 데이터에도 그대로 적용된다.
-- 진행자 개입·직무 이해 변화(사전/사후)는 기록 방식이 정해지면 따로 추가한다.

-- ─────────────────────────────────────────────────────────────
-- 1. 세션 이벤트 + 세션의 참가자 코드
--    코드가 잡히기 전 이벤트가 섞여 있어도 같은 세션이면 같은 참가자로 본다.
-- ─────────────────────────────────────────────────────────────
create or replace view analytics.session_events as
select e.*,
       max(e.props ->> 'ut') over (partition by e.session_id) as participant
from analytics.events_clean e
where e.session_id is not null
  and e.flow in ('s1', 's2');

-- ─────────────────────────────────────────────────────────────
-- 2. Activity Log — 기획서의 활동 이름으로 바꾼 행동 기록
-- ─────────────────────────────────────────────────────────────
create or replace view analytics.activity_log as
with mapped as (
  select participant, user_id, visit_id, session_id, flow, screen, client_ts as ts, seq,
         case
           when name = 'view_open' and props ->> 'view' like 'materials_doc:%'               then 'material_open'
           when name = 'view_open' and props ->> 'view' like 'messenger:%'                   then 'stakeholder_open'
           when name = 'ask'                                                                  then 'message_send'
           when name in ('decision_select', 'branch')
             or (name = 'submit' and props ->> 'target' = 'vendor_proposal')                  then 'decision_select'
           when name = 'submit' and (props ->> 'target' like 'round\_%'
                                     or props ->> 'target' in ('draft', 'vendor_report'))     then 'reason_submit'
           when name = 'revise'
             or (name = 'submit' and props ->> 'target' in ('final', 'final_approval'))       then 'revision_submit'
           when (name = 'screen_view' and screen in ('session2/senior_feedback', 'session2/final_feedback'))
             or (name = 'view_open' and props ->> 'view' = 'vendor_phase:feedback')           then 'feedback_receive'
           when name = 'screen_view' and screen like '%/self_assessment'                      then 'self_eval_start'
           when name = 'screen_view' and screen like '%/report'                               then 'report_view'
           when name = 'session_complete'                                                     then 'session_complete'
         end as activity,
         -- 자료명·관계자·선택지 등 무엇을 했는지. 채팅 원문은 넣지 않는다.
         coalesce(props ->> 'view', props ->> 'target', props ->> 'actor') as detail,
         props - 'ut' as props
  from analytics.session_events
),
starts as (
  select distinct on (session_id)
         participant, user_id, visit_id, session_id, flow, screen, client_ts as ts, seq,
         'session_start' as activity, screen as detail, '{}'::jsonb as props
  from analytics.session_events
  order by session_id, client_ts, seq
),
-- 중간 이탈: 완료 없이 30분 넘게 아무 기록이 없는 세션의 마지막 지점(아직 진행 중인 세션은 제외)
exits as (
  select * from (
    select distinct on (session_id)
           participant, user_id, visit_id, session_id, flow, screen, client_ts as ts, seq,
           'session_exit' as activity, screen as detail, '{}'::jsonb as props
    from analytics.session_events se
    where not exists (select 1 from analytics.session_events c
                      where c.session_id = se.session_id and c.name = 'session_complete')
    order by session_id, client_ts desc, seq desc
  ) last_event
  where ts < now() - interval '30 minutes'
)
select * from mapped where activity is not null
union all select * from starts
union all select * from exits;

-- ─────────────────────────────────────────────────────────────
-- 3. 참가자 세션별 지표 — Task Completion · Time on Task · 시스템 오류 · Drop-off
--    소요 시간은 시작부터 완료(미완료면 마지막 기록)까지. 탭을 내려둔 시간도 포함된다.
-- ─────────────────────────────────────────────────────────────
create or replace view analytics.ut_sessions as
with s as (
  select session_id,
         max(participant)                                                       as participant,
         max(flow)                                                              as flow,
         min(client_ts)                                                         as started_at,
         min(client_ts) filter (where name = 'session_complete')                as completed_at,
         max(client_ts)                                                         as last_at,
         count(*) filter (where name = 'ask')                                   as messages,
         count(*) filter (where name in ('chat_error', 'report_error', 'chat_retry')) as system_errors,
         (array_agg(screen order by client_ts desc, seq desc))[1]               as last_screen
  from analytics.session_events
  where participant is not null
  group by session_id
),
-- 단계 체류는 세션 안에서만 잰다 — 방문 단위(screen_occurrences)로 재면 세션1 리포트 다음에 같은 탭에서
-- 시작한 세션2 시간까지 세션1 마지막 단계에 붙는다. 마지막 단계는 세션의 마지막 기록에서 끝난다.
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
)
select s.participant, s.session_id, s.flow, s.started_at, s.completed_at, s.last_at,
       case when s.completed_at is not null then 'completed'
            when s.last_at >= now() - interval '30 minutes' then 'in_progress'
            else 'exited' end                                                   as status,
       round(extract(epoch from coalesce(s.completed_at, s.last_at) - s.started_at)::numeric) as time_on_task_s,
       case when s.completed_at is null then s.last_screen end                  as exit_screen,
       s.messages, s.system_errors,
       coalesce(stage.stage_seconds, '{}'::jsonb)                               as stage_seconds
from s
left join stage using (session_id);

-- 단계별 소요 시간 (참가자 세션 전체의 중앙값)
create or replace view analytics.ut_stage_times as
select u.flow, kv.key as screen,
       count(*)                                                                as sessions,
       round((percentile_cont(0.5) within group (order by kv.value::numeric))::numeric, 1) as median_s
from analytics.ut_sessions u
cross join lateral jsonb_each_text(u.stage_seconds) kv
group by u.flow, kv.key;

-- ─────────────────────────────────────────────────────────────
-- 4. 관리자 RPC — 리포트에 유저 테스트 지표 추가, 세션 하나의 활동 기록 조회
-- ─────────────────────────────────────────────────────────────
create or replace function public.admin_report(p_since timestamptz default null)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  perform pg_catalog.set_config('jobda.since', coalesce(p_since::text, ''), true);
  return jsonb_build_object(
    'since',     p_since,
    'overview',  (select to_jsonb(o) from analytics.overview o),
    'daily',     coalesce((select jsonb_agg(d order by d.day) from analytics.daily_activity d), '[]'::jsonb),
    'funnel_s1', coalesce((select jsonb_agg(f order by f.ord) from analytics.funnel_s1 f), '[]'::jsonb),
    'funnel_s2', coalesce((select jsonb_agg(f order by f.ord) from analytics.funnel_s2 f), '[]'::jsonb),
    'screens',   coalesce((select jsonb_agg(s order by s.views desc) from analytics.screen_stats s), '[]'::jsonb),
    'bounce',    coalesce((select jsonb_agg(b order by b.visits desc) from analytics.bounce_by_landing b), '[]'::jsonb),
    'views',     coalesce((select jsonb_agg(v order by v.opens desc) from analytics.view_stats v), '[]'::jsonb),
    'exits',     coalesce((select jsonb_agg(x order by x.visits desc)
                             from (select * from analytics.exit_context order by visits desc limit 20) x), '[]'::jsonb),
    'ut_sessions', coalesce((select jsonb_agg(u order by u.started_at desc)
                               from (select * from analytics.ut_sessions order by started_at desc limit 200) u), '[]'::jsonb),
    'ut_stages', coalesce((select jsonb_agg(t) from analytics.ut_stage_times t), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_report(timestamptz) from public, anon;
grant execute on function public.admin_report(timestamptz) to authenticated;

create or replace function public.admin_activity_log(p_session uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('ts', a.ts, 'activity', a.activity, 'screen', a.screen, 'detail', a.detail)
                                    order by a.ts, a.seq)
                   from analytics.activity_log a
                   where a.session_id = p_session), '[]'::jsonb);
end;
$$;
revoke all on function public.admin_activity_log(uuid) from public, anon;
grant execute on function public.admin_activity_log(uuid) to authenticated;
