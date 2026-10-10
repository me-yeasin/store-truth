// Shared assistant tool definitions (no secrets).
// The server route sends TOOLS to the model; the client executes them
// against the local demo store and returns results for the final answer.

export type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export const ASSISTANT_TOOLS = [
  {
    type: "function",
    function: {
      name: "add_sale",
      description: "Record a sale for the active location. Ask for the amount if missing; date defaults to today.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Sale amount above zero." },
          method: { type: "string", enum: ["cash", "card"], description: "Defaults to cash." },
          date: { type: "string", description: "YYYY-MM-DD. Defaults to today." },
          note: { type: "string", description: "Optional note." },
        },
        required: ["amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_cash",
      description: "Record a cash drawer count, cash in, or cash out for the active location.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["count", "in", "out"], description: "Defaults to count." },
          amount: { type: "number", description: "Cash amount above zero." },
          date: { type: "string", description: "YYYY-MM-DD. Defaults to today." },
          note: { type: "string", description: "Optional note." },
        },
        required: ["amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_bank",
      description: "Record a bank deposit, withdrawal, or transfer for the active location.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["deposit", "withdrawal", "transfer"], description: "Defaults to deposit." },
          amount: { type: "number", description: "Amount above zero." },
          date: { type: "string", description: "YYYY-MM-DD. Defaults to today." },
          note: { type: "string", description: "Optional note." },
        },
        required: ["amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_inventory",
      description: "Record a stock count (should-have vs counted) for one item at the active location.",
      parameters: {
        type: "object",
        properties: {
          item: { type: "string", description: "Item name, e.g. Cola 500ml." },
          expected: { type: "number", description: "Should-have quantity, zero or more." },
          counted: { type: "number", description: "Counted quantity, zero or more." },
          date: { type: "string", description: "YYYY-MM-DD. Defaults to today." },
          note: { type: "string", description: "Optional note." },
        },
        required: ["item", "expected", "counted"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_expense",
      description: "Record a vendor expense (starts as pending review) for the active location.",
      parameters: {
        type: "object",
        properties: {
          vendor: { type: "string", description: "Vendor or expense name." },
          amount: { type: "number", description: "Amount above zero." },
          date: { type: "string", description: "YYYY-MM-DD. Defaults to today." },
          note: { type: "string", description: "Optional note." },
        },
        required: ["vendor", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "load_sample_shop",
      description: "Load the pretend Sample Shop dataset so the user can see mismatches instantly. Use when asked for a demo or sample data.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_summary",
      description: "Get today's truth numbers (sales, cash variance, bank gap, stock gaps, pending reviews) for the active location. Use to answer how much was made or what is wrong.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_exceptions",
      description: "List items needing attention in plain words for the active location.",
      parameters: { type: "object", properties: {} },
    },
  },
];
