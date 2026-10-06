-- 채팅 원문 보관 기간 30일
-- 매일 03:00(KST, = 18:00 UTC)에 30일 지난 chat_logs를 지운다. 메신저 입력창 아래 안내 문구(ChatRetentionNotice)와
-- 기간을 맞춰야 한다. 활동 이벤트(events)에는 원문이 없으므로 그대로 둔다.
-- cron.schedule은 같은 이름의 작업이 있으면 덮어쓰므로 다시 실행해도 작업이 하나만 남는다.

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'chat-logs-retention',
  '0 18 * * *',
  $$delete from public.chat_logs where created_at < now() - interval '30 days'$$
);
