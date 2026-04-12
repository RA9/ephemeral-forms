// Settings store (IndexedDB)
import { getDB } from './db.js';

const DEFAULTS = {
  shareLinkExpiry: 7, // days
};

export async function getSetting(key) {
  const db = await getDB();
  const row = await db.get('settings', key);
  return row ? row.value : DEFAULTS[key] ?? null;
}

export async function setSetting(key, value) {
  const db = await getDB();
  await db.put('settings', { key, value });
}

export async function getAllSettings() {
  const db = await getDB();
  const rows = await db.getAll('settings');
  const map = { ...DEFAULTS };
  rows.forEach(r => { map[r.key] = r.value; });
  return map;
}
