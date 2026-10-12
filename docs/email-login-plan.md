# JOBDA 이메일 로그인 도입 계획

> 다른 Claude 세션에 넘기는 작업 문서다. 이 파일만 읽고 이어서 작업할 수 있도록 현재 구조, 결정된 사항, 설계, 남은 결정을 모두 적었다.
> 작성일 2026-10-09 · 저장소 `STkangyh/JOBDA` (로컬 `~/hackerton`) · 운영 주소 `https://jobda-zeta.vercel.app`
> 이전에 검토한 소셜 로그인 안은 폐기했다. 이 문서가 그 안을 대체한다.

---

## 0. 이 문서를 받은 Claude가 지킬 것

- 사용자와는 **한국어**로 대화한다. 결정을 반영한 뒤에는 답변 끝에 TODO 목록(지금 바로 / 결정 필요 / 나중에 / 완료)을 붙인다.
- **커밋·푸시는 사용자가 지시할 때만** 한다. 지시가 오면 기능별로 커밋을 나눈다. `frontend/.claude/`(로컬 미리보기 설정)는 커밋하지 않는다.
- **백엔드 레포 `girugi`(Go)는 수정하지 않는다.** 그 레포의 규칙이 DB, 외부 의존성, 인증 추가를 금지한다. 이 작업은 프론트엔드와 Supabase만으로 끝내야 한다.
- **비밀 값은 프론트엔드에 넣지 않는다.** Supabase secret key(`sb_secret_…`)와 Resend API 키는 프론트엔드나 `VITE_` 환경변수에 넣지 않는다. 브라우저에서는 publishable key(`VITE_SUPABASE_ANON_KEY`)만 쓰고, Resend 키는 Supabase 대시보드 SMTP 설정에만 입력한다.
- `frontend/src/types.ts`의 `Stage` 타입 유니온은 수정하지 않는다.
- **운영 데이터를 바꾸는 SQL(UPDATE/DELETE)은 마이그레이션에 넣지 않는다.** 마이그레이션은 push하면 운영에 자동 적용되기 때문이다. 이런 SQL은 사용자에게 보여주고 직접 실행하게 한다.
- **Figma 노드 ID는 추측하지 않는다.** 로그인 화면 디자인은 아직 제작 중이므로, 사용자가 노드 링크를 줄 때까지 UI는 만들지 않는다(§5 참고).
- §11 "결정 필요" 항목은 임의로 정하지 말고 사용자에게 묻는다. 질문은 JOBDA 범위 안에서만 한다.

---

## 1. 결정된 사항 (2026-10-09, 사용자 확정)

| 항목 | 결정 |
|---|---|
| 로그인 방식 | **이메일 + 비밀번호만**. 소셜 로그인 없음 |
| 필요한 기능 | 회원가입, 로그인, **이메일 인증**, **비밀번호 찾기(재설정)**, 로그아웃 |
| 이메일 인증 형식 | **링크 클릭** 방식 (6자리 코드 아님) |
| 메일 발송 | **Gmail SMTP** (2026-10-12 변경). 직접 관리할 수 있는 도메인이 없어서 Resend는 보류했다. 도메인이 생기면 Supabase SMTP 설정만 Resend로 바꾼다(§7) |
| 메일 템플릿 | `supabase/templates/`에 작성 완료(가입 인증=이메일 변경, 비밀번호 재설정, 가입 확인) |
| 진입점 | **루트 화면(`/`, `Explore`)의 아이콘을 클릭하면 로그인 화면이 열린다**. 화면 디자인은 제작 중 |
| 진행 상태 서버 저장 | 필요하다고 판단했지만 **비용 확인 전까지 보류**. 추정치는 §9에 있다 |

---

## 2. 현재 구조 (작업 전 반드시 읽을 파일)

