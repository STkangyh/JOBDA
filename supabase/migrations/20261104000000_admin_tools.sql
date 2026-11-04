-- 관리자 페이지: 참가자가 고른 종료 이유 + 데이터 관리 도구 (2026-11-04)
-- 실행: Supabase 대시보드 → SQL Editor에 붙여넣고 실행 (또는 supabase db push)
-- 이 파일은 뷰와 함수만 만든다. 실행해도 데이터는 바뀌지 않는다 — 삭제는 관리자가 페이지에서 직접 실행할 때만.

-- ─────────────────────────────────────────────────────────────
-- 1. 세션 지표에 종료 이유 추가 (끝에 컬럼 두 개만 더한다 — 나머지는 20261010000000_ut_review.sql과 같다)
--    나가기 확인 창에서 고른 이유(session_exit 이벤트의 props.reasons, props.note).
--    같은 세션에서 여러 번 나갔다면 마지막 응답을 쓴다.
-- ─────────────────────────────────────────────────────────────
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
         (array_agg(props ->> 'note' order by client_ts desc, seq desc) filter (where name = 'session_exit'))[1]   as exit_note
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
       s.exit_note
from s
left join stage using (session_id)
left join act using (session_id)
left join rev using (session_id)
left join last_act la using (session_id);

-- ─────────────────────────────────────────────────────────────
-- 2. 데이터 관리 — 관리자만. 모두 기간 필터와 무관하게 전체를 본다.
-- ─────────────────────────────────────────────────────────────

-- 테이블별 건수
create or replace function public.admin_data_counts()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'events_prod',   (select count(*) from public.events where env = 'prod'),
    'events_dev',    (select count(*) from public.events where env = 'dev'),
    'chat_logs',     (select count(*) from public.chat_logs),
    'ut_reviews',    (select count(*) from public.ut_reviews),
    'user_progress', (select count(*) from public.user_progress),
    'participants',  coalesce((select jsonb_agg(p order by p)
                               from (select distinct props ->> 'ut' as p from public.events where props ? 'ut') x), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_data_counts() from public, anon;
grant execute on function public.admin_data_counts() to authenticated;

-- 백업: 활동 기록과 관리자 검토. 채팅 원문(chat_logs)과 진행 기록(대화 원문 포함)은 관리자 페이지에
-- 노출하지 않는다는 원칙대로 빼고, 필요하면 Supabase 대시보드에서 직접 내보낸다.
create or replace function public.admin_export_data()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'exported_at', now(),
    'events',      coalesce((select jsonb_agg(e order by e.id) from public.events e), '[]'::jsonb),
    'ut_reviews',  coalesce((select jsonb_agg(r) from public.ut_reviews r), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_export_data() from public, anon;
grant execute on function public.admin_export_data() to authenticated;

-- 삭제. 실수로 불리지 않게 확인 문구를 서버에서도 한 번 더 맞춰 본다.
--   dev         개발 환경 기록(env = 'dev')의 활동 기록·채팅 원문      확인 문구: 개발 기록 삭제
--   participant 참가자 코드 하나의 세션 기록·채팅 원문·관리자 검토       확인 문구: 그 참가자 코드
--   all         활동 기록·채팅 원문·관리자 검토·계정 진행 기록 전부     확인 문구: 전체 초기화
-- 계정(auth.users)과 관리자 명단은 지우지 않는다.
create or replace function public.admin_reset_data(p_scope text, p_confirm text, p_participant text default null)
returns jsonb
language plpgsql volatile security definer set search_path = ''
as $$
declare
  n_events int := 0;
  n_chats int := 0;
  n_reviews int := 0;
  n_progress int := 0;
  sessions uuid[];
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  if p_scope = 'dev' then
    if p_confirm is distinct from '개발 기록 삭제' then
      raise exception 'confirm mismatch' using errcode = '22023';
    end if;
    delete from public.events where env = 'dev';
    get diagnostics n_events = row_count;
    delete from public.chat_logs where env = 'dev';
    get diagnostics n_chats = row_count;

  elsif p_scope = 'participant' then
    if coalesce(p_participant, '') = '' or p_confirm is distinct from p_participant then
      raise exception 'confirm mismatch' using errcode = '22023';
    end if;
    select coalesce(array_agg(distinct session_id), '{}') into sessions
    from public.events
    where session_id is not null and props ->> 'ut' = p_participant;
    delete from public.events where session_id = any (sessions);
    get diagnostics n_events = row_count;
    delete from public.chat_logs where session_id = any (sessions);
    get diagnostics n_chats = row_count;
    delete from public.ut_reviews where session_id = any (sessions);
    get diagnostics n_reviews = row_count;

  elsif p_scope = 'all' then
    if p_confirm is distinct from '전체 초기화' then
      raise exception 'confirm mismatch' using errcode = '22023';
    end if;
    delete from public.events where true;
    get diagnostics n_events = row_count;
    delete from public.chat_logs where true;
    get diagnostics n_chats = row_count;
    delete from public.ut_reviews where true;
    get diagnostics n_reviews = row_count;
    delete from public.user_progress where true;
    get diagnostics n_progress = row_count;

  else
    raise exception 'unknown scope' using errcode = '22023';
  end if;

  return jsonb_build_object('events', n_events, 'chat_logs', n_chats, 'ut_reviews', n_reviews, 'user_progress', n_progress);
end;
$$;
revoke all on function public.admin_reset_data(text, text, text) from public, anon;
grant execute on function public.admin_reset_data(text, text, text) to authenticated;
