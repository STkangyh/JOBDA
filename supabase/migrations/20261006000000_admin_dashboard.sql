-- JOBDA 관리자 페이지(/admin)용 — 팀원 전용, 집계 데이터만 (채팅 원문은 노출하지 않음)
-- 관리자 추가: Authentication → Users → Add user(이메일+비밀번호)로 계정을 만든 뒤
--   insert into public.admins (user_id, note) select id, '이름' from auth.users where email = '...';

-- ─────────────────────────────────────────────────────────────
-- 1. 관리자 명단 + 확인 함수
-- ─────────────────────────────────────────────────────────────
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;     -- 정책 없음 = API로는 아무도 못 봄
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admins a where a.user_id = auth.uid()) $$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. 분석 기준 이벤트 — 모든 분석 뷰가 이것만 읽는다
--    · 운영(prod)만 · 관리자 본인 활동 제외(팀원이 앱을 테스트한 기록이 섞이지 않게)
--    · /admin 화면 제외 · 기간 필터: 관리자 페이지가 트랜잭션 안에서 jobda.since를 설정하면 그 이후만
--      (SQL Editor에서 그냥 조회하면 설정이 없으므로 전체 기간)
-- ─────────────────────────────────────────────────────────────
create or replace view analytics.events_clean as
select e.*
from public.events e
where e.env = 'prod'
  and coalesce(e.screen, '') not like '/admin%'
  and not exists (select 1 from public.admins a where a.user_id = e.user_id)
  and e.client_ts >= coalesce(nullif(current_setting('jobda.since', true), '')::timestamptz, '-infinity'::timestamptz);

-- ─────────────────────────────────────────────────────────────
-- 3. 기존 분석 뷰를 events_clean 위로 다시 정의 (출력 컬럼은 그대로)
-- ─────────────────────────────────────────────────────────────
create or replace view analytics.screen_occurrences as
with ev as (
  select e.*,
         sum(case when e.name = 'screen_view' then 1 else 0 end)
           over (partition by e.visit_id order by e.client_ts, e.seq
                 rows between unbounded preceding and current row) as occ
  from analytics.events_clean e
),
grouped as (
  select visit_id, occ,
         (array_agg(user_id order by client_ts, seq))[1]    as user_id,
         (array_agg(session_id order by client_ts, seq))[1] as session_id,
         (array_agg(flow order by client_ts, seq))[1]       as flow,
         (array_agg(screen order by client_ts, seq))[1]     as screen,
         -- via가 없으면 NULL이 되어 "not via_jumper"에서 행이 통째로 빠지던 버그 수정(첫 마이그레이션)
         -- — screen_view 하나만 있는 체류(도착 직후 이탈 = 반송)가 집계에서 사라졌다.
         coalesce(bool_or(name = 'screen_view' and props ->> 'via' = 'jumper'), false) as via_jumper,
         min(client_ts) as started_at,
         max(client_ts) as last_event_at,
         count(*) filter (
           where name not in ('screen_view', 'visit_hide', 'visit_show', 'heartbeat', 'view_open', 'view_close')
              or (name = 'view_close' and props ->> 'how' = 'switch')
         ) as actions
  from ev
  where occ > 0
  group by visit_id, occ
)
select g.*,
       coalesce(lead(started_at) over w, last_event_at) as ended_at,
       extract(epoch from coalesce(lead(started_at) over w, last_event_at) - started_at) as duration_s,
       lead(started_at) over w is null as is_exit,
       occ = 1 as is_landing
from grouped g
window w as (partition by visit_id order by occ);

