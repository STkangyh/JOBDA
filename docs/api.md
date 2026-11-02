# API 스펙

Base URL: 프론트와 같은 출처 (`/api/...`). 모든 요청/응답 `application/json`.

**로그인 필요 (2026-11-02)** — `/api/chat`, `/api/report`, `/api/note`는 이메일 계정으로 로그인한 사람만 부를 수 있습니다.
요청 헤더에 Supabase 로그인 토큰을 붙입니다: `Authorization: Bearer <access_token>`. 서버가 Supabase Auth(`/auth/v1/user`)로
토큰을 확인하고, 없거나 틀리거나 익명 사용자면 `401 {"error":"login_required"}`, 서버에 Supabase 설정이 없으면
`503 {"error":"auth_unavailable"}`입니다. 서버는 `SUPABASE_URL`/`SUPABASE_ANON_KEY`(없으면 `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`)를 씁니다.
`/api/session-log`는 LLM을 쓰지 않아 로그인 없이 받습니다.

> **JOBDA로 이전 (2026-11-02)** — API 서버가 girugi(Go)에서 이 저장소의 `frontend/api/`(Vercel Node 함수)로
> 옮겨졌고, girugi 서버는 종료했습니다. 이제 백엔드는 Vercel(이 API)과 Supabase(로그인·활동 기록)뿐입니다.
> 프론트와 같은 Vercel 프로젝트로 배포되어 CORS가 필요 없습니다.
> - 코드: `frontend/api/*.ts`(엔드포인트) · `frontend/api/_lib/`(공용) · 프롬프트: `frontend/prompts/`
> - 서버 환경변수(Vercel 프로젝트에 설정, `VITE_` 접두사 금지): `OPENAI_API_KEY`(기본) 또는
>   `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`, 선택 `MODEL`, `OPENAI_BASE_URL`,
>   `ALLOWED_ORIGIN`(다른 출처에서 부를 때만, 쉼표 구분)
> - 원칙은 girugi 때와 같습니다: 상태 저장 없음, DB 없음, 외부 패키지 없음, 판정·채점은 프론트, LLM 실패는 폴백,
>   대화 내용은 로그에 남기지 않음.

> **v3** — `AI_INTERFACE_SPEC.md` 반영. intent enum·disclose 키·finding code를
> AI 파트 프롬프트 실제 값으로 교체. 세션1 라운드 입력 필드 확정.

---

## 시나리오

| `scenario` | 세션 | 관계자 | 리포트 |
|---|---|---|---|
| `cmf_outsourcing` | CMF 선정 · 외주업체 컨택 | `senior` `engineering` `purchasing` `design` | strengths/cautions/missed |
| `prototype_revision` | 프로토타입 수정 (3라운드 협상) | `senior` `engineering` `design` | 5섹션 서술형 |

`scenario` × `persona` 조합이 위 표에 없으면 400.

---

## POST /api/chat

### 요청

```json
{
  "scenario": "cmf_outsourcing",
  "persona": "engineering",
  "history": [
    { "role": "user", "content": "시방서 초안 공유드립니다" },
    { "role": "assistant", "content": "확인했습니다." }
  ],
  "message": "B파트 목재 밴딩 사내에서 가능한가요?",
  "context": null
}
```

| 필드 | 타입 | 필수 | 제약 |
|---|---|---|---|
| `scenario` | string | O | 위 표 |
| `persona` | string | O | 위 표 |
| `history` | array | O | 빈 배열 가능. 서버가 뒤에서 20개만 사용 |
| `history[].role` | string | O | `user` \| `assistant` |
| `message` | string | O | 자유 대화 1~300자. `context` 가 있으면 0~300자 |
| `context` | object \| null | X | 아래 |

**서버는 대화를 저장하지 않습니다.** 매 요청에 전체 히스토리를 보내세요.

### context — 세션1 협상 라운드 입력

라운드 선택 화면에서는 `context` 를 함께 보냅니다. `message` 에는 **선택 근거(reasoning)** 를 담습니다.

```json
{
  "scenario": "prototype_revision",
  "persona": "engineering",
  "history": [ ... ],
  "message": "벨트라인을 살리면서 두 조각으로 줄이겠습니다",
  "context": { "round": "round1", "choice": 1 }
}
```

