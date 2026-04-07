// Local share metadata store (IndexedDB) + session helpers
import { getDB } from './db.js';

// ---- IndexedDB: persistent share metadata ----

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

// ---- sessionStorage: manage session (dies on tab close) ----

export function setManageSession(formId, collaborator) {
  sessionStorage.setItem(`manage_${formId}`, JSON.stringify(collaborator));
}

export function getManageSession(formId) {
  const data = sessionStorage.getItem(`manage_${formId}`);
  return data ? JSON.parse(data) : null;
}

export function clearManageSession(formId) {
  sessionStorage.removeItem(`manage_${formId}`);
}
