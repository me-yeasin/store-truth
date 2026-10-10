"use client";

import { useRef, useState } from "react";
import { runAgent, type AgentAction } from "../_lib/assistant";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  actions?: AgentAction[];
};

const SUGGESTIONS = [
  "How much did we make today?",
  "Add sale 250 cash",
  "What's wrong today?",
  "Load sample shop",
];

const ACTION_LABELS: Record<string, string> = {
  add_sale: "Sale",
  add_cash: "Cash",
  add_bank: "Bank",
  add_inventory: "Stock",
  add_expense: "Expense",
  load_sample_shop: "Sample",
  get_summary: "Checked truth",
  list_exceptions: "Checked issues",
};

export default function AssistantPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(0);

  function nextId() {
    idRef.current += 1;
    return `m${idRef.current}`;
  }

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || pending) return;
    setError(null);
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    const userMsg: Message = { id: nextId(), role: "user", text: clean };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPending(true);
    try {
      const { text: reply, actions } = await runAgent(history, clean);
      setMessages((prev) => [...prev, { id: nextId(), role: "assistant", text: reply, actions }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assistant failed. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-20 right-4 z-40 rounded-full bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 md:bottom-6 md:right-6"
      >
        {open ? "Close" : "Ask Store Truth"}
      </button>

      {open ? (
        <section
          aria-label="Store Truth assistant"
          className="fixed bottom-32 right-4 z-40 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl md:bottom-20 md:right-6"
        >
          <header className="border-b border-zinc-200 px-5 py-3">
            <p className="text-sm font-bold">Store Truth Assistant</p>
            <p className="text-xs text-zinc-500">
              Does what you can do: sales, cash, bank, stock, expenses, samples.
            </p>
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
            {messages.length === 0 ? (
              <div>
                <p className="text-sm text-zinc-600">
                  Ask about today&apos;s numbers or tell me what to record.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      disabled={pending}
                      className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "ml-8" : "mr-8"}>
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                    m.role === "user" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-900"
                  }`}
                >
                  {m.text}
                </div>
                {m.actions && m.actions.length > 0 ? (
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {m.actions.map((a, i) => (
                      <li
                        key={`${m.id}-${i}`}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                          a.ok
                            ? "border-green-200 bg-green-50 text-green-900"
                            : "border-red-200 bg-red-50 text-red-800"
                        }`}
                      >
                        <span aria-hidden>{a.ok ? "✓" : "!"}</span>
                        <span className="font-bold">
                          {ACTION_LABELS[a.name] ?? a.name}
                        </span>
                        <span className="truncate">{a.summary}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}

            {pending ? (
              <p className="text-sm text-zinc-500" role="status">
                Working on it…
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex gap-2 border-t border-zinc-200 px-4 py-3"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Ask the assistant
            </label>
            <input
              id="assistant-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add sale 250 cash…"
              disabled={pending}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </section>
      ) : null}
    </>
  );
}