라운드별 필드:

| round | `choice` | 추가 필드 | 비고 |
|---|---|---|---|
| `round1` | `1` \| `2` \| `3` | — | `message`(근거) 필수 |
| `round2` | `1` \| `2` \| `3` | `cost_alternative` (string, 선택) | choice=3일 때만 노출 |
| `round3` | `"confirm"` \| `"revisit"` | `intent_summary` (string, 필수) | `message` 비어도 됨 |

```json
// round2 choice 3
"context": { "round": "round2", "choice": 3, "cost_alternative": "포장재 등급을 낮춰 상쇄" }

// round3
"context": { "round": "round3", "choice": "confirm", "intent_summary": "벨트라인 무드는 그래픽으로 유지" }
```

자유 질문(라운드 밖)에서는 `context: null`. **세션2는 항상 `null`** 입니다.

> 서버가 `context` + `message` 를 AI 파트가 검증한 JSON 형태로 조립해 LLM에
> 전달합니다. 프론트는 JSON 문자열을 직접 만들지 마세요.

### 응답 200

```json
{
  "reply": "3파츠로 가면 금형 비용이 초과합니다. 파트를 줄이는 방향을 검토해 주세요.",
  "intent": "round1_feedback",
  "disclose": ["molding_cost_constraint"]
}
```

| 필드 | 설명 |
|---|---|
| `reply` | 화면에 표시할 답변 |
| `intent` | 의도 분류. 참고용 — UI 필수 아님 |
| `disclose` | **이 답변으로 공개된 정보 키.** 자료함 잠금 해제에 사용 |

`disclose` 는 빈 배열일 수 있습니다. 목록 밖 키는 서버가 걸러냅니다.

### intent enum

**세션1 `prototype_revision`**

| persona | 값 |
|---|---|
| `engineering` | `round1_feedback` `round2_feedback` `round3_feedback` `manufacturing_capability` |
| `senior` | `design_guidance` `revisit_review` |
| `design` | `concept_feedback` `user_perspective` |

**세션2 `cmf_outsourcing`**

| persona | 값 |
|---|---|
| `senior` | `spec_guidance` `vendor_guidance` |
| `engineering` | `manufacturing_capability` |
| `purchasing` | `cost_constraint` |
| `design` | `concept_feedback` `material_intent_guidance` |

**공통 추가값** — `out_of_scope` `too_vague` `irrelevant` `other` `unknown`

가드레일 응답(프롬프트 인젝션·평가 메타 질문·반복 질문·감정적 압박·크로스 페르소나
확인·시나리오 이탈)은 `out_of_scope` 또는 `other` 로 옵니다.
`unknown` 은 서버 폴백 시에만 나옵니다.

### disclose 키

**세션1 `prototype_revision`**

| persona | 키 | 의미 |
|---|---|---|
| `engineering` | `molding_cost_constraint` | 3파츠 분할 시 금형 비용 초과 |
| `engineering` | `part_consolidation_criteria` | 통합 시 사출 성형 가능 구조인지가 기준 |
| `engineering` | `undercut_constraint` | 안쪽으로 파인 구조는 금형에서 안 빠짐 |
| `engineering` | `min_thickness` | 하우징 완제품 최소 두께 42mm |
| `senior` | `belt_line_intent` | 핵심 디자인 의도는 벨트라인 |
| `senior` | `revision_guidance_criteria` | 판단 기준은 '벨트라인 무드가 남아있는가' |
| `design` | `user_requirement_keywords` | 저소음 · 공간 효율 · 세척 편의 |
| `design` | `concept_direction` | 20대 1인 가구, 벨트라인 미니멀 콘셉트 |

**세션2 `cmf_outsourcing`**