| 파일 | 역할 |
|---|---|
| `frontend/src/lib/supabaseClient.ts` | `getSupabase()` 싱글톤. 활동 로그와 관리자 페이지가 공유한다 |
| `frontend/src/lib/analytics/supabase.ts` | 앱 시작 시 **익명 로그인**(`signInAnonymously`), 액세스 토큰 캐시(`onAuthStateChange`), `SIGNED_OUT`이면 즉시 익명 재로그인, PostgREST REST insert(`fetch keepalive`) |
| `frontend/src/lib/analytics/analytics.ts` | 이벤트 큐, 방문·세션 문맥, 하트비트, 5초 배치 전송. `track(name, props)`, `flush({ keepalive })` |
| `frontend/src/main.tsx` | 환경변수가 있으면 `startSupabaseAnalytics()`를 동적 import로 실행. `?ut=` 유저 테스트 참가자 코드 캡처 |
| `frontend/src/App.tsx` | 라우트 목록. 새 라우트를 추가하면 `components/ScreenTracker.tsx`의 `EXPLORE_PATHS`에도 넣어야 한다(아니면 활동 로그에 `not_found`로 기록됨) |
| `frontend/src/pages/explore/Explore.tsx` | 루트 화면. 상단에 `components/AppHeader.tsx`가 있고, 그 안의 `ProfileIcon`이 진입점 후보 |
| `frontend/src/pages/admin/AdminPage.tsx` | 팀원용 `/admin`. 이메일·비밀번호 로그인(`signInWithPassword`), 원인별 로그인 오류 안내, `is_anonymous`면 로그아웃 상태로 간주, `admin_report` RPC 호출(관리자 명단 `public.admins`에 없으면 42501) |
| `frontend/src/store/session.ts`, `session1.ts` | 세션2·세션1 진행 상태. zustand `persist`로 **상태 전체**를 localStorage에 저장한다(`coad-hackerton-session`, `coad-hackerton-session1`). 채팅 기록도 포함된다 |
| `supabase/migrations/*.sql` | `events`·`chat_logs`(RLS: 로그인한 사용자가 자기 `user_id`로 insert만 가능, 조회 불가), `analytics` 스키마 뷰, `admins`, `admin_report`·`admin_activity_log` RPC, `chat_logs` 30일 자동 삭제(pg_cron) |

핵심 사실
- 모든 방문자는 이미 Supabase **익명 계정**을 갖고 있다. `events.user_id`·`chat_logs.user_id`의 기본값은 `auth.uid()`이고, RLS가 `user_id = auth.uid()`를 강제한다.
- 관리자 집계는 `public.admins` 명단의 `user_id` 활동을 제외한다. 팀원 관리자 계정도 이메일·비밀번호 계정이므로, 일반 사용자 계정과는 **명단으로만** 구분된다.
- `main`에 push하면 Supabase GitHub 연동이 마이그레이션을 운영에 자동 적용한다. 프론트는 GitHub Actions가 테스트를 통과시킨 뒤 Vercel에 배포한다.
- 스택: React 19, Vite 8, TypeScript, Tailwind v4, Zustand, react-router v7, Vitest + Testing Library.

---

## 3. 핵심 설계: 익명 계정을 이메일 계정으로 전환

새로 `signUp`을 하면 `user_id`가 새로 만들어져, 그동안 익명으로 쌓인 활동 기록과 이어지지 않는다. 대신 **지금 익명 계정에 이메일을 붙이는 방식**(Supabase 공식 "anonymous → permanent" 전환)으로 가입시킨다. 이렇게 하면 `user_id`가 그대로 유지된다.

Supabase는 익명 사용자에게 **이메일을 먼저 인증받은 뒤에** 비밀번호를 설정하게 한다. 그래서 가입은 두 단계가 된다.

### 3-1. 회원가입
```
[가입 화면] 이메일 입력
  → updateUser({ email }, { emailRedirectTo: <사이트>/auth/confirm })
  → "메일함에서 인증 링크를 눌러주세요" 화면 (재전송 버튼 포함)
[메일] 인증 링크 클릭 → <사이트>/auth/confirm?token_hash=…&type=email_change
  → 확인 페이지의 "인증하기" 버튼 → verifyOtp({ token_hash, type: 'email_change' })
  → [비밀번호 설정 화면] updateUser({ password }) → 가입 완료 (같은 user_id, is_anonymous = false)
```
- 인증 전에 비밀번호를 미리 받아 두지 않는다(브라우저 저장소에 비밀번호를 남기지 않기 위해).
- 이미 가입된 이메일이면 `updateUser`가 오류(`email_exists` 등)를 돌려준다. 이때는 "이미 가입된 이메일이에요. 로그인해주세요"로 안내하고 로그인 화면으로 보낸다.

