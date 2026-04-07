// Local share metadata store (IndexedDB)
// Stores per-form sharing info: creatorSecret, token, expiresAt
import { getDB } from './db.js';

export async function saveShareMeta(formId, data) {
  const db = await getDB();
  await db.put('share_meta', { formId, ...data });
}

export async function getShareMeta(formId) {
  const db = await getDB();
  return db.get('share_meta', formId);
}

export async function deleteShareMeta(formId) {
  const db = await getDB();
  await db.delete('share_meta', formId);
}
