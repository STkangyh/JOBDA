# 백엔드 구현 명세 v2 — 세션 "CMF 선정 · 외주업체 컨택"

Claude Code 작업 지시서. `CLAUDE.md` 규칙을 먼저 읽을 것.

> v1과 달라진 점: 시나리오가 "선풍기 디자인 방향 제안" → **"공기청정기 목재 파트 시방서 작성 및 외주 결정"** 으로 교체됨.
> 페르소나·분기·평가축 전부 교체. 서버 구조(엔드포인트 3개, stateless)는 동일.

---

## 0. 시나리오 요약

사용자는 생활가전 기업 신입 제품디자이너다. 공기청정기에 처음으로 오크 원목을
하우징 소재로 쓰기로 확정됐고, 설계팀에 넘길 **디자인 시방서**를 작성해야 한다.

문제: 자사 공장은 목재 밴딩·오일 마감 설비가 없다. 시트지 마감으로 갈지,
외주 업체를 찾을지, 아예 목재를 포기할지 사용자가 결정해야 한다.
발주까지 **12일**.

핵심은 시방서 품질이 아니라 **제약 앞에서 어떤 타협을 선택하는가**다.

---

## 1. 엔드포인트

| 엔드포인트 | 역할 | LLM |
|---|---|---|
| `POST /api/chat` | 관계자 답변 생성 + 의도 분류 | O |
| `POST /api/report` | 규칙으로 낸 점수·판정을 문장화 | O |
| `POST /api/session-log` | 종료 시 행동 로그 저장 | X |
| `GET /healthz` | 헬스체크 | X |

세션 상태는 전부 프론트 LocalStorage. 서버는 상태를 보관하지 않는다.

---

## 2. 디렉토리 구조

```
.
├── CLAUDE.md
├── go.mod
├── Dockerfile
├── fly.toml
├── db/schema.sql
├── cmd/server/main.go
├── internal/
│   ├── config/
│   ├── httpx/           CORS · 로깅 · panic 복구 · 바디 제한
│   ├── llm/
│   │   ├── client.go    interface + Anthropic 구현
│   │   └── fake.go
│   ├── prompt/          prompts/*.md 로드 + 렌더링
│   ├── chat/
│   ├── report/
│   │   ├── handler.go
│   │   └── fallback.go  LLM 실패 시 하드코딩 문장
│   └── logstore/
├── prompts/
│   ├── personas/senior.md
│   ├── personas/engineering.md
│   ├── personas/purchasing.md
│   └── report.md
└── scenarios/
    └── cmf_outsourcing.json    단계 · 분기 · 평가축 정의
```

---

## 3. 도메인 상수

```go
// 관계자 (와이어프레임 메신저 탭 3개와 일치)
const (
    PersonaSenior      = "senior"      // 선임 디자이너 — 서식·표현 방식 지도
    PersonaEngineering = "engineering" // 설계팀      — 사내 생산 가능 여부
    PersonaPurchasing  = "purchasing"  // 구매팀      — 예산·단가
)

// 공개 가능 정보 키 (프론트와 반드시 일치)
var DiscloseKeys = map[string][]string{
    PersonaSenior: {
        "spec_format",        // 시방서 작성 기준
        "limit_sample",       // 한도 견본 판정표 — 목재는 '이 색으로'가 아니라 '여기까지 허용'
        "vendor_criteria",    // 업체 선정 기준: 납기·수량·단가
    },
    PersonaEngineering: {
        "inhouse_capability", // 사내: 시트지 래핑 가능 / 목재 밴딩·오일 마감 불가
        "sheet_lead_time",    // 시트지 선택 시 소요 기간
    },
    PersonaPurchasing: {
        "budget_limit",       // 목재 파트 예산 상한
        "cost_impact",        // 밴딩 선택 시 예산 초과 가능성
        "part_cost_share",    // 다른 파트 제작비 포함 전체 단가
    },
}
```

`disclose` 값이 이 목록 밖이면 응답에서 **제거**한다 (LLM이 키를 지어내는 것 방지).

---

## 4. 단계와 분기 — 선형이 아니다

