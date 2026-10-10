"use client";

// Client-side agent loop. The model never touches storage directly:
// the server route returns tool calls, we execute them against the local
// demo store here, send results back, and render the final answer.

import { normalizeDate } from "./csv";
import {
  addBank,
  addCash,
  addExpense,
  addInventory,
  addSale,
  getBank,
  getBusiness,
  getCash,
  getExpenses,
  getInventory,
  getLocation,
  getSales,
  getSession,
  inLocation,
  seedSampleShop,
  todayISODate,
} from "./demo-store";
import { computeTruth } from "./truth";

export type AgentAction = {
  name: string;
  summary: string;
  ok: boolean;
};

export type AgentEvent =
  | { type: "thinking"; round: number }
  | { type: "tool_start"; name: string; detail: string }
  | { type: "tool_end"; name: string; summary: string; ok: boolean }
  | { type: "answering" };

type WireMessage = {
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

function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function buildContext(): string {
  const business = getBusiness();
  const location = getLocation();
  const email = getSession()?.email ?? "demo-owner";
  const activeId = location?.id ?? null;
  const currency = business?.currency ?? "USD";
  const sales = inLocation(getSales(), activeId);
  const cash = inLocation(getCash(), activeId);
  const bank = inLocation(getBank(), activeId);
  const inventory = inLocation(getInventory(), activeId);
  const expenses = inLocation(getExpenses(), activeId);
  const truth = computeTruth(sales, cash, bank, currency, inventory, expenses);

  const recent = [
    ...sales.slice(0, 5).map((s) => `sale ${s.amount} ${s.method} ${s.date}${s.note ? ` (${s.note})` : ""}`),
    ...cash.slice(0, 5).map((c) => `cash ${c.kind} ${c.amount} ${c.date}`),
    ...bank.slice(0, 5).map((b) => `bank ${b.kind} ${b.amount} ${b.date}`),
    ...inventory.slice(0, 5).map((i) => `stock ${i.item} should ${i.expected} counted ${i.counted}`),
    ...expenses.slice(0, 5).map((e) => `expense ${e.vendor} ${e.amount} [${e.status}]`),
  ];

  const lines = [
    `Business: ${business?.name ?? "(not set)"} (${currency}).`,
    `Active location: ${location?.name ?? "(none)"}.`,
    `User: ${email}. Today is ${todayISODate()}.`,
    `Totals: sales ${truth.salesTotal} (${truth.salesCount}), cash counted ${truth.counted} expected ${truth.expectedCash} variance ${truth.cashVariance}, deposits ${truth.deposits} bank gap ${truth.bankGap}, stock gaps ${truth.stockGaps}, pending reviews ${truth.pendingReviews}.`,
    recent.length > 0 ? `Recent entries: ${recent.join(" | ")}` : "No entries yet.",
  ];
  if (truth.items.length > 0) {
    lines.push(`Open issues: ${truth.items.map((i) => i.title).join(" | ")}`);
  }
  return lines.join("\n");
}

const SYSTEM_PROMPT = `You are the Store Truth assistant, a truth-first helper for a small business owner. Answer in plain words, no jargon. Keep answers short.

Rules:
- Everything you do applies to the ACTIVE location only. Say which location you acted on.
- Dates default to today when the user does not give one. Never invent amounts.
- If a required amount or name is missing, ask for it instead of guessing.
- After doing something, confirm it with the exact numbers.
- When asked how much was made or what is wrong, read the numbers from context and explain mismatches plainly.`;

function executeTool(name: string, args: Record<string, unknown>, owner: string): { summary: string; result: string; ok: boolean } {
  try {
    const date = str(args.date) ? (normalizeDate(str(args.date)) ?? todayISODate()) : todayISODate();
    const note = str(args.note);
    if (name === "add_sale") {
      const amount = num(args.amount);
      if (amount === null || amount <= 0) throw new Error("amount must be above zero");
      const method = str(args.method).toLowerCase() === "card" ? "card" : "cash";
      addSale({ amount: Math.round(amount * 100) / 100, date, method, note, ownerEmail: owner });
      return { ok: true, summary: `Added sale ${amount.toFixed(2)} ${method}`, result: `Recorded sale of ${amount.toFixed(2)} (${method}) on ${date}.` };
    }
    if (name === "add_cash") {
      const amount = num(args.amount);
      if (amount === null || amount <= 0) throw new Error("amount must be above zero");
      const raw = str(args.kind).toLowerCase();
      const kind = raw === "in" || raw === "out" ? raw : "count";
      addCash({ kind, amount: Math.round(amount * 100) / 100, date, note, ownerEmail: owner });
      return { ok: true, summary: `Recorded ${kind} ${amount.toFixed(2)}`, result: `Recorded cash ${kind} of ${amount.toFixed(2)} on ${date}.` };
    }
    if (name === "add_bank") {
      const amount = num(args.amount);
      if (amount === null || amount <= 0) throw new Error("amount must be above zero");
      const raw = str(args.kind).toLowerCase();
      const kind = raw === "withdrawal" || raw === "transfer" ? raw : "deposit";
      addBank({ kind, amount: Math.round(amount * 100) / 100, date, note, ownerEmail: owner });
      return { ok: true, summary: `Recorded ${kind} ${amount.toFixed(2)}`, result: `Recorded bank ${kind} of ${amount.toFixed(2)} on ${date}.` };
    }
    if (name === "add_inventory") {
      const item = str(args.item);
      const expected = num(args.expected);
      const counted = num(args.counted);
      if (!item) throw new Error("item name is required");
      if (expected === null || expected < 0 || counted === null || counted < 0)
        throw new Error("expected and counted must be zero or more");
      addInventory({ item, expected: Math.round(expected), counted: Math.round(counted), date, note, ownerEmail: owner });
      return { ok: true, summary: `Counted ${item}: ${Math.round(counted)}/${Math.round(expected)}`, result: `Recorded ${item}: should have ${Math.round(expected)}, counted ${Math.round(counted)} on ${date}.` };
    }
    if (name === "add_expense") {
      const vendor = str(args.vendor);
      const amount = num(args.amount);
      if (!vendor) throw new Error("vendor is required");
      if (amount === null || amount <= 0) throw new Error("amount must be above zero");
      addExpense({ vendor, amount: Math.round(amount * 100) / 100, date, note, ownerEmail: owner });
      return { ok: true, summary: `Added expense ${vendor} ${amount.toFixed(2)} (pending)`, result: `Recorded expense ${vendor} ${amount.toFixed(2)} on ${date}. It is pending review.` };
    }
    if (name === "load_sample_shop") {
      seedSampleShop(owner);
      return { ok: true, summary: "Loaded sample shop", result: "Sample Shop loaded: cash short 150, bank gap 300, a stock gap, and a pending vendor bill." };
    }
    if (name === "get_summary" || name === "list_exceptions") {
      return { ok: true, summary: "Read today's truth", result: buildContext() };
    }
    return { ok: false, summary: `Unknown action ${name}`, result: `Unknown tool: ${name}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed";
    return { ok: false, summary: `Failed: ${message}`, result: `Could not complete ${name}: ${message}. Ask the user for the missing detail.` };
  }
}

function describeArgs(name: string, args: Record<string, unknown>): string {
  const parts: string[] = [];
  const amount = num(args.amount);
  if (amount !== null) parts.push(`${amount}`);
  if (str(args.method)) parts.push(str(args.method));
  if (str(args.kind)) parts.push(str(args.kind));
  if (str(args.item)) parts.push(str(args.item));
  if (str(args.vendor)) parts.push(str(args.vendor));
  if (str(args.date)) parts.push(str(args.date));
  if (parts.length === 0) return "checking numbers";
  return parts.join(" · ");
}
export async function runAgent(
  history: Array<{ role: "user" | "assistant"; text: string }>,
  userText: string,
  onEvent?: (event: AgentEvent) => void
): Promise<{ text: string; actions: AgentAction[] }> {
  const owner = getSession()?.email ?? "demo-owner";
  const messages: WireMessage[] = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\nLive data:\n${buildContext()}` },
    ...history.map((h) => ({ role: h.role, content: h.text }) as WireMessage),
    { role: "user", content: userText },
  ];
  const actions: AgentAction[] = [];

  for (let round = 0; round < 5; round++) {
    onEvent?.({ type: "thinking", round: round + 1 });
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error ?? "Assistant request failed.");
    }
    const message = data.message as WireMessage;
    const calls = message?.tool_calls ?? [];
    if (calls.length === 0) {
      onEvent?.({ type: "answering" });
      return { text: message?.content?.trim() || "Done.", actions };
    }
    messages.push({
      role: "assistant",
      content: message.content,
      tool_calls: calls.map((c) => ({ id: c.id, type: "function", function: c.function })),
    });
    for (const call of calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = {};
      }
      onEvent?.({ type: "tool_start", name: call.function.name, detail: describeArgs(call.function.name, args) });
      const done = executeTool(call.function.name, args, owner);
      onEvent?.({ type: "tool_end", name: call.function.name, summary: done.summary, ok: done.ok });
      actions.push({ name: call.function.name, summary: done.summary, ok: done.ok });
      messages.push({ role: "tool", content: done.result, tool_call_id: call.id });
    }
  }
  return { text: "Finished the actions above — ask me to summarize them.", actions };
}