create or replace view analytics.view_stats as
with opens as (
  select screen, props ->> 'view' as view, props ->> 'kind' as kind, visit_id
  from analytics.events_clean
  where name = 'view_open'
),
closes as (
  select screen, props ->> 'view' as view, props ->> 'how' as how,
         (props ->> 'duration_ms')::numeric / 1000 as duration_s
  from analytics.events_clean
  where name = 'view_close'
),
last_events as (
  select distinct on (visit_id) visit_id, screen, view
  from analytics.events_clean
  where name not in ('heartbeat', 'visit_hide', 'visit_show')
  order by visit_id, client_ts desc, seq desc
)
select o.screen,
       o.view,
       max(o.kind)                as kind,
       count(*)                   as opens,
       count(distinct o.visit_id) as visits,
       round(100.0 * count(distinct o.visit_id) / nullif((
         select count(distinct s.visit_id) from analytics.screen_occurrences s where s.screen = o.screen
       ), 0), 1) as open_rate_pct,
       (select round((percentile_cont(0.5) within group (order by c.duration_s))::numeric, 1)
          from closes c where c.screen = o.screen and c.view = o.view) as median_duration_s,
       (select jsonb_object_agg(h.how, h.n)
          from (select c.how, count(*) as n from closes c
                where c.screen = o.screen and c.view = o.view group by c.how) h) as close_how,
       (select count(*) from last_events l where l.screen = o.screen and l.view = o.view) as exits_in_view
from opens o
group by o.screen, o.view
order by opens desc;

create or replace view analytics.exit_context as
with last_action as (
  select distinct on (visit_id) visit_id, screen, view, name
  from analytics.events_clean
  where name not in ('heartbeat', 'visit_hide', 'visit_show', 'view_open', 'view_close')
  order by visit_id, client_ts desc, seq desc
),
completed as (
  select distinct visit_id from analytics.events_clean where name = 'session_complete'
),
jumped as (
  select distinct visit_id from analytics.events_clean where name = 'screen_view' and props ->> 'via' = 'jumper'
)
select screen, view, name as last_action, count(*) as visits
from last_action
where visit_id not in (select visit_id from completed)
  and visit_id not in (select visit_id from jumped)
group by screen, view, name
order by visits desc;

create or replace view analytics.abandoned_last_chat as
with last_ask as (
  select distinct on (session_id) session_id, props ->> 'message_id' as message_id, client_ts
  from analytics.events_clean
  where name = 'ask' and session_id is not null and props ? 'message_id'
  order by session_id, client_ts desc, seq desc
)
select la.session_id, la.client_ts, c.persona, c.message, c.reply, c.intent, c.status, c.latency_ms
from last_ask la
join public.chat_logs c on c.message_id = la.message_id::uuid and c.env = 'prod'
where la.session_id not in (
  select session_id from analytics.events_clean where name = 'session_complete' and session_id is not null
);

-- screen_stats · bounce_by_landing · funnel_s1 · funnel_s2는 screen_occurrences만 읽으므로
-- 다시 정의하지 않아도 위 변경(관리자 제외·기간 필터)이 그대로 적용된다.

-- ─────────────────────────────────────────────────────────────
-- 4. 관리자 페이지 요약 지표
-- ─────────────────────────────────────────────────────────────
create or replace view analytics.overview as
select count(distinct visit_id) as visits,
       count(distinct user_id)  as users,
       count(distinct session_id) filter (
         where name = 'screen_view' and screen in ('session1/brief', 'session2/brief') and coalesce(props ->> 'via', '') <> 'jumper'
       ) as sessions_started,
       count(distinct session_id) filter (where name = 'session_complete') as sessions_completed
from analytics.events_clean;

-- 일별 추이 (한국 시간 기준 날짜)
create or replace view analytics.daily_activity as
select (client_ts at time zone 'Asia/Seoul')::date as day,
       count(distinct visit_id) as visits,
       count(distinct user_id)  as users,
       count(distinct session_id) filter (
         where name = 'screen_view' and screen in ('session1/brief', 'session2/brief') and coalesce(props ->> 'via', '') <> 'jumper'
       ) as sessions_started,
       count(distinct session_id) filter (where name = 'session_complete') as sessions_completed
from analytics.events_clean
group by 1;

-- ─────────────────────────────────────────────────────────────
-- 5. 관리자 전용 RPC — 페이지가 이것 하나만 호출한다(같은 기간으로 잘린 한 덩어리라 숫자가 서로 맞는다)
--    채팅 원문(abandoned_last_chat, chat_logs)은 일부러 포함하지 않는다.
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
                             from (select * from analytics.exit_context order by visits desc limit 20) x), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_report(timestamptz) from public, anon;
grant execute on function public.admin_report(timestamptz) to authenticated;