### 3-2. 로그인
```
signInWithPassword({ email, password })
```
- 로그인하면 그 브라우저의 `user_id`가 익명 ID에서 계정 ID로 바뀐다.
- 그 브라우저에서 로그인 전에 익명으로 쌓은 기록은 이전 익명 ID에 남는다. 병합하지 않는다(필요해지면 별도 설계).
- 이메일 인증이 안 된 계정은 로그인할 수 없다. 오류 코드 `email_not_confirmed`를 받으면 인증 메일 재전송을 안내한다.

### 3-3. 비밀번호 찾기
```
[찾기 화면] 이메일 입력 → resetPasswordForEmail(email, { redirectTo: <사이트>/auth/confirm })
  → "메일을 보냈어요" (가입 여부와 상관없이 같은 문구. 계정 존재 여부를 노출하지 않기 위해)
[메일] 재설정 링크 → /auth/confirm?token_hash=…&type=recovery
  → "인증하기" 버튼 → verifyOtp({ token_hash, type: 'recovery' })
  → [새 비밀번호 화면] updateUser({ password }) → 완료 후 로그인 상태
```

### 3-4. 로그아웃
`signOut()`을 호출한다. 기존 `onAuthStateChange`가 `SIGNED_OUT`을 받아 새 익명 계정으로 재로그인한다(지금 동작과 같음).

### 3-5. 링크 방식의 두 가지 함정과 대응
1. **다른 기기에서 링크를 여는 경우:** PC에서 가입하고 휴대폰 메일앱에서 링크를 누르는 경우다. 기본 링크(`{{ .ConfirmationURL }}`)는 PKCE 방식이라, 가입한 브라우저가 아니면 실패한다.
   - 대응: 메일 템플릿 링크를 **우리 사이트의 `/auth/confirm?token_hash={{ .TokenHash }}&type=…`**로 바꾸고, 그 페이지에서 `verifyOtp({ token_hash, type })`를 호출한다. 이 방식은 어느 기기에서 열어도 동작한다.
   - 가입 대기 화면(PC)은 탭에 돌아올 때(`visibilitychange`, `focus`)와 몇 초 간격으로 `refreshSession()` 후 `getUser()`를 확인한다. 인증이 끝났으면 비밀번호 설정 단계로 넘어간다. 계정은 같은 `user_id`라서 PC 세션도 그대로 유효하다.
   - 반대로 휴대폰에서 인증한 경우, 휴대폰 화면에서도 비밀번호 설정을 마칠 수 있게 한다.
2. **메일 보안 검사기가 링크를 미리 여는 경우:** 일부 메일 서비스는 링크를 미리 열어 검사하는데, 이때 일회용 토큰이 소진될 수 있다.
   - 대응: `/auth/confirm` 페이지는 **열리자마자 인증하지 않고 "인증하기" 버튼을 눌렀을 때만** `verifyOtp`를 호출한다.

### 3-6. 구현 메모
- `createClient`의 `auth` 옵션은 기본값(`persistSession: true`, `autoRefreshToken: true`)을 유지한다. 위 token_hash 방식은 PKCE 교환에 의존하지 않는다.
- `/auth/confirm` 페이지는 처리 후 `history.replaceState`로 주소에서 `token_hash`를 지운다. 활동 로그 화면 이름에는 쿼리가 들어가지 않지만(`ScreenTracker`는 `pathname`만 씀), 브라우저 기록과 공유 주소에 토큰이 남지 않게 하기 위해서다.
- 새 활동 이벤트 (기존 snake_case 규칙). **이메일 주소는 이벤트에 절대 넣지 않는다.**
  - `signup_start`, `signup_email_sent`, `email_verified`, `signup_complete`
  - `login_success`, `login_error {code}`
  - `password_reset_request`, `password_reset_complete`
  - `logout`
- 오류 문구는 `AdminPage.tsx`의 `LOGIN_ERRORS`처럼 오류 코드별로 고칠 방법을 알려준다. 그 표를 `lib/auth`로 옮겨 관리자 페이지와 공유한다.

---

## 4. 만들 파일

