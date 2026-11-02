// Scenario/persona/disclose contract shared with the frontend (API.md). The
// disclose whitelist MUST be enforced in code, not by trusting the prompt
// (CLAUDE.md rule 8). Ported 1:1 from internal/domain/domain.go.

export const SCENARIO_CMF = "cmf_outsourcing";
export const SCENARIO_PROTOTYPE = "prototype_revision";

export const PERSONA_SENIOR = "senior";
export const PERSONA_ENGINEERING = "engineering";
export const PERSONA_PURCHASING = "purchasing";
export const PERSONA_DESIGN = "design";

export const SCENARIO_PERSONAS: Record<string, string[]> = {
  [SCENARIO_CMF]: [PERSONA_SENIOR, PERSONA_ENGINEERING, PERSONA_PURCHASING, PERSONA_DESIGN],
  [SCENARIO_PROTOTYPE]: [PERSONA_SENIOR, PERSONA_ENGINEERING, PERSONA_DESIGN],
};

// [scenario][persona] -> allowed disclose keys. The LLM sometimes invents
// keys; anything outside this set is stripped so the frontend's
// document-unlock mapping never receives an unknown key.
export const DISCLOSE_KEYS: Record<string, Record<string, string[]>> = {
  [SCENARIO_CMF]: {
    [PERSONA_SENIOR]: ["spec_format", "limit_sample", "vendor_criteria", "product_concept", "design_direction", "cmf_spec"],
    [PERSONA_ENGINEERING]: ["inhouse_capability", "sheet_lead_time"],
    [PERSONA_PURCHASING]: ["budget_limit", "cost_impact", "part_cost_share"],
    [PERSONA_DESIGN]: ["wood_material_intent", "concept_consistency_criteria", "cmf_alternative_range"],
  },
  [SCENARIO_PROTOTYPE]: {
    [PERSONA_ENGINEERING]: ["molding_cost_constraint", "part_consolidation_criteria", "undercut_constraint", "min_thickness"],
    [PERSONA_SENIOR]: ["belt_line_intent", "revision_guidance_criteria"],
    [PERSONA_DESIGN]: ["user_requirement_keywords", "concept_direction"],
  },
};

// Reference whitelist of report finding codes per scenario (API.md). Used for
// observability: /report logs unknown codes but does not reject them — the
// report must always render (issue #10, BACKEND_SPEC §5).
export const FINDING_CODES: Record<string, string[]> = {
  // Session 2 evaluation criteria confirmed 2026-11-01 (girugi issue #19, JOBDA PR #7).
  [SCENARIO_CMF]: [
    "asked_capability_before_final", "limit_sample_attached_in_draft", "cost_impact_checked", "deadline_margin_considered",
    "limit_sample_missing_in_draft", "spec_field_missing", "vendor_criteria_incomplete",
    "capability_never_asked", "budget_never_asked", "deadline_margin_ignored",
  ],
  [SCENARIO_PROTOTYPE]: [
    "manufacturing_method_considered", "cost_alternative_provided", "core_intent_kept",
    "alternative_proposed_to_engineering", "agreement_confirmed",
    "cost_alternative_missing", "core_intent_abandoned", "design_unilaterally_insisted",
    "agreement_deferred", "revisited_to_senior",
    "reasoning_missing_round1", "reasoning_missing_round2",
  ],
};

// Reference-only (API.md) — the server does NOT validate intent, it is
// passed through and only set to "unknown" on parse fallback. Kept as a
// single source of truth for the frontend/tests, not enforced here.
export const INTENT_VALUES: Record<string, Record<string, string[]>> = {
  [SCENARIO_CMF]: {
    [PERSONA_SENIOR]: ["spec_guidance", "vendor_guidance", "concept_guidance"],
    [PERSONA_ENGINEERING]: ["manufacturing_capability"],
    [PERSONA_PURCHASING]: ["cost_constraint"],
    [PERSONA_DESIGN]: ["concept_feedback", "material_intent_guidance"],
  },
  [SCENARIO_PROTOTYPE]: {
    [PERSONA_ENGINEERING]: ["round1_feedback", "round2_feedback", "round3_feedback", "manufacturing_capability"],
    [PERSONA_SENIOR]: ["design_guidance", "revisit_review"],
    [PERSONA_DESIGN]: ["concept_feedback", "user_perspective"],
  },
};

// Apply to every persona (guardrail responses + fallback).
export const COMMON_INTENTS = ["out_of_scope", "too_vague", "irrelevant", "other", "unknown"];

export function validScenario(s: string): boolean {
  return s in SCENARIO_PERSONAS;
}

export function validPersona(scenario: string, persona: string): boolean {
  return (SCENARIO_PERSONAS[scenario] ?? []).includes(persona);
}

export function validFindingCode(scenario: string, code: string): boolean {
  return (FINDING_CODES[scenario] ?? []).includes(code);
}

// Keeps only keys allowed for scenario+persona, preserving order and
// dropping duplicates. Returns [] when nothing survives (handlers always
// emit disclose as an array, never null).
export function filterDisclose(scenario: string, persona: string, keys: string[] | undefined | null): string[] {
  const allowed = DISCLOSE_KEYS[scenario]?.[persona] ?? [];
  if (!keys || keys.length === 0 || allowed.length === 0) return [];
  const allowedSet = new Set(allowed);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of keys) {
    if (!allowedSet.has(k) || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}
