-- 퍼널을 "기간 안에 브리프로 시작한 세션" 코호트 기준으로 다시 정의
-- 세션 진행 상태는 브라우저에 저장돼서, 예전에 브리프를 지난 세션이 돌아오면 자료탐색·협업부터 기록된다.
-- 단계마다 따로 세면 뒷단계가 브리프보다 커져 100%를 넘었다(관리자 퍼널 막대가 카드 밖으로 넘침).
-- 이제 기간 안에 브리프가 관측된 세션만 분모로 쓰고, 각 단계는 "그 단계 이상까지 간 세션"으로 센다
-- (중간 단계 화면 기록이 빠져도 뒷단계에 도달했으면 지나간 것으로 본다) → 단계가 내려갈수록 줄어들기만 한다.

create or replace view analytics.funnel_s2 as
with steps(ord, stage) as (
  values (1, 'brief'), (2, 'materials'), (3, 'workspace'), (4, 'senior_feedback'),
         (5, 'final_feedback'), (6, 'vendor_compare'), (7, 'self_assessment'), (8, 'report')
),
reached as (
  select o.session_id, max(st.ord) as max_ord, bool_or(st.stage = 'brief') as started
  from analytics.screen_occurrences o
  join steps st on st.stage = replace(o.screen, 'session2/', '')
  where o.flow = 's2' and o.session_id is not null and not o.via_jumper
  group by o.session_id
),
cohort as (select session_id, max_ord from reached where started)
select st.ord, st.stage,
       count(c.session_id) as sessions,
       round(100.0 * count(c.session_id) / nullif((select count(*) from cohort), 0), 1) as pct_of_start
from steps st
left join cohort c on c.max_ord >= st.ord
group by st.ord, st.stage
order by st.ord;

create or replace view analytics.funnel_s1 as
with steps(ord, stage) as (
  values (1, 'brief'), (2, 'materials'), (3, 'round'), (4, 'final_check'), (5, 'self_assessment'), (6, 'report')
),
reached as (
  select o.session_id, max(st.ord) as max_ord, bool_or(st.stage = 'brief') as started
  from analytics.screen_occurrences o
  join steps st on st.stage = replace(o.screen, 'session1/', '')
  where o.flow = 's1' and o.session_id is not null and not o.via_jumper
  group by o.session_id
),
cohort as (select session_id, max_ord from reached where started)
select st.ord, st.stage,
       count(c.session_id) as sessions,
       round(100.0 * count(c.session_id) / nullif((select count(*) from cohort), 0), 1) as pct_of_start
from steps st
left join cohort c on c.max_ord >= st.ord
group by st.ord, st.stage
order by st.ord;
