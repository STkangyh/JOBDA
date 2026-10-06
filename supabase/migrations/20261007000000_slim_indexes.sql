-- 저장 용량 줄이기: 활동 로그 인덱스 정리
-- 이 테이블들은 브라우저가 쓰기만 하고, 읽는 쪽은 관리자 리포트(admin_report)와 SQL Editor 집계뿐이다.
-- 집계는 전부 기간(client_ts) 조건으로 훑는 쿼리라 방문·세션·사용자·이벤트명별 B-tree 인덱스를 쓰지 않는데,
-- 이 넷이 이벤트 한 행 크기(약 335B)의 1/3을 차지했다. 시간순으로 쌓이는 테이블에 맞는 BRIN 인덱스
-- 하나로 바꾼다 — 기간 필터는 그대로 빠르고, 크기는 블록 수십 개당 몇 바이트 수준이다.
-- 특정 방문을 자주 추적해야 하는 일이 생기면 그때 해당 인덱스만 다시 만들면 된다.

drop index if exists public.events_visit_idx;
drop index if exists public.events_session_idx;
drop index if exists public.events_name_idx;
drop index if exists public.events_user_idx;
create index if not exists events_client_ts_brin on public.events using brin (client_ts);

-- chat_logs: message_id 고유 인덱스(중복 전송 방지)는 유지. 보관 기간 삭제가 created_at으로 훑으므로 BRIN으로 바꾼다.
drop index if exists public.chat_logs_session_idx;
drop index if exists public.chat_logs_created_idx;
create index if not exists chat_logs_created_brin on public.chat_logs using brin (created_at);
