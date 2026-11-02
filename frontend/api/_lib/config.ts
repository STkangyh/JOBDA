// Loads runtime configuration from the environment (spec §9). No DATABASE_URL:
// this service has no DB (CLAUDE.md rule 2). On Vercel these are set as
// Project Environment Variables (never VITE_-prefixed: those are bundled into the browser).
// Ported from girugi internal/config/config.go.
import { AnthropicClient, LLMClient, OpenAIClient } from "./llm.js";

export interface Config {
  provider: string; // "openai" (default) | "anthropic"
  openaiKey: string;
  openaiBaseURL: string;
  anthropicKey: string;
  model: string;
  allowedOrigins: string[];
}

function envOr(key: string, def: string): string {
  return process.env[key] || def;
}

function modelFor(provider: string): string {
  const explicit = process.env.MODEL;
  if (explicit) return explicit;
  return provider === "anthropic" ? "claude-haiku-4-5-20251001" : "gpt-4o";
}

export function loadConfig(): Config {
  const provider = envOr("LLM_PROVIDER", "openai"); // AI part's prompts are tuned on GPT-4o
  return {
    provider,
    openaiKey: process.env.OPENAI_API_KEY ?? "",
    openaiBaseURL: process.env.OPENAI_BASE_URL ?? "",
    anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
    model: modelFor(provider),
    // Comma-separated origins allowed to call the API from another origin. Unset = same-origin only:
    // the API ships in the same Vercel project as the frontend (JOBDA), so production needs no CORS.
    // Set it (e.g. "http://localhost:5173") only to call a deployed API from a local frontend.
    allowedOrigins: envOr("ALLOWED_ORIGIN", "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  };
}

export function buildLLMClient(cfg: Config): LLMClient {
  return cfg.provider === "anthropic"
    ? new AnthropicClient(cfg.anthropicKey, cfg.model)
    : new OpenAIClient(cfg.openaiKey, cfg.model, cfg.openaiBaseURL);
}