| persona | 키 | 의미 |
|---|---|---|
| `senior` | `spec_format` | 시방서 작성 기준 |
| `senior` | `limit_sample` | 한도 견본 판정표 |
| `senior` | `vendor_criteria` | 업체 선정 기준 (납기·수량·단가) |
| `senior` | `product_concept` | 제품 콘셉트 (거실 오브제·가구 스타일 공기청정기) |
| `senior` | `design_direction` | 디자인 방향 (가전을 가구의 언어로) |
| `senior` | `cmf_spec` | CMF 상세 (하우징 알루미늄·벤트홀 오크·스트랩 소가죽) |
| `engineering` | `inhouse_capability` | 시트지 가능 / 목재 밴딩·오일 마감 불가 |
| `engineering` | `sheet_lead_time` | 시트지 소요 기간 |
| `purchasing` | `budget_limit` | 목재 파트 예산 상한 ※ 금액 미확정 |
| `purchasing` | `cost_impact` | 밴딩 선택 시 예산 초과 가능성 |
| `purchasing` | `part_cost_share` | 전체 생산 단가 |
| `design` | `wood_material_intent` | 오크 원목 소재 선택 의도 |
| `design` | `concept_consistency_criteria` | 대체 마감 시 콘셉트 일관성 기준 |
| `design` | `cmf_alternative_range` | 허용 가능한 CMF 대체 범위 |

> 세션2 `design` 3개 키의 **내용**은 초안입니다(기획 확정 대기).
> 키 이름은 바뀌지 않으므로 프론트 자료함 매핑은 지금 확정해도 됩니다.

### 에러

| 코드 | 상황 | 프론트 처리 |
|---|---|---|
| 400 | 조합 오류, `message` 300자 초과, `context` 필수 필드 누락 | 프론트에서 먼저 검증 |
| 503 | LLM 호출 실패 → `{"error":"llm_unavailable","retryable":true}` | **재시도 버튼** |

> 응답 형식이 깨져도 서버가 폴백해 **200** 을 반환합니다.
> 이때 `intent: "unknown"`, `disclose: []`. 대화는 진행되고 자료 해제만 안 됩니다.

---

## POST /api/report

**카테고리 분류는 프론트에서 끝난 상태로 보냅니다.** 서버·LLM은 재분류하지 않습니다.
긍정·부정 finding이 섞였을 때 LLM이 임의 재배치하거나 누락시키던 문제를 막는 구조입니다.

### 요청 — 세션1·2 공통 구조

```json
{
  "scenario": "cmf_outsourcing",
  "strengths_findings": [
    { "code": "asked_capability_before_final", "evidence": { "ask_seq": 5, "final_seq": 11 } }
  ],
  "cautions_findings": [
    { "code": "limit_sample_missing_in_draft", "evidence": { "draft_seq": 7 } }
  ],
  "missed_findings": [
    { "code": "budget_never_asked", "evidence": {} }
  ],
  "action_logs": [ ... ],

  "scores": { "intent_delivery": 2, "concept_retention": 3, "cost_control": 3 },
  "branch": "outsourcing"
}
```

세션1은 `scores`/`branch` 대신 아래 필드를 추가로 보냅니다.

```json
{
  "scenario": "prototype_revision",
  "strengths_findings": [ ... ],
  "cautions_findings": [ ... ],
  "missed_findings": [ ... ],
  "action_logs": [ ... ],

  "initial_intent": "벨트라인(면 분할)을 살린 3파츠 구조",
  "final_intent_summary": "2파츠로 통합하되 벨트라인 무드는 그래픽으로 유지",
  "round_summary": [
    { "round": "round1", "choice": 1, "reasoning": "제조 단가 우선" },
    { "round": "round2", "choice": 2, "reasoning": "구배 각도 조정" },
    { "round": "round3", "choice": "confirm", "reasoning": "" }
  ],
  "self_eval": { "q1": 4, "q2": 3, "q3": 4, "q4": "반복 수정이 부담됐다" }
}
```

`self_eval` — q1 흥미도 / q2 예상과의 차이 / q3 반복 수행 의향 (각 1~5), q4 서술형(선택)

### finding code → 기본 카테고리

**세션1 (12개)**