| 파일 | 내용 |
|---|---|
| `frontend/src/lib/auth.ts` | `useAuthUser()`(현재 사용자, `is_anonymous`, 이메일), `startSignup(email)`, `confirmFromLink(tokenHash, type)`, `setPassword(pw)`, `signIn(email, pw)`, `requestPasswordReset(email)`, `signOut()`, `waitForEmailVerified()`(대기 화면 폴링), 오류 코드 → 한국어 문구 |
| `frontend/src/pages/auth/AuthConfirm.tsx` | `/auth/confirm` 라우트. 토큰 확인 버튼, 성공 시 비밀번호 설정 화면으로 이동, 만료·사용된 링크 안내 |
| 로그인·가입·찾기 화면 | **디자인 확정 후 작성.** 그 전에는 로직과 테스트만 만들고, 화면은 Figma 노드를 받은 뒤 `figma-design-to-code` 절차로 구현한다 |
| `frontend/src/App.tsx` | `/auth/confirm` 라우트 추가(로그인 화면이 모달이 아니라 페이지라면 그 라우트도 추가). 추가한 경로를 `ScreenTracker.tsx`의 `EXPLORE_PATHS`에 반영 |
| `frontend/src/components/AppHeader.tsx` | 진입 아이콘 클릭 시 로그인 화면 열기. 로그인 상태면 계정 메뉴(이메일 일부, 로그아웃) |
| `frontend/src/pages/admin/AdminPage.tsx` | §6 참고 |

DB 변경: **1단계에는 테이블 변경이 없다.** 기존 RLS(`user_id = auth.uid()`)가 이메일 계정에도 그대로 맞는다.

---

## 5. 작업 순서

1. **로직과 테스트**: `lib/auth.ts`, `/auth/confirm`, 오류 문구, 활동 이벤트. UI는 임시 최소 화면(개발용)으로 흐름만 확인한다.
2. **관리자 페이지 정리** (§6)
3. **대시보드 설정** (§8): 사용자가 직접 한다. Claude는 체크리스트와 메일 템플릿 HTML을 준비한다.
4. **로그인 화면 UI**: 디자인을 받으면 구현한다.
5. **운영 검증** (§10)

---

## 6. 관리자 페이지와의 충돌 정리

- 지금 `/admin`은 익명이 아닌 사용자를 모두 "관리자 로그인 시도"로 보고 바로 `admin_report`를 호출한다. 이메일 로그인을 붙이면 일반 사용자도 익명이 아니게 되어, `/admin`에서 "관리자 권한이 없는 계정이에요"를 보게 된다.
  - 이것 자체는 맞는 동작이다.
  - 다만 안내를 "일반 회원 계정으로 로그인되어 있어요. 관리자 계정으로 로그인하려면 로그아웃 후 다시 로그인해주세요"로 바꾼다. 로그아웃하면 서비스 로그인도 풀린다는 점을 함께 알린다.
- 관리자 계정이 서비스 화면을 쓰면 그 활동은 집계에서 빠진다(기존 동작). 팀원에게는 서비스 테스트용 계정과 관리자 계정을 따로 쓰라고 안내한다.
- `public.admins` 명단 관리 방식(대시보드에서 계정 생성 → SQL로 명단 등록)은 그대로 둔다.

---

## 7. 메일 발송: Resend 선정 근거

| | Resend | Amazon SES |
|---|---|---|
| 무료 | 월 3,000통 (제3자 자료 기준 하루 100통 제한) | 신규 계정 크레딧·체험 혜택. 조건이 자주 바뀌어 확인이 필요하다 |
| 유료 | Pro $20/월에 5만 통 | 1,000통당 약 $0.10 (5만 통이면 약 $5) |
| 설정 | API 키를 Supabase SMTP에 입력하면 끝. Supabase 공식 연동 가이드가 있다 | AWS 계정, 리전 선택, SMTP 자격 증명 발급, **샌드박스 해제(운영 전송 승인) 신청**이 필요하다 |
| JOBDA 예상량 | 가입 1통, 비밀번호 찾기 1통, 재전송 정도라 월 수백~수천 통 수준 → **무료 범위** | 같은 양이면 거의 0원이지만 설정 비용이 큼 |

**결론:** 월 3,000통 안에서는 Resend가 무료이고 설정이 가장 간단하다. **월 3,000통 또는 하루 100통을 넘기기 시작하면** SES로 옮기는 것이 저렴하다. Supabase 쪽은 SMTP 설정만 바꾸면 되므로 전환 비용이 작다.
- 주의: 유저 테스트나 홍보로 하루 가입이 100명을 넘을 수 있다면 Resend 무료 플랜의 일일 한도를 실제로 확인한다(공식 가격표 기준).

