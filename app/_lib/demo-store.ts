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
  id: string;
  name: string;
};

export type DemoSession = {
  email: string;
};

export type DemoSale = {
  id: string;
  locationId: string | null;
  amount: number;
  date: string;
  method: "cash" | "card";
  note: string;
  ownerEmail: string;
  createdAt: string;
};

export type DemoCash = {
  id: string;
  locationId: string | null;
  kind: "count" | "in" | "out";
  amount: number;
  date: string;
  note: string;
  ownerEmail: string;
  createdAt: string;
};

export type DemoBank = {
  id: string;
  locationId: string | null;
  kind: "deposit" | "withdrawal" | "transfer";
  amount: number;
  date: string;
  note: string;
  ownerEmail: string;
  createdAt: string;
};

export type DemoInventory = {
  id: string;
  locationId: string | null;
  item: string;
  expected: number;
  counted: number;
  date: string;
  note: string;
  ownerEmail: string;
  createdAt: string;
};

export type DemoExpense = {
  id: string;
  locationId: string | null;
  vendor: string;
  amount: number;
  date: string;
  status: "pending" | "reviewed";
  note: string;
  ownerEmail: string;
  createdAt: string;
};

const USERS_KEY = "store-truth-demo-users";
const SESSION_KEY = "store-truth-demo-session";
const BUSINESS_KEY = "store-truth-demo-business";
const LOCATION_KEY = "store-truth-demo-location";
const LOCATIONS_KEY = "store-truth-demo-locations";
const ACTIVE_LOCATION_KEY = "store-truth-demo-active-location";
const SALES_KEY = "store-truth-demo-sales";
const CASH_KEY = "store-truth-demo-cash";
const BANK_KEY = "store-truth-demo-bank";
const INVENTORY_KEY = "store-truth-demo-inventory";
const EXPENSE_KEY = "store-truth-demo-expenses";
const SEED_IDS_KEY = "store-truth-demo-seed-ids";
const SEED_FLAG_KEY = "store-truth-demo-seeded";

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

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

