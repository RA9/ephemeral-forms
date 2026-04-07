// Creator identity persistence
// - IndexedDB: remembers creatorId across browser sessions
// - sessionStorage: workspace session (dies on tab close)
import { getDB } from './db.js';

// ---- IndexedDB: persistent creator ID ----

export async function saveCreatorId(creatorId, displayName) {
  const db = await getDB();
  await db.put('creator_meta', { key: 'identity', creatorId, displayName });
}

export async function getCreatorId() {
  const db = await getDB();
  const record = await db.get('creator_meta', 'identity');
  return record || null;
}

export async function clearCreatorId() {
  const db = await getDB();
  await db.delete('creator_meta', 'identity');
}

// ---- sessionStorage: workspace session ----

const WS_KEY = 'workspace_session';

export function setWorkspaceSession(creator) {
  sessionStorage.setItem(WS_KEY, JSON.stringify(creator));
}

export function getWorkspaceSession() {
  const data = sessionStorage.getItem(WS_KEY);
  return data ? JSON.parse(data) : null;
}

export function clearWorkspaceSession() {
  sessionStorage.removeItem(WS_KEY);
}
