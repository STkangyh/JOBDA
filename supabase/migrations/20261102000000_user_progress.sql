-- 계정별 체험 진행 기록 (2026-11-02)
-- 로그아웃할 때 브라우저의 진행 단계를 지우고(공용 노트북에서 다음 사람이 이어받지 않게),
-- 다시 로그인하면 여기서 불러온다. 로그인할 때 브라우저와 계정 둘 다 기록이 있으면 계정 기록이 우선한다.
-- 실행: Supabase 대시보드 → SQL Editor에 붙여넣고 실행 (또는 supabase db push)
--
-- session2에는 세션2 진행 상태(브라우저 저장 형식 그대로, 메신저 대화 원문 포함)가 들어간다.
-- 대화 원문을 계속 둘지·자동 삭제할지는 UT 후에 정한다 — chat_logs의 30일 삭제와는 별개라
-- 그때까지 메신저 아래 "30일 후 삭제" 안내와 어긋난다는 점에 주의.

create table if not exists public.user_progress (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  session2   jsonb not null check (pg_column_size(session2) <= 524288),   -- 512KB
  updated_at timestamptz not null default now()
);

-- 본인 기록만 읽고 쓴다. 익명 사용자(활동 기록용)는 제외 — 이메일 계정만.
alter table public.user_progress enable row level security;

drop policy if exists "read own progress" on public.user_progress;
create policy "read own progress" on public.user_progress
  for select to authenticated
  using (user_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "insert own progress" on public.user_progress;
create policy "insert own progress" on public.user_progress
  for insert to authenticated
  with check (user_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "update own progress" on public.user_progress;
create policy "update own progress" on public.user_progress
  for update to authenticated
  using (user_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (user_id = auth.uid());

revoke all on public.user_progress from anon, authenticated;
grant select, insert, update on public.user_progress to authenticated;