| code | 기본 배열 | 의미 |
|---|---|---|
| `manufacturing_method_considered` | strengths | 1차에서 성형 제약 고려한 선택(①/②) |
| `cost_alternative_provided` | strengths | 2차 ③ 선택 시 비용 절감 대안 입력 |
| `core_intent_kept` | strengths | 3차 의도 요약이 최초 의도와 일치 |
| `alternative_proposed_to_engineering` | strengths | 설계 제약에 대안을 스스로 제시 |
| `agreement_confirmed` | strengths | 3차에서 합의안 확정 |
| `cost_alternative_missing` | cautions | 2차 ③ 선택했으나 대안 미입력 |
| `core_intent_abandoned` | cautions | 3차 요약에서 벨트라인 언급 소실 |
| `design_unilaterally_insisted` | cautions | 대안 없이 원안 유지만 요구 |
| `agreement_deferred` | cautions | 3차에서 재검토 요청 |
| `revisited_to_senior` | cautions | 3차에서 선배에게 재검토 요청 |
| `reasoning_missing_round1` | missed | 1차 근거 텍스트 미입력 |
| `reasoning_missing_round2` | missed | 2차 근거 텍스트 미입력 |

**세션2 (10개)**

| code | 기본 배열 | 의미 |
|---|---|---|
기획 확정(2026-11-01)으로 교체. 한도 견본·생산 가능 여부·생산 단가·발주 일정은 챙겼으면 강점, 안 챙겼으면 주의점/놓친 요소로 짝을 이룹니다.

| code | 기본 배열 | 의미 |
|---|---|---|
| `asked_capability_before_final` | strengths | 최종본 전 설계팀에 사내 생산 가능 여부 확인 |
| `limit_sample_attached_in_draft` | strengths | 초안부터 한도 견본 판정표 별첨 |
| `cost_impact_checked` | strengths | 구매팀에 생산 단가·비용 영향 확인 |
| `deadline_margin_considered` | strengths | 12일 발주 일정 여유 고려 |
| `limit_sample_missing_in_draft` | cautions | 초안에 한도 견본 판정표 미별첨 |
| `spec_field_missing` | cautions | 시방서 입력 항목(소재·컬러·마감·사이즈·생산 방식) 일부 누락 |
| `vendor_criteria_incomplete` | cautions | 납기·수량·단가 중 일부만 비교 |
| `capability_never_asked` | missed | 사내 생산 가능 여부 미확인 |
| `budget_never_asked` | missed | 생산 단가·비용 영향 미확인 (이름은 유지, 뜻 변경) |
| `deadline_margin_ignored` | missed | 12일 발주 일정 여유 미고려 |

삭제: `vendor_compared_three`, `revisited_after_branch`, `concept_abandoned`. 목록에 없는 code는 거부하지 않고 경고 로그만 남깁니다.

"기본 배열"은 권장값입니다. 프론트가 다르게 배정해도 서버는 그대로 따릅니다.

### 세션2 분기 → 점수

| `branch` | 라벨 | `concept_retention` | 후속 |
|---|---|---|---|
| `wood_dropped` | 목재 포기, 사출물 변경 | 1 | 시방서 작성으로 **회귀** |
| `sheet_wrap` | 시트지 래핑 | 2 | 외주 단계 건너뛰고 종료 |
| `outsourcing` | 외부 업체 탐색 | 3 | 외주 3개사 비교 제출 |

`wood_dropped` 선택 시 프론트에 `revisit_count` 필요. **회귀 최대 1회 권장.**

### 응답 — 세션2

```json
{
  "work_overview": "오크 원목 하우징의 CMF 시방서를 작성하고 목재 파트 실현 방법을 선택했습니다.",
  "journey": ["한도 견본 판정표 누락으로 보완 요청", "목재 파트 제작 불가 확인, 대안 탐색", "외주 업체 후보 비교 후 보고"],
  "strengths": ["사내 생산 가능 여부를 최종본 제출 전에 확인해 재작업을 줄였습니다."],
  "cautions": ["초안에 한도 견본 판정표를 별첨하지 않아 재요청이 발생했습니다."],
  "missed": ["다른 파트 제작 비용을 포함한 전체 생산 단가는 검토하지 않았습니다."],
  "job_meaning": "제약 속에서 디자인 의도와 현실의 타협점을 찾는 실무 감각을 경험했습니다."
}
```

