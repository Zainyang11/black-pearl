// Cloudflare Worker: forwards the game's AI calls to the Claude API with your key.
// Secrets/vars (set in the Cloudflare dashboard or with wrangler):
//   ANTHROPIC_API_KEY  (secret)  your Anthropic API key
//   ALLOWED_ORIGIN     (var)     e.g. https://zainyang11.github.io
const MODELS = new Set(["claude-haiku-5-5", "claude-sonnet-5-5"]);
const MAX_TOKENS = 4096;
const MAX_BODY = 200_000; // bytes

export default {
  async fetch(req, env) {
    const origin = req.headers.get("origin") || "";
    const allowed = origin === env.ALLOWED_ORIGIN;
    const cors = {
      "access-control-allow-origin": allowed ? origin : env.ALLOWED_ORIGIN,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "vary": "origin",
    };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (!allowed) return new Response("forbidden", { status: 403, headers: cors });
    if (req.method !== "POST" || new URL(req.url).pathname !== "/v1/messages")
      return new Response("not found", { status: 404, headers: cors });

    const raw = await req.text();
    if (raw.length > MAX_BODY) return new Response("too large", { status: 413, headers: cors });
    let body;
    try { body = JSON.parse(raw); } catch { return new Response("bad json", { status: 400, headers: cors }); }
    if (!MODELS.has(body.model)) return new Response("model not allowed", { status: 400, headers: cors });

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: body.model,
        max_tokens: Math.min(body.max_tokens || MAX_TOKENS, MAX_TOKENS),
        stream: body.stream === true,
        messages: body.messages,
      }),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { ...cors, "content-type": upstream.headers.get("content-type") || "application/json" },
    });
  },
};
