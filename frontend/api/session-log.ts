// POST /api/session-log: analytics only, no DB (CLAUDE.md rule 2) — the
// whole payload is written to stdout as a structured log line. A logging
// problem must never break the experience (spec §7), so this always
// returns 200 even on decode failure. Ported from internal/sessionlog/handler.go.
import { loadConfig } from "./_lib/config.js";
import { readBody, sendJSON, withApi } from "./_lib/http.js";

interface SessionLogRequest {
  session_id?: string;
  scenario?: string;
  payload?: unknown;
}

const cfg = loadConfig();

export default withApi(cfg.allowedOrigins, async (req, res) => {
  const body = readBody<SessionLogRequest>(req);
  if (!body) {
    console.warn("session-log decode failed");
    return sendJSON(res, 200, { ok: true });
  }
  console.log(JSON.stringify({
    msg: "session_complete",
    session_id: body.session_id,
    scenario: body.scenario,
    payload: body.payload,
  }));
  return sendJSON(res, 200, { ok: true });
});