---

## 8. 사용자가 대시보드에서 할 일 (코드로 대신할 수 없음)

**현재: Gmail SMTP** (도메인 없음)
1. JOBDA 전용 Gmail 계정을 만들고 2단계 인증을 켠 뒤 **앱 비밀번호**를 발급한다.
2. Supabase → Authentication → SMTP Settings: Host `smtp.gmail.com`, Port `465`, Username·Sender = 그 Gmail 주소, Password = 앱 비밀번호, Sender name `JOBDA`.
3. 한계: 발신자가 `@gmail.com`이고, 하루 발송량 제한이 있으며, 과다 발송 시 계정이 일시 잠길 수 있다. 앱 비밀번호는 Supabase에만 입력한다.

**도메인이 생기면: Resend**
1. 가입 후 **발송용 서브도메인**(예: `mail.<JOBDA도메인>`)을 추가한다. 루트 도메인 대신 서브도메인을 쓰면 발송 평판이 분리된다.
2. Resend가 알려주는 DNS 레코드(SPF, DKIM, 필요 시 MX)를 도메인 관리 화면에 등록하고 인증 완료를 확인한다. DMARC 레코드도 추가할 것을 권장한다.
3. 발송 전용 API 키를 만든다(권한: Sending access).

**Supabase → Authentication**
1. **SMTP Settings**: Enable custom SMTP 켜기
   - Host `smtp.resend.com`, Port `465`, Username `resend`, Password = Resend API 키
   - Sender email `no-reply@mail.<JOBDA도메인>`, Sender name `JOBDA`
2. **Sign In / Providers → Email**: 켜기. **Confirm email 켜기**. Anonymous sign-ins는 켜진 상태를 유지한다.
3. **URL Configuration**
   - Site URL: 운영 주소
   - Redirect URLs: `https://jobda-zeta.vercel.app/**`(사이트를 JOBDA 도메인으로 옮기면 그 주소도), `http://localhost:5173/**`, `http://localhost:5180/**`
