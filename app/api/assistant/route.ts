import { ASSISTANT_TOOLS } from "../../_lib/assistant-tools";

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
};

export async function POST(request: Request) {
  const baseUrl = process.env.LLM_BASE_URL?.trim().replace(/\/+$/, "");
  const model = process.env.LLM_MODEL?.trim();
  const apiKey = process.env.LLM_API_KEY?.trim();

  if (!baseUrl || !model || !apiKey) {
    return Response.json(
      {
        error:
          "Assistant is not configured. Set LLM_BASE_URL, LLM_MODEL, and LLM_API_KEY in .env.local (see .env.example).",
      },
      { status: 503 }
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "messages is required." }, { status: 400 });
  }
  // Cap history so one chat cannot balloon the bill.
  const messages = body.messages.slice(-20);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        tools: ASSISTANT_TOOLS,
        tool_choice: "auto",
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return Response.json(
        { error: `Assistant provider error (${upstream.status}). ${detail.slice(0, 200)}` },
        { status: 502 }
      );
    }
    const data = await upstream.json();
    const message = data?.choices?.[0]?.message;
    if (!message) {
      return Response.json({ error: "Empty response from assistant provider." }, { status: 502 });
    }
    return Response.json({ message });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return Response.json(
      { error: aborted ? "Assistant timed out. Try again." : "Assistant request failed." },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