- `work_overview`(①), `job_meaning`(⑥) — 서술 문장, **항상 채워짐**(와이어프레임 6섹션 중 1·6번).
- `journey` — 업무 진행 과정, **항상 정확히 3개**(시방서 초안 → 2차 → 3차 순). 단계 이름은 화면이 붙이고 여기엔 한 줄 설명만 옵니다.
  모자라거나 빈 자리는 `prompts/fallback.json`의 `_s2_default.journey` 같은 자리 값으로 채웁니다. 세 번째 줄은 `branch`에 따라 달라집니다.
- strengths·cautions·missed는 **보낸 finding 개수만큼 전부, 보낸 순서대로** 돌려줍니다(상한 없음, 폭주 방지용으로만 각 10개). 각 문장 60자 이내. 빈 배열 가능.
- **숫자(점수·등급)를 반환하지 않습니다.**

### 응답 — 세션1

```json
{
  "initial_direction": "...",
  "work_journey": "...",
  "key_changes": "...",
  "competency_record": "...",
  "job_meaning": "..."
}
```

각 2~4문장 서술형. 점수·등급 미포함 (단 "1차 협상" 같은 라운드 서수는 허용).

### 폴백

LLM 실패 시에도 **200 + 고정 문장**을 반환합니다. 리포트 화면은 항상 채워집니다.

---

## POST /api/note

업무 노트 메모장 — 메신저의 "답변 내용 노트에 저장"을 누를 때만 부릅니다. 관계자 답변에서 사실만 뽑아 짧은 메모 줄로 돌려줍니다(`prompts/note.md`).

```json
{
  "scenario": "cmf_outsourcing",
  "speaker": "박책임",
  "team": "설계팀",
  "question": "사용자가 보낸 질문 (선택)",
  "reply": "관계자 답변 원문",
  "existing": ["이 관계자 메모에 이미 있는 줄 (선택)"]
}
```

응답 200: `{"lines": ["목재 접합, 오일 마감은 자사 공장에서 취급하지 않음", "시트지로 대체할 경우 이번 주 내에 제작이 끝날 전망"]}`

- `lines`는 최대 3줄이고 **빈 배열일 수 있습니다**(되묻기만 한 답변, 이미 다 메모된 내용). 이때 화면은 "저장할 내용이 없어요"로 처리합니다.
- LLM·파싱 실패 시에도 200이며, 고정 문장 대신 `reply` 원문을 한 줄로 돌려줍니다.
- 400: `invalid_scenario`, `invalid_reply`(비었거나 4000자 초과), `invalid_speaker`, `invalid_existing`(30줄 초과 등), `payload_too_large`.

## POST /api/session-log

```json
{ "session_id": "클라이언트 생성 UUID v4", "scenario": "cmf_outsourcing", "payload": { ... } }
```

항상 `{"ok":true}` 200. fire-and-forget 으로 호출해도 됩니다.

---

## action_logs 스키마 (프론트가 기록)

리포트 판정의 유일한 근거입니다. `seq` 는 1부터 순차 증가.

```json
{"seq":1,"t":1699834200,"type":"doc_view","target":"spec_format"}
{"seq":2,"t":1699834260,"type":"ask","actor":"engineering","intent":"manufacturing_capability"}
{"seq":3,"t":1699834400,"type":"submit","target":"draft"}
{"seq":4,"t":1699834600,"type":"branch","target":"outsourcing"}
{"seq":5,"t":1699834700,"type":"choice","target":"round1:1"}
```

| 필드 | 설명 |
|---|---|
| `seq` | 1부터 증가. **순서가 곧 판정 근거** |
| `t` | Unix epoch (초) |
| `type` | `doc_view` \| `ask` \| `submit` \| `branch` \| `revise` \| `choice` |
| `actor` | `ask` 일 때 persona |
| `target` | 자료 키 / `draft` / `final` / 분기값 / `round1:1` 등 |

---

## 변경 규칙

이 문서가 프론트·백엔드 간 유일한 계약입니다.
필드 추가·이름 변경 시 **이 문서를 먼저 고치고 공유**한 뒤 구현합니다.

`disclose` 키는 프론트 자료함 잠금 해제 매핑과 1:1 대응해야 합니다.
키가 어긋나면 자료가 열리지 않습니다.