4. **Email Templates** (한국어로 수정, 링크를 token_hash 방식으로 교체. Claude가 HTML을 준비한다)
   - Change Email Address (익명 → 이메일 가입에 쓰임): `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change`
   - Reset Password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`
   - Confirm signup: 이 설계에서는 쓰지 않지만, 대시보드에서 직접 만든 계정 등에 대비해 `type=signup` 링크로 맞춰 둔다
5. **Rate Limits**: 커스텀 SMTP를 쓰면 시간당 이메일 발송 한도를 조정할 수 있다. 예상 가입량에 맞게 올린다.
6. **비밀번호 정책**(Auth → Policies 또는 Providers → Email): 최소 길이 8자 이상 권장

**선택:** 사이트 자체를 JOBDA 도메인으로 옮기려면 Vercel 프로젝트에 커스텀 도메인을 연결하고 Site URL과 Redirect URL을 갱신한다.

---

## 9. 진행 상태 서버 저장: 비용 추정 (보류 중, 결정 자료)

2026-10-09에 실제 스토어로 측정한 값이다.
- 세션2를 채팅 15회까지 진행한 상태 전체를 JSON으로 만들면 **약 15KB**다(그중 채팅 기록 약 11.6KB). 처음부터 끝까지 완주해 리포트까지 포함하면 **20~30KB** 정도로 추정한다.
- 세션1 초기 상태는 0.5KB이고, 진행하면 채팅 때문에 수 KB로 늘어난다.

**저장 설계 가정:** `user_progress(user_id, flow, state jsonb, updated_at)`에 **사용자·세션당 한 행**을 덮어쓴다. 로그인 사용자만 서버에 저장한다.

| 항목 | 추정 |
|---|---|
| 저장 용량 | 가입자 1만 명 × 약 30KB ≈ **300MB** (jsonb 압축으로 실제는 더 작을 수 있음) |
| 쓰기 | 단계 이동 시와 10초 디바운스 upsert. 행이 늘지 않고 덮어써서 용량이 계속 커지지 않는다 |
| 전송량 | 로그인 시 한 번 불러오기 약 30KB. 로그인 1만 번이어도 약 300MB로 무료 5GB 안에 들어간다 |
| 무료 플랜 | DB 500MB를 활동 로그와 **같이** 쓴다. 가입자가 수천 명이 되면 무료 한도에 영향을 준다 |
| Pro 플랜($25/월) | 8GB가 포함된다. 가입자 1만 명분(0.3GB)은 추가 요금 없이 들어가고, 초과분도 GB당 약 $0.125라 사실상 0원에 가깝다 |

**결론:** 추가 금액은 Pro 플랜 안에서는 거의 0원이다. 결정 요인은 금액이 아니라 **무료 500MB를 언제 넘기느냐**이다.

**저장하기 전에 반드시 정리할 문제:**
- 진행 상태에는 **AI 채팅 원문**이 들어 있다. 그대로 서버에 저장하면 "대화 내용은 30일 후 삭제돼요" 안내와 충돌한다.
  - 해결안 A: 서버 저장분에서 채팅 기록을 빼고 단계·선택·작성물만 저장한다.
  - 해결안 B: 채팅을 포함하되 `updated_at` 기준 30일 지난 행의 채팅 필드를 pg_cron으로 비운다.
- 작성물(시방서 초안, 근거 텍스트, 업체명)은 사용자가 직접 입력한 개인 콘텐츠다. 가입 화면에서 고지해야 한다.

---

## 10. 테스트와 검증

- **Vitest** (`getSupabase`는 `vi.doMock('../lib/supabaseClient')`로 가짜 객체 주입. `pages/admin/admin.test.tsx` 패턴 참고)
  - 가입: 익명 상태에서 `updateUser({ email })` 호출, `emailRedirectTo` 확인, 이미 가입된 이메일 안내
  - `/auth/confirm`: 페이지가 열리기만 해서는 `verifyOtp`를 호출하지 않고 버튼을 눌러야 호출함. `type`별 다음 화면, 만료 링크 안내, 주소에서 토큰 제거
  - 대기 화면: `refreshSession` 후 인증이 확인되면 비밀번호 단계로 이동
  - 로그인: 성공, `invalid_credentials`, `email_not_confirmed`(재전송 안내)
  - 비밀번호 찾기: 가입 여부와 상관없이 같은 완료 문구
  - 로그아웃 → 익명 재로그인(기존 동작) 유지
  - 활동 이벤트에 이메일 주소가 들어가지 않음
  - 관리자 페이지: 일반 회원 계정이면 새 안내 문구
- 기존 테스트가 모두 통과해야 한다: `cd frontend && npx tsc -b --noEmit && npm run lint && npx vitest run`
- **운영 검증** (대시보드 설정 후, 사용자와 함께 진행. 비밀번호 입력은 사용자가 직접 한다)
  1. 익명으로 체험하다 가입 → 인증 메일 수신 → 링크 → 비밀번호 설정
  2. SQL Editor에서 그 `user_id`가 가입 전 이벤트의 `user_id`와 같고 `is_anonymous = false`인지 확인
  3. PC에서 가입하고 휴대폰에서 링크 열기
  4. 비밀번호 찾기 왕복
  5. 메일이 스팸함으로 가지 않는지 (Gmail, 네이버 메일)

---

## 11. 결정 필요

1. 로그인 화면이 **모달인지 별도 페이지(`/login`)인지** (디자인 확정 시)
2. 가입 화면에 넣을 **개인정보 수집·이용 고지 문구**와 동의 체크 여부
3. **회원 탈퇴** 기능을 이번에 넣을지. 탈퇴 시 `auth.users` 삭제 → `events`·`chat_logs.user_id`는 `on delete set null`로 익명화된다. 클라이언트에서는 사용자 삭제를 직접 할 수 없으므로 `security definer` RPC가 필요하다
4. **진행 상태 서버 저장 재개 시점**과 채팅 원문 처리 방식(§9의 A/B)
5. 사이트 주소를 JOBDA 도메인으로 옮길지

---

## 12. 참고

- Supabase 익명 사용자 → 이메일 계정 전환: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase 커스텀 SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase 이메일 템플릿(`{{ .TokenHash }}`): https://supabase.com/docs/guides/auth/auth-email-templates
- Resend 가격: https://resend.com/pricing
- Resend + Supabase SMTP: https://resend.com/docs/send-with-supabase-smtp
- Amazon SES 가격: https://aws.amazon.com/ses/pricing/
