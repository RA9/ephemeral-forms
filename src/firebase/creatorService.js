// Creator identity + plugin sync service
import { db } from './config.js';
import {
  collection, doc, getDoc, setDoc, updateDoc,
  query, where, getDocs, orderBy, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { hashPassphrase, verifyPassphrase } from '../utils/crypto.js';

const CREATORS = 'creators';
const SHARED_PLUGINS = 'shared_plugins';
const SHARED_FORMS = 'shared_forms';

// ============================================================
// CREATOR IDENTITY
// ============================================================

/**
 * Create a new global creator identity.
 * @returns {{ creatorId: string, displayName: string }}
 */
export async function createCreator(displayName, passphrase) {
  const creatorId = nanoid(16);
  const { salt, hash } = await hashPassphrase(passphrase);

  await setDoc(doc(db, CREATORS, creatorId), {
    displayName,
    salt,
    hash,
    createdAt: new Date().toISOString(),
  });

  return { creatorId, displayName };
}

/**
 * Verify a passphrase against a creator record.
 * @returns {{ creatorId: string, displayName: string } | null}
 */
export async function verifyCreator(creatorId, passphrase) {
  const snap = await getDoc(doc(db, CREATORS, creatorId));
  if (!snap.exists()) return null;

  const data = snap.data();
  const valid = await verifyPassphrase(passphrase, data.salt, data.hash);
  if (!valid) return null;

  return { creatorId, displayName: data.displayName };
}

/**
 * Get creator display info (no secret data).
 */
export async function getCreatorById(creatorId) {
  const snap = await getDoc(doc(db, CREATORS, creatorId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { creatorId, displayName: data.displayName, createdAt: data.createdAt };
}

/**
 * Change a creator's passphrase.
 */
export async function changeCreatorPassphrase(creatorId, newPassphrase) {
  const { salt, hash } = await hashPassphrase(newPassphrase);
  await updateDoc(doc(db, CREATORS, creatorId), { salt, hash });
}

/**
 * Get all shared forms belonging to a creator.
 */
export async function getCreatorForms(creatorId) {
  const q = query(
    collection(db, SHARED_FORMS),
    where('creatorId', '==', creatorId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      form: JSON.parse(data.formJson),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      pluginIds: data.pluginIds || [],
    };
  });
}

// ============================================================
// PLUGIN SYNC
// ============================================================

/**
 * Upload a custom plugin to Firestore.
 * @returns {string} pluginId
 */
export async function syncPlugin(creatorId, plugin) {
  // Check if already synced (by name + creatorId)
  const q = query(
    collection(db, SHARED_PLUGINS),
    where('creatorId', '==', creatorId),
    where('name', '==', plugin.name || plugin.id)
  );
  const existing = await getDocs(q);

  if (!existing.empty) {
    // Update existing
    const existingDoc = existing.docs[0];
    await updateDoc(existingDoc.ref, {
      code: plugin.code,
      updatedAt: new Date().toISOString(),
    });
    return existingDoc.id;
  }

  // Create new
  const pluginId = nanoid(12);
  await setDoc(doc(db, SHARED_PLUGINS, pluginId), {
    name: plugin.name || plugin.id,
    code: plugin.code,
    creatorId,
    formIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return pluginId;
}

/**
 * Get all plugins synced by a creator.
 */
export async function getCreatorPlugins(creatorId) {
  const q = query(
    collection(db, SHARED_PLUGINS),
    where('creatorId', '==', creatorId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Get plugins needed for a specific form (by pluginIds array).
 */
export async function getPluginsForForm(pluginIds) {
  if (!pluginIds || pluginIds.length === 0) return [];
  const results = [];
  for (const pid of pluginIds) {
    const snap = await getDoc(doc(db, SHARED_PLUGINS, pid));
    if (snap.exists()) {
      results.push({ id: snap.id, ...snap.data() });
    }
  }
  return results;
}

/**
 * Link a plugin to a form (updates both shared_plugins.formIds and shared_forms.pluginIds).
 */
export async function linkPluginToForm(pluginId, formId) {
  await updateDoc(doc(db, SHARED_PLUGINS, pluginId), {
    formIds: arrayUnion(formId),
  });
  await updateDoc(doc(db, SHARED_FORMS, formId), {
    pluginIds: arrayUnion(pluginId),
  });
}

/**
 * Auto-detect and sync custom plugins used by a form's questions.
 * Reads custom plugins from IndexedDB and checks if the form uses non-builtin types.
 */
export async function autoSyncFormPlugins(creatorId, form, customPlugins = []) {
  if (customPlugins.length === 0) return [];

  // Built-in types that don't need syncing
  const builtinTypes = new Set([
    'short_text', 'long_text', 'multiple_choice', 'checkboxes',
    'dropdown', 'linear_scale', 'date', 'time', 'file_upload', 'section_header',
    'rating', 'signature', 'stepper',
  ]);

  // Question types used in this form
  const usedTypes = new Set((form.questions || []).map(q => q.type));

  const pluginIds = [];

  for (const plugin of customPlugins) {
    // Custom plugins might register types we can't easily introspect,
    // so sync all custom plugins if the form has any non-builtin types
    const hasCustomTypes = [...usedTypes].some(t => !builtinTypes.has(t));
    if (hasCustomTypes && plugin.code) {
      const pid = await syncPlugin(creatorId, plugin);
      await linkPluginToForm(pid, form.id);
      pluginIds.push(pid);
    }
  }

  return pluginIds;
}

/**
 * Load and execute plugins from Firestore (for shared form rendering).
 */
export async function loadRemotePlugins(pluginIds) {
  const plugins = await getPluginsForForm(pluginIds);
  for (const plugin of plugins) {
    try {
      const script = document.createElement('script');
      script.textContent = plugin.code;
      document.head.appendChild(script);
    } catch (err) {
      console.warn(`Failed to load remote plugin ${plugin.name}:`, err);
    }
  }
}
