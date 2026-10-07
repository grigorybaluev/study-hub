// Where the review log lives (#192): IndexedDB on this device. One record per grade, plus a small meta
// store (device id, settings). Private browsing or blocked storage falls back to memory for the
// session, and `persistent` says so, so the UI can warn that progress will not be kept.
import { DEFAULT_SETTINGS, type Review, type Settings } from "./engine";

const DB_NAME = "study-hub-review";
const VERSION = 1;

export interface Store {
  persistent: boolean;
  device: string;
  reviews: Review[];
  settings: Settings;
  add(r: Review): Promise<void>;
  remove(id: string): Promise<void>;
  /** many at once (an import, #193) */
  addAll(rs: Review[]): Promise<void>;
  saveSettings(s: Settings): Promise<void>;
}

function request<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains("reviews")) db.createObjectStore("reviews", { keyPath: "id" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    r.onsuccess = () => {
      // a newer version opening in another tab (a release with VERSION + 1) must not be blocked by this one
      r.result.onversionchange = () => r.result.close();
      res(r.result);
    };
    r.onerror = () => rej(r.error);
    r.onblocked = () => rej(new Error("review database blocked by another tab"));
  });
}

/** A random device id, fixed once per device: it prefixes every review id. */
function newDevice(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

function memoryStore(): Store {
  const s: Store = {
    persistent: false, device: newDevice(), reviews: [], settings: { ...DEFAULT_SETTINGS },
    add: async () => {}, remove: async () => {}, addAll: async () => {}, saveSettings: async () => {},
  };
  return s;
}

/** Open this device's review log. Never throws: without IndexedDB the log lives in memory. */
export async function openStore(): Promise<Store> {
  try {
    return await openDb();
  } catch {
    return memoryStore();
  }
}

async function openDb(): Promise<Store> {
  const db = await open();
  const tx = (mode: IDBTransactionMode) => db.transaction(["reviews", "meta"], mode);
  const t = tx("readonly");
  const [reviews, device, settings] = await Promise.all([
    request(t.objectStore("reviews").getAll() as IDBRequest<Review[]>),
    request(t.objectStore("meta").get("device") as IDBRequest<string | undefined>),
    request(t.objectStore("meta").get("settings") as IDBRequest<Settings | undefined>),
  ]);
  let id = device;
  if (!id) {
    id = newDevice();
    await request(tx("readwrite").objectStore("meta").put(id, "device"));
  }
  const write = async (fn: (s: IDBObjectStore) => void) => {
    const w = db.transaction("reviews", "readwrite");
    fn(w.objectStore("reviews"));
    await new Promise<void>((res, rej) => { w.oncomplete = () => res(); w.onerror = () => rej(w.error); w.onabort = () => rej(w.error); });
  };
  return {
    persistent: true, device: id, reviews, settings: { ...DEFAULT_SETTINGS, ...settings },
    add: (r) => write((s) => s.put(r)),
    remove: (rid) => write((s) => s.delete(rid)),
    addAll: (rs) => write((s) => rs.forEach((r) => s.put(r))),
    saveSettings: async (s) => { await request(tx("readwrite").objectStore("meta").put(s, "settings")); },
  };
}