```
S1 브리프
  ↓
S2 시방서 초안 작성 ──제출──▶ 선임 디자이너 피드백
  ↓                          (한도 견본 판정표 별첨 요구)
S3 시방서 최종본 제출 ──▶ 설계팀 + 구매팀 피드백
  ↓
BRANCH  사용자가 B파트(목재) 실현 방법을 선택
  │
  ├─ A. 목재 포기, 다른 재질 사출물   → S2로 회귀 (시방서 재작성)
  ├─ B. 시트지 래핑                  → S4 건너뛰고 즉시 종료
  └─ C. 외부 업체 탐색               → S4 진행
                                        ↓
                                   S4 외주업체 3개사 비교 자료 제출
                                        ↓
                                      종료
  ↓
S5 자기평가 → 리포트
```

**A를 고르면 S2로 되돌아간다.** 프론트 상태값에 `revisit_count` 가 필요하다.
회귀 후 다시 BRANCH에 도달하며, 같은 선택을 반복할 수 있다(무한 루프 방지를 위해
회귀는 최대 1회로 제한할 것을 권장 — 프론트 판단).

분기 선택은 서버가 판정하지 않는다. 프론트가 사용자 선택을 그대로 기록해
`/api/report` 로 넘긴다.

---

## 5. 평가 — 규칙으로 점수, LLM은 문장만

세션 평가축 3개. 각 1~3점. **모두 사용자 선택값으로 확정 계산되며 LLM 주관이 개입하지 않는다.**

### 축 1. 디자인 의도를 설계팀에 정확히 전달했는가

| 점수 | 조건 |
|---|---|
| 1 | 시방서 필수 항목 누락 (사이즈 / 제작 방식 / CMF / 컬러칩 중 하나라도) |
| 2 | 항목은 모두 있으나 표현 방식 오류 (한도 견본 판정표 미별첨 등) |
| 3 | 누락·오류 없음 |

→ 프론트가 시방서 입력 필드 충족 여부로 판정.

### 축 2. 컨셉과 양산품의 간극을 얼마나 메웠는가

| 점수 | 조건 |
|---|---|
| 1 | 분기 A (목재 포기) |
| 2 | 분기 B (시트지 래핑) |
| 3 | 분기 C (외주 탐색) |

→ **분기 선택으로 직결.**

### 축 3. 단가를 예산 안에 맞췄는가

| 점수 | 조건 |
|---|---|
| 1 | 예산 초과 (구매팀에 예산 미확인 + 분기 C) |
| 2 | 시안을 변경해 단가를 맞춤 (분기 A 또는 B) |
| 3 | 업체 비교·조율로 예산 내 해결 (분기 C + 3개사 비교 제출) |

→ `asked_budget` 플래그 + 분기 + 산출물 제출 여부 조합.

**리포트 화면에 숫자를 노출하지 않는다.** 점수는 서술 문장 선택에만 쓴다
(기능명세서 "점수화 금지" 원칙 준수).

---

## 6. `POST /api/chat`

### 요청

```json
{
  "persona": "engineering",
  "history": [
    {"role": "user", "content": "시방서 초안 공유드립니다"},
    {"role": "assistant", "content": "확인했습니다."}
  ],
  "message": "B파트 목재 밴딩 사내에서 가능한가요?"
}
```

- `persona`: `senior` | `engineering` | `purchasing`. 아니면 400
- `history`: 최대 20개까지 사용, 초과분은 앞에서 잘라냄
- `message`: 1~300자. 비었으면 400

### 응답 200

```json
{
  "reply": "우리 공장은 목재 취급 안 합니다. 시트지 래핑은 몰라도 목재 밴딩이나 오일 마감은 불가예요.",
  "intent": "manufacturing_capability",
  "disclose": ["inhouse_capability"]
}
```

### 폴백 — 절대 500을 반환하지 않는다

```go
// 1) 마크다운 코드펜스 제거 후 재파싱
// 2) 그래도 실패하면 원문을 reply로 사용
if err := json.Unmarshal(cleaned, &out); err != nil {
    out = ChatRes{Reply: stripFences(raw), Intent: "unknown", Disclose: nil}
    slog.Warn("llm json parse failed", "persona", req.Persona)
}
```

