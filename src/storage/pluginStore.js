import { getDB } from './db.js';

export async function addCustomPlugin(plugin) {
  const db = await getDB();
  return db.put('plugins', {
    ...plugin,
    installedAt: new Date().toISOString()
  });
}

export async function getCustomPlugins() {
  const db = await getDB();
  return db.getAll('plugins');
}

export async function deleteCustomPlugin(id) {
  const db = await getDB();
  return db.delete('plugins', id);
}
