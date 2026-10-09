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

const USERS_KEY = "store-truth-demo-users";
const SESSION_KEY = "store-truth-demo-session";
const BUSINESS_KEY = "store-truth-demo-business";
const LOCATION_KEY = "store-truth-demo-location";

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
  else window.localStorage.removeItem(SESSION_KEY);
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
  window.localStorage.removeItem(SESSION_KEY);
}
