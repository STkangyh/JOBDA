-- JOBDA 사용자 활동 로그
-- 실행: Supabase 대시보드 → SQL Editor에 붙여넣고 실행 (또는 supabase db push)
-- 사전 설정: Authentication → Sign In / Providers → "Allow anonymous sign-ins" 켜기

-- ─────────────────────────────────────────────────────────────
-- 1. 프론트 활동 이벤트 (브라우저 → REST로 직접 insert)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  user_id    uuid default auth.uid() references auth.users (id) on delete set null,
  visit_id   uuid not null,
  session_id uuid,
  flow       text not null check (flow in ('explore', 's1', 's2')),
  screen     text,
  view       text,
  view_path  text,
  name       text not null check (char_length(name) <= 64),
  props      jsonb not null default '{}' check (pg_column_size(props) <= 4096),
  seq        int,
  client_ts  timestamptz not null,
  env        text not null check (env in ('prod', 'dev')),
  created_at timestamptz not null default now()
);

create index if not exists events_visit_idx   on public.events (visit_id, client_ts, seq);
create index if not exists events_session_idx on public.events (session_id);
create index if not exists events_name_idx    on public.events (name, created_at);
create index if not exists events_user_idx    on public.events (user_id, created_at);

-- 공개 키(anon key)는 브라우저에 노출되므로 권한(RLS)이 실제 보호 장치다:
-- 로그인한(익명 포함) 사용자는 자기 user_id로만 쓸 수 있고, 아무도 읽을 수 없다.
alter table public.events enable row level security;
drop policy if exists "insert own events" on public.events;
create policy "insert own events" on public.events
  for insert to authenticated
  with check (user_id = auth.uid());
revoke all on public.events from anon, authenticated;
grant insert on public.events to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. AI 채팅 원문 (브라우저가 AI 답변을 받은 뒤 직접 insert)
--    백엔드 레포(girugi)는 DB를 쓰지 않는 규칙이라 프론트가 저장한다. events의 ask 이벤트와
--    message_id로 1:1 연결된다. 메신저 입력창 아래에 보관 안내 문구를 노출한다.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.chat_logs (
  id         bigint generated always as identity primary key,
  user_id    uuid default auth.uid() references auth.users (id) on delete set null,
  message_id uuid not null unique,
  visit_id   uuid not null,
  session_id uuid,
  flow       text not null check (flow in ('explore', 's1', 's2')),
  persona    text not null check (char_length(persona) <= 32),
  message    text not null check (char_length(message) <= 1000),   -- 입력창 maxLength 300
  reply      text check (char_length(reply) <= 8000),
  intent     text check (char_length(intent) <= 64),
  disclose   text[],
  status     text not null check (status in ('ok', 'llm_error')),  -- 백엔드 JSON 파싱 폴백은 intent = 'unknown'
  latency_ms int,
  client_ts  timestamptz not null,
  env        text not null check (env in ('prod', 'dev')),
  created_at timestamptz not null default now()
);

create index if not exists chat_logs_session_idx on public.chat_logs (session_id);
create index if not exists chat_logs_created_idx on public.chat_logs (created_at);

-- events와 같은 원칙: 자기 user_id로만 쓰고, 아무도(본인 포함) 읽을 수 없다. 조회는 대시보드에서만.
alter table public.chat_logs enable row level security;
drop policy if exists "insert own chat logs" on public.chat_logs;
create policy "insert own chat logs" on public.chat_logs
  for insert to authenticated
  with check (user_id = auth.uid());
revoke all on public.chat_logs from anon, authenticated;
grant insert on public.chat_logs to authenticated;

-- 채팅 원문 보관 기간(30일)은 20261007010000_chat_logs_retention.sql에서 pg_cron으로 설정한다.

-- ─────────────────────────────────────────────────────────────
-- 3. 분석 뷰 — API로 노출되지 않는 analytics 스키마에 둔다 (SQL Editor에서만 조회)
--    시간 계산은 서버 수신 시각(created_at, 5초 묶음 전송이라 부정확) 대신 client_ts 기준.
-- ─────────────────────────────────────────────────────────────
create schema if not exists analytics;
revoke all on schema analytics from anon, authenticated;