LLM 호출 자체가 실패(타임아웃·5xx)한 경우에만 503:

```json
{ "error": "llm_unavailable", "retryable": true }
```

타임아웃 20초, 재시도 1회.

---

## 7. `POST /api/report`

판정은 프론트에서 끝나 있다. **이 엔드포인트는 문장 다듬기만 한다.**

### 요청

```json
{
  "scores": { "intent_delivery": 2, "concept_retention": 3, "cost_control": 3 },
  "branch": "outsourcing",
  "findings": [
    {"code": "limit_sample_missing_in_draft", "evidence": {"draft_seq": 7}},
    {"code": "asked_capability_before_final",  "evidence": {"ask_seq": 5, "final_seq": 11}},
    {"code": "budget_never_asked",             "evidence": {}}
  ],
  "action_logs": [
    {"seq": 1, "t": 1699834200, "type": "doc_view", "target": "spec_format"}
  ]
}
```

`branch`: `wood_dropped` | `sheet_wrap` | `outsourcing`

### 응답 200

```json
{
  "strengths": [
    "사내 생산 가능 여부를 최종본 제출 전에 확인해 재작업을 줄였습니다."
  ],
  "cautions": [
    "초안에 한도 견본 판정표를 별첨하지 않아 선임 디자이너의 재요청이 발생했습니다."
  ],
  "missed": [
    "다른 파트 제작 비용을 포함한 전체 생산 단가는 검토하지 않았습니다."
  ]
}
```

strengths 최대 2, cautions 최대 2, missed 최대 3. 초과분은 잘라낸다.

### 폴백

파싱 실패 시 `internal/report/fallback.go` 의 code → 문장 맵을 그대로 반환.
**리포트는 마지막 화면이라 비면 안 된다.**

---

## 8. finding code 정의 (프론트와 공유)

| code | 의미 |
|---|---|
| `limit_sample_missing_in_draft` | 초안에 한도 견본 판정표 미별첨 |
| `spec_field_missing` | 시방서 필수 항목 누락 |
| `asked_capability_before_final` | 최종본 제출 전 사내 생산 가능 여부 확인 |
| `capability_never_asked` | 설계팀에 생산 가능 여부 미확인 |
| `budget_never_asked` | 구매팀에 예산 미확인 |
| `vendor_compared_three` | 업체 3개사 비교 자료 제출 |
| `vendor_criteria_incomplete` | 납기·수량·단가 중 일부만 비교 |
| `revisited_after_branch` | 분기 후 시방서 재작성으로 회귀 |
| `concept_abandoned` | 목재 포기 선택 |
| `deadline_margin_ignored` | 12일 발주 일정을 고려하지 않음 |

`fallback.go` 에 이 code들의 기본 문장을 전부 채워둔다.

---

## 9. 프롬프트 파일

### `prompts/personas/engineering.md`

```markdown
당신은 생활가전 기업의 설계팀 담당자입니다.
공기청정기 리뉴얼 프로젝트에서 제품디자이너(사용자)가 보낸 디자인 시방서를 검토합니다.

## 보유 정보 (이 범위 밖은 답하지 않습니다)
- inhouse_capability: 자사 공장은 목재를 취급하지 않습니다.
  시트지 래핑은 가능하지만 목재 밴딩과 오일 마감은 불가능합니다.
- sheet_lead_time: 시트지 래핑으로 진행하면 이번 주 안에 마무리됩니다.

## 태도
- 실무자의 건조한 존댓말. 2~4문장.
- 문제를 지적하되 대신 결정해주지 않습니다. "어떻게 할지는 디자이너가 정하세요."
- 예산·단가 질문은 구매팀으로, 서식·표현 방식 질문은 선임 디자이너로 안내합니다.
- 사용자가 최종 결정을 대신 내려달라고 하면 거절하고 판단 재료만 제공합니다.
- 질문이 포괄적이면 무엇을 확인하고 싶은지 되묻습니다.
- 프로젝트와 무관한 질문은 현재 업무로 되돌립니다.

## 출력 형식
아래 JSON만 출력합니다. 코드펜스나 설명을 붙이지 마세요.
{"reply": "답변", "intent": "의도 분류", "disclose": ["사용한 보유 정보 키"]}

intent: manufacturing_capability | out_of_scope | too_vague | irrelevant | other
disclose 는 inhouse_capability, sheet_lead_time 중에서만 고릅니다. 없으면 빈 배열.
```