export function safeParse<T>(raw: unknown, fallback: T): T {
  // Guards against stale dev-server modules or corrupt browser data:
  // never let a bad snapshot crash the page.
  try {
    if (typeof raw !== "string") return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

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

export const EMPTY_BANK_SNAPSHOT = "[]";

export function getBankSnapshotString(): string {
  if (!isBrowser()) return EMPTY_BANK_SNAPSHOT;
  return JSON.stringify(getBank());
}

export const EMPTY_INVENTORY_SNAPSHOT = "[]";

export function getInventorySnapshotString(): string {
  if (!isBrowser()) return EMPTY_INVENTORY_SNAPSHOT;
  return JSON.stringify(getInventory());
}

export const EMPTY_EXPENSE_SNAPSHOT = "[]";

export function getExpenseSnapshotString(): string {
  if (!isBrowser()) return EMPTY_EXPENSE_SNAPSHOT;
  return JSON.stringify(getExpenses());
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
  const activeId = getActiveLocationId();
  const locations = getLocations();
  if (activeId) return locations.find((l) => l.id === activeId) ?? null;
  return locations[0] ?? null;
}

export function setLocation(location: { name: string }) {
  // Legacy single-location shape: rename the active location, or create it.
  const active = getLocation();
  if (active) {
    write(
      LOCATIONS_KEY,
      getLocations().map((l) => (l.id === active.id ? { ...l, name: location.name } : l))
    );
  } else {
    addLocation(location.name);
  }
  // Drop the pre-list key once migrated.
  if (isBrowser()) window.localStorage.removeItem(LOCATION_KEY);
}

export type LocationsSnapshot = {
  locations: DemoLocation[];
  activeId: string | null;
};

export const EMPTY_LOCATIONS_SNAPSHOT = '{"locations":[],"activeId":null}';

export function getLocationsSnapshotString(): string {
  if (!isBrowser()) return EMPTY_LOCATIONS_SNAPSHOT;
  const snapshot: LocationsSnapshot = {
    locations: getLocations(),
    activeId: getActiveLocationId(),
  };
  return JSON.stringify(snapshot);
}

function migrateLegacyLocation(): void {
  if (!isBrowser()) return;
  if (read<DemoLocation[]>(LOCATIONS_KEY, []).length > 0) return;
  const legacy = read<{ name?: string } | null>(LOCATION_KEY, null);
  const name = legacy?.name?.trim();
  if (!name) return;
  const created: DemoLocation = { id: newId(), name };
  window.localStorage.setItem(LOCATIONS_KEY, JSON.stringify([created]));
  window.localStorage.setItem(ACTIVE_LOCATION_KEY, JSON.stringify(created.id));
  // Stamp pre-list entries to the migrated location so nothing is lost.
  const stamp = <T extends { locationId?: string | null }>(key: string) => {
    const rows = read<T[]>(key, []);
    if (rows.some((r) => r.locationId == null)) {
      window.localStorage.setItem(
        key,
        JSON.stringify(rows.map((r) => (r.locationId == null ? { ...r, locationId: created.id } : r)))
      );
    }
  };
  stamp(SALES_KEY);
  stamp(CASH_KEY);
  stamp(BANK_KEY);
  stamp(INVENTORY_KEY);
  stamp(EXPENSE_KEY);
  window.localStorage.removeItem(LOCATION_KEY);
  notifyDemoChange();
}

export function getLocations(): DemoLocation[] {
  migrateLegacyLocation();
  const rows = read<DemoLocation[]>(LOCATIONS_KEY, []);
  // Normalize once and write back so snapshots stay stable across reads.
  let changed = false;
  const normalized = rows.map((r) => {
    if (r && typeof r === "object" && "id" in r && r.id && "name" in r) return r;
    changed = true;
    return { id: newId(), name: String((r as { name?: string } | null)?.name ?? "Shop") };
  });
  if (changed && isBrowser()) {
    window.localStorage.setItem(LOCATIONS_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function getActiveLocationId(): string | null {
  migrateLegacyLocation();
  const id = read<string | null>(ACTIVE_LOCATION_KEY, null);
  if (id && getLocationsRaw().some((l) => l.id === id)) return id;
  return null;
}

function getLocationsRaw(): DemoLocation[] {
  return read<DemoLocation[]>(LOCATIONS_KEY, []);
}

export function addLocation(name: string): DemoLocation {
  const created: DemoLocation = { id: newId(), name: name.trim() };
  const locations = [...getLocations(), created];
  write(LOCATIONS_KEY, locations);
  if (!read<string | null>(ACTIVE_LOCATION_KEY, null)) {
    write(ACTIVE_LOCATION_KEY, created.id);
  }
  return created;
}

export function setActiveLocationId(id: string) {
  write(ACTIVE_LOCATION_KEY, id);
}

export function currentLocationId(): string | null {
  return getActiveLocationId();
}

export function inLocation<T extends { locationId?: string | null }>(
  entries: T[],
  activeId: string | null
): T[] {
  // No active location yet: show everything so early entries stay visible.
  if (!activeId) return entries;
  return entries.filter((e) => e.locationId === activeId);
}

export function clearDemoData() {
  if (!isBrowser()) return;
  remove(SESSION_KEY);
}

export function getSales(): DemoSale[] {
  return read<DemoSale[]>(SALES_KEY, []);
}

export function addSale(sale: Omit<DemoSale, "id" | "createdAt" | "locationId">): DemoSale {
  const entry: DemoSale = {
    ...sale,
    locationId: currentLocationId(),
    id: newId(),
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

export function addCash(entry: Omit<DemoCash, "id" | "createdAt" | "locationId">): DemoCash {
  const record: DemoCash = {
    ...entry,
    locationId: currentLocationId(),
    id: newId(),
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

export function getBank(): DemoBank[] {
  return read<DemoBank[]>(BANK_KEY, []);
}

export function addBank(entry: Omit<DemoBank, "id" | "createdAt" | "locationId">): DemoBank {
  const record: DemoBank = {
    ...entry,
    locationId: currentLocationId(),
    id: newId(),
    createdAt: new Date().toISOString(),
  };
  write(BANK_KEY, [record, ...getBank()]);
  return record;
}

export function deleteBank(id: string) {
  write(
    BANK_KEY,
    getBank().filter((b) => b.id !== id)
  );
}

export function getInventory(): DemoInventory[] {
  return read<DemoInventory[]>(INVENTORY_KEY, []);
}

export function addInventory(entry: Omit<DemoInventory, "id" | "createdAt" | "locationId">): DemoInventory {
  const record: DemoInventory = {
    ...entry,
    locationId: currentLocationId(),
    id: newId(),
    createdAt: new Date().toISOString(),
  };
  write(INVENTORY_KEY, [record, ...getInventory()]);
  return record;
}

export function deleteInventory(id: string) {
  write(
    INVENTORY_KEY,
    getInventory().filter((i) => i.id !== id)
  );
}

export function getExpenses(): DemoExpense[] {
  return read<DemoExpense[]>(EXPENSE_KEY, []);
}

export function addExpense(entry: Omit<DemoExpense, "id" | "createdAt" | "status" | "locationId"> & { status?: DemoExpense["status"] }): DemoExpense {
  const record: DemoExpense = {
    ...entry,
    locationId: currentLocationId(),
    status: entry.status ?? "pending",
    id: newId(),
    createdAt: new Date().toISOString(),
  };
  write(EXPENSE_KEY, [record, ...getExpenses()]);
  return record;
}

export function setExpenseStatus(id: string, status: DemoExpense["status"]) {
  write(
    EXPENSE_KEY,
    getExpenses().map((e) => (e.id === id ? { ...e, status } : e))
  );
}

export function deleteExpense(id: string) {
  write(
    EXPENSE_KEY,
    getExpenses().filter((e) => e.id !== id)
  );
}

export function todayISODate(): string {
  const d = new Date();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export type SeedIds = {
  sales: string[];
  cash: string[];
  bank: string[];
  inventory: string[];
  expenses: string[];
};

const EMPTY_SEED_IDS: SeedIds = { sales: [], cash: [], bank: [], inventory: [], expenses: [] };

export function isSampleSeeded(): boolean {
  return read<boolean>(SEED_FLAG_KEY, false);
}

export function getSeedFlagSnapshotString(): string {
  if (!isBrowser()) return "";
  return isSampleSeeded() ? "seeded" : "";
}

export function seedSampleShop(ownerEmail: string): SeedIds {
  if (!isBrowser()) return EMPTY_SEED_IDS;
  // Never seed twice without clearing first.
  if (isSampleSeeded()) return read<SeedIds>(SEED_IDS_KEY, EMPTY_SEED_IDS);

  // Sample entries live in their own location so real data stays separate.
  let sample = getLocations().find((l) => l.name === "Sample Shop") ?? null;
  if (!sample) {
    sample = addLocation("Sample Shop");
  }
  setActiveLocationId(sample.id);
  if (!getBusiness()) {
    setBusiness({ name: "Sample Corner Shop", currency: "USD" });
  }

  const date = todayISODate();
  const ids: SeedIds = { sales: [], cash: [], bank: [], inventory: [], expenses: [] };

  const sales: DemoSale[] = [
    {
      id: newId(),
      locationId: sample.id,
      amount: 650,
      date,
      method: "cash",
      note: "Lunch + dinner rush",
      ownerEmail,
      createdAt: new Date().toISOString(),
    },
    {
      id: newId(),
      locationId: sample.id,
      amount: 350,
      date,
      method: "card",
      note: "Card terminal",
      ownerEmail,
      createdAt: new Date().toISOString(),
    },
  ];
  write(SALES_KEY, [...sales, ...getSales()]);
  ids.sales = sales.map((s) => s.id);

  const cash: DemoCash[] = [
    {
      id: newId(),
      locationId: sample.id,
      kind: "count",
      amount: 450,
      date,
      note: "Night close, register 1",
      ownerEmail,
      createdAt: new Date().toISOString(),
    },
    {
      id: newId(),
      locationId: sample.id,
      kind: "out",
      amount: 50,
      date,
      note: "Paid cleaner",
      ownerEmail,
      createdAt: new Date().toISOString(),
    },
  ];
  write(CASH_KEY, [...cash, ...getCash()]);
  ids.cash = cash.map((c) => c.id);

  const bank: DemoBank[] = [
    {
      id: newId(),
      locationId: sample.id,
      kind: "deposit",
      amount: 700,
      date,
      note: "Weekend takings",
      ownerEmail,
      createdAt: new Date().toISOString(),
    },
  ];
  write(BANK_KEY, [...bank, ...getBank()]);
  ids.bank = bank.map((b) => b.id);

  const stock: DemoInventory[] = [
    {
      id: newId(),
      locationId: sample.id,
      item: "Cola 500ml",
      expected: 100,
      counted: 95,
      date,
      note: "Back shelf counted twice",
      ownerEmail,
      createdAt: new Date().toISOString(),
    },
    {
      id: newId(),
      locationId: sample.id,
      item: "Bread Loaf",
      expected: 50,
      counted: 50,
      date,
      note: "",
      ownerEmail,
      createdAt: new Date().toISOString(),
    },
  ];
  write(INVENTORY_KEY, [...stock, ...getInventory()]);
  ids.inventory = stock.map((s) => s.id);

  const expenses: DemoExpense[] = [
    {
      id: newId(),
      locationId: sample.id,
      vendor: "Mystery supplier invoice",
      amount: 210,
      date,
      status: "pending",
      note: "Never heard of this vendor",
      ownerEmail,
      createdAt: new Date().toISOString(),
    },
    {
      id: newId(),
      locationId: sample.id,
      vendor: "Power bill",
      amount: 120,
      date,
      status: "reviewed",
      note: "Monthly",
      ownerEmail,
      createdAt: new Date().toISOString(),
    },
  ];
  write(EXPENSE_KEY, [...expenses, ...getExpenses()]);
  ids.expenses = expenses.map((e) => e.id);

  write(SEED_IDS_KEY, ids);
  write(SEED_FLAG_KEY, true);
  return ids;
}

export function clearSampleShop(): void {
  if (!isBrowser()) return;
  const ids = read<SeedIds>(SEED_IDS_KEY, EMPTY_SEED_IDS);
  const drop = <T extends { id: string }>(key: string, removeIds: string[]) => {
    if (removeIds.length === 0) return;
    const keep = new Set(removeIds);
    write(key, read<T[]>(key, []).filter((r) => !keep.has(r.id)));
  };
  drop(SALES_KEY, ids.sales);
  drop(CASH_KEY, ids.cash);
  drop(BANK_KEY, ids.bank);
  drop(INVENTORY_KEY, ids.inventory);
  drop(EXPENSE_KEY, ids.expenses);
  remove(SEED_IDS_KEY);
  remove(SEED_FLAG_KEY);
}
