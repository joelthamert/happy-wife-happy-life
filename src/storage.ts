/**
 * Storage adapter — mirrors the Claude artifact `window.storage` API
 * ({ get(key) → { value }, set(key, value) }) so App.jsx works unchanged.
 *
 * Backed by localStorage today. To upgrade, keep the same interface and
 * swap the internals (IndexedDB via idb-keyval, Supabase, Firebase, etc.).
 */
export interface StorageEntry {
  key: string;
  value: string;
}

export const storage = {
  async get(key: string): Promise<StorageEntry | null> {
    const value = localStorage.getItem(key);
    return value === null ? null : { key, value };
  },
  async set(key: string, value: string): Promise<StorageEntry> {
    localStorage.setItem(key, value);
    return { key, value };
  },
  async delete(key: string): Promise<{ key: string; deleted: boolean }> {
    localStorage.removeItem(key);
    return { key, deleted: true };
  },
  async list(prefix = ""): Promise<{ keys: string[]; prefix: string }> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
    return { keys, prefix };
  },
};