-- 화면 1회 체류 = screen_view부터 다음 screen_view 직전까지. 방문의 마지막 체류가 이탈.
create or replace view analytics.screen_occurrences as
with ev as (
  select e.*,
         sum(case when e.name = 'screen_view' then 1 else 0 end)
           over (partition by e.visit_id order by e.client_ts, e.seq
                 rows between unbounded preceding and current row) as occ
  from public.events e
  where e.env = 'prod'
),
grouped as (
  select visit_id, occ,
         (array_agg(user_id order by client_ts, seq))[1]    as user_id,
         (array_agg(session_id order by client_ts, seq))[1] as session_id,
         (array_agg(flow order by client_ts, seq))[1]       as flow,
         (array_agg(screen order by client_ts, seq))[1]     as screen,
         bool_or(name = 'screen_view' and props ->> 'via' = 'jumper') as via_jumper,
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

-- 화면별 조회수 · 이탈률 · 체류 시간 중앙값
create or replace view analytics.screen_stats as
select screen,
       count(*)                                                        as views,
       count(distinct visit_id)                                        as visits,
       count(*) filter (where is_exit)                                 as exits,
       round(100.0 * count(*) filter (where is_exit) / count(*), 1)    as exit_rate_pct,
       round((percentile_cont(0.5) within group (order by duration_s))::numeric, 1) as median_duration_s
from analytics.screen_occurrences
where not via_jumper
group by screen
order by views desc;

-- 첫 화면별 반송률: 첫 화면 하나만 보고 아무 행동 없이 나간 방문 비율
create or replace view analytics.bounce_by_landing as
with visits as (
  select visit_id,
         max(screen) filter (where is_landing) as landing,
         count(*)                               as screens,
         sum(actions)                           as actions
  from analytics.screen_occurrences
  group by visit_id
)
select landing,
       count(*)                                                                 as visits,
       count(*) filter (where screens = 1 and actions = 0)                      as bounces,
       round(100.0 * count(*) filter (where screens = 1 and actions = 0) / count(*), 1) as bounce_rate_pct
from visits
group by landing
order by visits desc;

-- 화면 안 탭·모달·패널: 열어본 비율 · 체류 시간 · 닫은 방식 · 그 뷰에서 이탈한 방문 수
create or replace view analytics.view_stats as
with opens as (
  select screen, props ->> 'view' as view, props ->> 'kind' as kind, visit_id
  from public.events
  where env = 'prod' and name = 'view_open'
),
closes as (
  select screen, props ->> 'view' as view, props ->> 'how' as how,
         (props ->> 'duration_ms')::numeric / 1000 as duration_s
  from public.events
  where env = 'prod' and name = 'view_close'
),
last_events as (
  select distinct on (visit_id) visit_id, screen, view
  from public.events
  where env = 'prod' and name not in ('heartbeat', 'visit_hide', 'visit_show')
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

-- 세션2 단계 퍼널 (체험 1회 = session_id 기준)
create or replace view analytics.funnel_s2 as
with steps(ord, stage) as (
  values (1, 'brief'), (2, 'materials'), (3, 'workspace'), (4, 'senior_feedback'),
         (5, 'final_feedback'), (6, 'vendor_compare'), (7, 'self_assessment'), (8, 'report')
),
reached as (
  select distinct session_id, replace(screen, 'session2/', '') as stage
  from analytics.screen_occurrences
  where flow = 's2' and session_id is not null and not via_jumper
),
base as (select count(distinct session_id) as n from reached where stage = 'brief')
select st.ord, st.stage,
       count(distinct r.session_id) as sessions,
       round(100.0 * count(distinct r.session_id) / nullif((select n from base), 0), 1) as pct_of_start
from steps st
left join reached r on r.stage = st.stage
group by st.ord, st.stage
order by st.ord;

-- 세션1 단계 퍼널
create or replace view analytics.funnel_s1 as
with steps(ord, stage) as (
  values (1, 'brief'), (2, 'materials'), (3, 'round'), (4, 'final_check'), (5, 'self_assessment'), (6, 'report')
),
reached as (
  select distinct session_id, replace(screen, 'session1/', '') as stage
  from analytics.screen_occurrences
  where flow = 's1' and session_id is not null and not via_jumper
),
base as (select count(distinct session_id) as n from reached where stage = 'brief')
select st.ord, st.stage,
       count(distinct r.session_id) as sessions,
       round(100.0 * count(distinct r.session_id) / nullif((select n from base), 0), 1) as pct_of_start
from steps st
left join reached r on r.stage = st.stage
group by st.ord, st.stage
order by st.ord;

-- 체험을 끝내지 않고 떠난 방문의 마지막 행동 (어디서 무엇을 하다 이탈했나)
create or replace view analytics.exit_context as
with last_action as (
  select distinct on (visit_id) visit_id, screen, view, name
  from public.events
  where env = 'prod' and name not in ('heartbeat', 'visit_hide', 'visit_show', 'view_open', 'view_close')
  order by visit_id, client_ts desc, seq desc
),
completed as (
  select distinct visit_id from public.events where env = 'prod' and name = 'session_complete'
),
jumped as (  -- 개발용 단계 이동 버튼(운영 빌드에도 노출됨)을 쓴 방문은 실제 흐름이 아니라 제외
  select distinct visit_id from public.events where env = 'prod' and name = 'screen_view' and props ->> 'via' = 'jumper'
)
select screen, view, name as last_action, count(*) as visits
from last_action
where visit_id not in (select visit_id from completed)
  and visit_id not in (select visit_id from jumped)
group by screen, view, name
order by visits desc;

-- 완료하지 못한 체험의 마지막 채팅 원문 (events ⨝ chat_logs, message_id로 연결)
create or replace view analytics.abandoned_last_chat as
with last_ask as (
  select distinct on (session_id) session_id, props ->> 'message_id' as message_id, client_ts
  from public.events
  where env = 'prod' and name = 'ask' and session_id is not null and props ? 'message_id'
  order by session_id, client_ts desc, seq desc
)
select la.session_id, la.client_ts, c.persona, c.message, c.reply, c.intent, c.status, c.latency_ms
from last_ask la
join public.chat_logs c on c.message_id = la.message_id::uuid and c.env = 'prod'
where la.session_id not in (
  select session_id from public.events where env = 'prod' and name = 'session_complete' and session_id is not null
);
