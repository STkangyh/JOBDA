// Extracts a JSON object from an LLM response that may wrap it in a markdown
// code fence or surround it with plain text (spec §6). Code-fence stripping
// alone is not enough: the observed failure mode is the model printing a
// plain-text answer BEFORE the JSON, so we also trim to the outer braces.
// Ported 1:1 from internal/jsonx/jsonx.go.

/** Removes a surrounding ```...``` markdown code fence if present, including
 * an optional language tag (e.g. ```json). */
export function stripFences(s: string): string {
  const t = s.trim();
  if (!t.startsWith("```")) return t;
  let rest = t.slice(3);
  const nl = rest.indexOf("\n");
  if (nl >= 0) rest = rest.slice(nl + 1);
  rest = rest.trim();
  if (rest.endsWith("```")) rest = rest.slice(0, -3);
  return rest.trim();
}

function trimBeforeFirstBrace(s: string): string {
  const i = s.indexOf("{");
  return i > 0 ? s.slice(i) : s;
}

function trimAfterLastBrace(s: string): string {
  const i = s.lastIndexOf("}");
  return i >= 0 && i < s.length - 1 ? s.slice(0, i + 1) : s;
}

/** Returns the best-effort JSON object substring from raw. */
export function extract(raw: string): string {
  let s = stripFences(raw);
  s = trimBeforeFirstBrace(s);
  s = trimAfterLastBrace(s);
  return s.trim();
}
