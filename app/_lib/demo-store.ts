// Demo-only browser storage. No cloud, no real security.
// Everything here is clearly labeled in the UI as stored in this browser only.

export type DemoUser = {
  name: string;
  email: string;
  password: string;
};

export type DemoBusiness = {
  name: string;
  currency: string;
};

export type DemoLocation = {
  name: string;
};

export type DemoSession = {
  email: string;
};

export type DemoSale = {
  id: string;
  amount: number;
  date: string;
  method: "cash" | "card";
  note: string;
  ownerEmail: string;
  createdAt: string;
};

export type DemoCash = {
  id: string;
  kind: "count" | "in" | "out";
  amount: number;
  date: string;
  note: string;
  ownerEmail: string;
  createdAt: string;
};

const USERS_KEY = "store-truth-demo-users";
const SESSION_KEY = "store-truth-demo-session";
const BUSINESS_KEY = "store-truth-demo-business";
const LOCATION_KEY = "store-truth-demo-location";
const SALES_KEY = "store-truth-demo-sales";
const CASH_KEY = "store-truth-demo-cash";

function isBrowser() {
  return typeof window !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  notifyDemoChange();
}

function remove(key: string) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
  notifyDemoChange();
}

const DEMO_CHANGE_EVENT = "store-truth-demo-change";

function notifyDemoChange() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(DEMO_CHANGE_EVENT));
}

export function subscribeToDemoChanges(callback: () => void) {
  if (!isBrowser()) return () => {};
  window.addEventListener(DEMO_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(DEMO_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export type DemoSnapshot = {
  email: string | null;
  business: DemoBusiness | null;
  location: DemoLocation | null;
};

export const EMPTY_DEMO_SNAPSHOT = '{"email":null,"business":null,"location":null}';

export function getDemoSnapshotString(): string {
  // Reads browser storage. Call only from useSyncExternalStore getSnapshot
  // (client) — never during render — so server and client agree on first paint.
  if (!isBrowser()) return EMPTY_DEMO_SNAPSHOT;
  const snapshot: DemoSnapshot = {
    email: getSession()?.email ?? null,
    business: getBusiness(),
    location: getLocation(),
  };
  return JSON.stringify(snapshot);
}

export const EMPTY_SALES_SNAPSHOT = "[]";

export function getSalesSnapshotString(): string {
  // Same rule as above: subscribe via useSyncExternalStore, never raw render.
  if (!isBrowser()) return EMPTY_SALES_SNAPSHOT;
  return JSON.stringify(getSales());
}

export const EMPTY_CASH_SNAPSHOT = "[]";

export function getCashSnapshotString(): string {
  if (!isBrowser()) return EMPTY_CASH_SNAPSHOT;
  return JSON.stringify(getCash());
}

export function getUsers(): DemoUser[] {
  return read<DemoUser[]>(USERS_KEY, []);
}

export function saveUser(user: DemoUser) {
  const users = getUsers().filter(
    (u) => u.email.toLowerCase() !== user.email.toLowerCase()
  );
  users.push(user);
  write(USERS_KEY, users);
}

export function findUser(email: string): DemoUser | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getSession(): DemoSession | null {
  return read<DemoSession | null>(SESSION_KEY, null);
}

export function setSession(session: DemoSession | null) {
  if (!isBrowser()) return;
  if (session) write(SESSION_KEY, session);
  else remove(SESSION_KEY);
}

export function getBusiness(): DemoBusiness | null {
  return read<DemoBusiness | null>(BUSINESS_KEY, null);
}

export function setBusiness(business: DemoBusiness) {
  write(BUSINESS_KEY, business);
}

export function getLocation(): DemoLocation | null {
  return read<DemoLocation | null>(LOCATION_KEY, null);
}

export function setLocation(location: DemoLocation) {
  write(LOCATION_KEY, location);
}

export function clearDemoData() {
  if (!isBrowser()) return;
  remove(SESSION_KEY);
}

export function getSales(): DemoSale[] {
  return read<DemoSale[]>(SALES_KEY, []);
}

export function addSale(sale: Omit<DemoSale, "id" | "createdAt">): DemoSale {
  const entry: DemoSale = {
    ...sale,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  write(SALES_KEY, [entry, ...getSales()]);
  return entry;
}

export function deleteSale(id: string) {
  write(
    SALES_KEY,
    getSales().filter((s) => s.id !== id)
  );
}

export function getCash(): DemoCash[] {
  return read<DemoCash[]>(CASH_KEY, []);
}

export function addCash(entry: Omit<DemoCash, "id" | "createdAt">): DemoCash {
  const record: DemoCash = {
    ...entry,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
  };
  write(CASH_KEY, [record, ...getCash()]);
  return record;
}

export function deleteCash(id: string) {
  write(
    CASH_KEY,
    getCash().filter((c) => c.id !== id)
  );
}

export function todayISODate(): string {
  const d = new Date();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}