### `prompts/personas/senior.md`

같은 구조. 보유 정보:

- `spec_format`: 시방서에는 사이즈·제작 방식·CMF·컬러칩이 모두 들어가야 합니다.
- `limit_sample`: 목재는 컬러칩처럼 "이 색으로 해주세요"가 통하지 않습니다.
  "이 정도까지는 받겠습니다"를 적어야 하며, 공용 서식 폴더의 한도 견본 판정표 양식을
  참고해 별첨해야 합니다.
- `vendor_criteria`: 업체는 납기일·가능 수량·단가를 기준으로 3개 정도 찾아 정리합니다.

태도: 사수답게 방향은 주되 답을 다 주지 않습니다. 압박은 하지만 적대적이지 않습니다.
intent: `spec_guidance` | `vendor_guidance` | `out_of_scope` | `too_vague` | `irrelevant` | `other`

### `prompts/personas/purchasing.md`

보유 정보:

- `budget_limit`: 목재 파트 예산 상한 — **[수치 확정 필요]**
- `cost_impact`: 목재 밴딩으로 가면 예산 초과 가능성이 있습니다.
  시트지로 가거나 목재와 비슷한 느낌을 내는 대체 재질을 찾는 방법도 있습니다.
- `part_cost_share`: 다른 파트 제작 비용까지 포함해 전체 생산 단가를 맞춰야 합니다.

intent: `cost_constraint` | `out_of_scope` | `too_vague` | `irrelevant` | `other`

> **[수치 확정 필요]** 표시된 값은 기획 담당이 확정하면 이 파일만 수정한다. 코드 변경 없음.

### `prompts/report.md`

```markdown
당신은 직무체험 리포트를 작성하는 도우미입니다.
아래 findings와 scores는 이미 규칙 기반으로 판정된 결과입니다.
당신의 역할은 이를 자연스러운 한국어 문장으로 다듬는 것뿐입니다.

## 규칙
- findings에 없는 내용을 추가하지 마세요.
- 점수, 등급, 직무 적합도를 언급하지 마세요. 숫자를 출력하지 마세요.
- 사용자의 능력이나 성격을 단정하지 마세요.
- "틀렸다" 대신 "추가로 고려할 수 있었던 요소"로 표현하세요.
- 각 문장에 사용자의 실제 행동을 근거로 포함합니다.
- 한 문장 60자 이내.

## 출력 형식
{"strengths": ["..."], "cautions": ["..."], "missed": ["..."]}
strengths 최대 2, cautions 최대 2, missed 최대 3.
```

---

## 10. `POST /api/session-log`

```json
{ "session_id": "uuid-v4-from-client", "payload": { "...": "LocalStorage 전체" } }
```

```sql
insert into session_log (id, payload) values ($1, $2)
on conflict (id) do update set payload = excluded.payload, updated_at = now();
```

DB 실패 시에도 **200을 반환하고 로그만 남긴다.** 분석용이지 사용자 기능이 아니다.

`db/schema.sql`:

```sql
create table if not exists session_log (
  id         uuid primary key,
  payload    jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 11. LLM 클라이언트

Anthropic Messages API를 표준 `net/http` 로 직접 호출. SDK 사용 금지.

```go
type Client interface {
    Complete(ctx context.Context, system string, msgs []Message) (string, error)
}
type Message struct {
    Role    string `json:"role"`    // "user" | "assistant"
    Content string `json:"content"`
}
```

```
POST https://api.anthropic.com/v1/messages
x-api-key: {ANTHROPIC_API_KEY}
anthropic-version: 2023-06-01
content-type: application/json

