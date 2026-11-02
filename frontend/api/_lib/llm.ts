// Wraps the Anthropic Messages API and OpenAI Chat Completions API behind a
// small interface. We call the HTTP API directly with fetch — no SDK
// (CLAUDE.md rule 3). Ported from internal/llm/client.go + openai.go.

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface LLMClient {
  complete(system: string, msgs: Message[], signal?: AbortSignal): Promise<string>;
}

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_TOKENS = 1024;
const MAX_RESP_BYTES = 1 << 20; // guard against a runaway response body

async function readCapped(res: Response): Promise<string> {
  const buf = await res.arrayBuffer();
  const bytes = buf.byteLength > MAX_RESP_BYTES ? buf.slice(0, MAX_RESP_BYTES) : buf;
  return new TextDecoder().decode(bytes);
}

// fetchWithTimeout aborts the request after REQUEST_TIMEOUT_MS, chaining any
// caller-provided signal so an upstream request cancellation also cancels
// the outgoing LLM call.
async function fetchWithTimeout(url: string, init: RequestInit, outerSignal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error("llm: request timeout")), REQUEST_TIMEOUT_MS);
  const onOuterAbort = () => controller.abort(outerSignal?.reason);
  outerSignal?.addEventListener("abort", onOuterAbort);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    outerSignal?.removeEventListener("abort", onOuterAbort);
  }
}

// --- Anthropic ---------------------------------------------------------

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export class AnthropicClient implements LLMClient {
  constructor(private apiKey: string, private model: string) {}

  async complete(system: string, msgs: Message[], signal?: AbortSignal): Promise<string> {
    if (!this.apiKey) throw new Error("llm: ANTHROPIC_API_KEY not set");
    const body = JSON.stringify({ model: this.model, max_tokens: MAX_TOKENS, system, messages: msgs });

    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await this.call(body, signal);
      } catch (err) {
        lastErr = err;
      }
    }
    throw new Error(`llm: complete failed: ${lastErr}`);
  }

  private async call(body: string, signal?: AbortSignal): Promise<string> {
    const res = await fetchWithTimeout(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body,
    }, signal);

    const raw = await readCapped(res);
    if (!res.ok) throw new Error(`llm: api status ${res.status}: ${raw}`);

    const out = JSON.parse(raw) as { content?: { text?: string }[] };
    if (!out.content || out.content.length === 0) throw new Error("llm: empty content");
    return out.content[0].text ?? "";
  }
}

// --- OpenAI --------------------------------------------------------------

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAIClient implements LLMClient {
  private baseURL: string;

  constructor(private apiKey: string, private model: string, baseURL?: string) {
    this.baseURL = baseURL || OPENAI_URL;
  }

  async complete(system: string, msgs: Message[], signal?: AbortSignal): Promise<string> {
    if (!this.apiKey) throw new Error("llm: OPENAI_API_KEY not set");
    const all: Message[] = system ? [{ role: "system", content: system }, ...msgs] : msgs;
    const body = JSON.stringify({
      model: this.model,
      messages: all,
      max_tokens: MAX_TOKENS,
      // Forces the model to emit a valid JSON object at the API level
      // (json_object mode) — removes the "returns plain text" failure mode
      // that no amount of prompt tuning fully fixes; all our prompts
      // already demand JSON.
      response_format: { type: "json_object" },
    });

    let lastErr: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await this.call(body, signal);
      } catch (err) {
        lastErr = err;
      }
    }
    throw new Error(`llm: complete failed: ${lastErr}`);
  }

  private async call(body: string, signal?: AbortSignal): Promise<string> {
    const res = await fetchWithTimeout(this.baseURL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body,
    }, signal);

    const raw = await readCapped(res);
    if (!res.ok) throw new Error(`llm: api status ${res.status}: ${raw}`);

    const out = JSON.parse(raw) as { choices?: { message?: { content?: string } }[] };
    const text = out.choices?.[0]?.message?.content;
    if (!text) throw new Error("llm: empty choices");
    return text;
  }
}