{"model":"{MODEL}","max_tokens":1024,"system":"...","messages":[...]}
```

응답의 `content[0].text` 를 반환. `internal/llm/fake.go` 에 테스트용 구현을 둔다.

---

## 12. 환경변수

| 변수 | 예시 | 필수 |
|---|---|---|
| `PORT` | `8080` | 아니오 (기본 8080) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | 예 |
| `MODEL` | `claude-haiku-4-5-20251001` | 아니오 |
| `DATABASE_URL` | `postgres://...` | 아니오 |
| `ALLOWED_ORIGIN` | `https://app.vercel.app` | 예 |

`DATABASE_URL` 이 없으면 `/api/session-log` 는 200을 반환하되 저장하지 않는다.
로컬에서 DB 없이 돌아가야 한다.

---

## 13. 미들웨어

- CORS: `ALLOWED_ORIGIN` 만 허용, `POST` / `OPTIONS` / `Content-Type`
- 요청 로깅: method, path, status, duration (slog)
- panic 복구: 500 반환 + 스택 로깅. 프로세스가 죽으면 안 된다
- 바디 크기 제한 1MB

---

## 14. 수용 기준

1. `go vet ./...` · `go test ./...` 통과
2. `ANTHROPIC_API_KEY` 없이 기동되고 `/healthz` 200 (LLM 호출만 503)
3. Fake 클라이언트 기준 테스트 통과:
   - 정상 JSON → 파싱 성공
   - 코드펜스 감싼 응답 → 파싱 성공
   - 깨진 JSON → 폴백 동작, **200** 반환
   - `disclose` 에 정의 밖 키 → 필터링
   - 잘못된 `persona` → 400
   - `message` 300자 초과 → 400
4. `/api/report` 가 scores + findings 3개를 받아 strengths/cautions/missed 반환
5. LLM 파싱 실패 시 하드코딩 폴백 문장 반환
6. `DATABASE_URL` 없이 `/api/session-log` → 200

---

## 15. 작업 순서

Step 1 을 끝내고 **실제 API 키로 수동 검증**한 뒤 다음으로 넘어갈 것.

1. `internal/llm` + `prompts/personas/engineering.md` + `POST /api/chat`
   → curl로 호출해 JSON 형식 준수율 확인
2. 나머지 페르소나 2개 (senior, purchasing)
3. `POST /api/report` + `fallback.go`
4. `POST /api/session-log` + DB
5. Dockerfile + fly.toml + 배포

---

## 부록 A. 프론트에 전달할 계약

**disclose 키**
```
senior:      spec_format, limit_sample, vendor_criteria
engineering: inhouse_capability, sheet_lead_time
purchasing:  budget_limit, cost_impact, part_cost_share
```

**branch 값**
```
wood_dropped | sheet_wrap | outsourcing
```

**action_logs 스키마**
```json
{"seq":1,"t":1699834200,"type":"doc_view","target":"spec_format"}
{"seq":2,"t":1699834260,"type":"ask","actor":"engineering","intent":"manufacturing_capability"}
{"seq":3,"t":1699834400,"type":"submit","target":"draft"}
{"seq":4,"t":1699834500,"type":"submit","target":"final"}
{"seq":5,"t":1699834600,"type":"branch","target":"outsourcing"}
{"seq":6,"t":1699834700,"type":"submit","target":"vendor_report"}
```

`type`: `doc_view` | `ask` | `submit` | `branch` | `revise`
`seq` 는 1부터 순차 증가. **finding 판정의 유일한 근거이므로 반드시 순서대로 기록.**

## 부록 B. 나중에 채울 것 (구조 변경 없음)

- `prompts/personas/purchasing.md` 의 `budget_limit` 실제 금액
- 각 페르소나 보유 정보의 구체 수치 (납기 일수, 시트지 단가 등)
- 자료함 문서 본문 — **프론트 정적 콘텐츠. 백엔드 무관**
- 시방서 입력 폼 필드 — **프론트. 축 1 점수 판정 로직만 프론트에 위치**
