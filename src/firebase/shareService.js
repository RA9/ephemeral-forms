// Firestore service for magic link sharing with passphrase auth + collaborators + audit
import { db } from './config.js';
import {
  collection, doc, getDoc, setDoc, updateDoc,
  query, where, getDocs, orderBy, addDoc, limit,
  onSnapshot
} from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { hashPassphrase, verifyPassphrase, generateFormKey, wrapFormKey, unwrapFormKey, encryptData, decryptData } from '../utils/crypto.js';

const SHARED_FORMS = 'shared_forms';
const MAGIC_LINKS = 'magic_links';
const SHARED_RESPONSES = 'shared_responses';
const COLLABORATORS = 'collaborators';
const AUDIT_LOGS = 'audit_logs';

import { getSetting } from '../storage/settingsStore.js';

const DEFAULT_TTL_DAYS = 7;

async function getExpiryDays() {
  const val = await getSetting('shareLinkExpiry');
  return val || DEFAULT_TTL_DAYS;
}

function expiresAtFromDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ============================================================
// AUDIT LOGGING
// ============================================================

export async function addAuditLog(formId, actor, action, metadata = {}) {
  await addDoc(collection(db, AUDIT_LOGS), {
    formId,
    actor,
    action,
    metadata: JSON.stringify(metadata),
    timestamp: new Date().toISOString(),
  });
}

export async function getAuditLogs(formId, maxResults = 50) {
  const q = query(
    collection(db, AUDIT_LOGS),
    where('formId', '==', formId),
    orderBy('timestamp', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      metadata: data.metadata ? JSON.parse(data.metadata) : {},
    };
  });
}

// ============================================================
// COLLABORATORS
// ============================================================

export async function addCollaborator(formId, displayName, passphrase, role = 'editor') {
  const { salt, hash } = await hashPassphrase(passphrase);
  const colRef = await addDoc(collection(db, COLLABORATORS), {
    formId,
    displayName,
    salt,
    hash,
    role,
    createdAt: new Date().toISOString(),
  });
  return { id: colRef.id, displayName, role };
}

export async function getCollaborators(formId) {
  const q = query(collection(db, COLLABORATORS), where('formId', '==', formId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    displayName: d.data().displayName,
    role: d.data().role,
    createdAt: d.data().createdAt,
  }));
}

export async function removeCollaborator(collaboratorId) {
  const ref = doc(db, COLLABORATORS, collaboratorId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Collaborator not found');
  // Soft-delete by updating role to 'removed'
  await updateDoc(ref, { role: 'removed' });
}

/**
 * Verify a passphrase against all collaborators for a form.
 * Returns the matching collaborator { id, displayName, role } or null.
 */
export async function verifyCollaborator(formId, passphrase) {
  const q = query(collection(db, COLLABORATORS), where('formId', '==', formId));
  const snap = await getDocs(q);

  for (const d of snap.docs) {
    const data = d.data();
    if (data.role === 'removed') continue;
    const valid = await verifyPassphrase(passphrase, data.salt, data.hash);
    if (valid) {
      return { id: d.id, displayName: data.displayName, role: data.role };
    }
  }
  return null;
}

// ============================================================
// INVITE CODES (for adding collaborators)
// ============================================================

export async function createInviteCode(formId, role = 'editor') {
  const code = nanoid(8).toUpperCase();
  await setDoc(doc(db, 'invite_codes', code), {
    formId,
    role,
    used: false,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAtFromDays(await getExpiryDays()),
  });
  return code;
}

export async function redeemInviteCode(code, displayName, passphrase) {
  const ref = doc(db, 'invite_codes', code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { error: 'Invalid invite code' };

  const data = snap.data();
  if (data.used) return { error: 'This invite code has already been used' };
  if (new Date(data.expiresAt) < new Date()) return { error: 'Invite code expired' };

  // Add as collaborator
  const collab = await addCollaborator(data.formId, displayName, passphrase, data.role);

  // Mark code as used
  await updateDoc(ref, { used: true, usedBy: displayName });

  // Audit
  await addAuditLog(data.formId, displayName, 'joined_via_invite', { role: data.role });

  return { collaborator: collab, formId: data.formId };
}

// ============================================================
// SHARE A FORM (creator sets passphrase, becomes owner)
// ============================================================

export async function shareForm(form, ownerName, passphrase, creatorId = null) {
  const { salt: masterSalt, hash: masterHash } = await hashPassphrase(passphrase);
  const token = nanoid(16);
  const now = new Date().toISOString();
  const expires = expiresAtFromDays(await getExpiryDays());

  // Generate encryption key for responses
  const formKey = generateFormKey();
  const { wrappedKey, keySalt } = await wrapFormKey(formKey, passphrase);

  // Store the form
  const formDoc = {
    formJson: JSON.stringify(form),
    masterSalt,
    masterHash,
    ownerName,
    pluginIds: [],
    wrappedKey,
    keySalt,
    encrypted: true,
    createdAt: now,
    updatedAt: now,
  };
  if (creatorId) formDoc.creatorId = creatorId;

  await setDoc(doc(db, SHARED_FORMS, form.id), formDoc);

  // Create owner as first collaborator
  await addCollaborator(form.id, ownerName, passphrase, 'owner');

  // Create magic link
  await setDoc(doc(db, MAGIC_LINKS, token), {
    formId: form.id,
    expiresAt: expires,
    createdAt: now,
    isRevoked: false,
  });

  // Audit
  await addAuditLog(form.id, ownerName, 'shared_form', { token });

  return { token, expiresAt: expires, formKey };
}

// ============================================================
// GET FORM BY TOKEN (respondent side)
// ============================================================

export async function getSharedForm(token) {
  const linkSnap = await getDoc(doc(db, MAGIC_LINKS, token));
  if (!linkSnap.exists()) return { error: 'not_found' };

  const link = linkSnap.data();
  if (link.isRevoked) return { error: 'revoked' };
  if (new Date(link.expiresAt) < new Date()) return { error: 'expired' };

  const formSnap = await getDoc(doc(db, SHARED_FORMS, link.formId));
  if (!formSnap.exists()) return { error: 'not_found' };

  const formData = formSnap.data();
  const form = JSON.parse(formData.formJson);
  const pluginIds = formData.pluginIds || [];
  return { form, expiresAt: link.expiresAt, token, formId: link.formId, pluginIds, encrypted: !!formData.encrypted };
}

// ============================================================
// LISTEN TO SHARED FORM IN REAL-TIME (respondent side)
// ============================================================

export function listenToSharedForm(formId, callback) {
  return onSnapshot(doc(db, SHARED_FORMS, formId), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    const form = JSON.parse(data.formJson);
    callback(form);
  });
}

// ============================================================
// SUBMIT RESPONSE (respondent side)
// ============================================================

export async function submitSharedResponse(token, answers, formKey) {
  const linkSnap = await getDoc(doc(db, MAGIC_LINKS, token));
  if (!linkSnap.exists()) throw new Error('Link not found');

  const link = linkSnap.data();
  if (link.isRevoked || new Date(link.expiresAt) < new Date()) {
    throw new Error('Link expired');
  }

  const answersStr = JSON.stringify(answers);
  let storedAnswers;
  let encrypted = false;

  if (formKey) {
    storedAnswers = await encryptData(answersStr, formKey);
    encrypted = true;
  } else {
    storedAnswers = answersStr;
  }

  const responseId = nanoid(16);
  await setDoc(doc(db, SHARED_RESPONSES, responseId), {
    formId: link.formId,
    answersJson: storedAnswers,
    encrypted,
    submittedAt: new Date().toISOString(),
  });

  return { id: responseId };
}

// ============================================================
// GET REMOTE RESPONSES (authenticated collaborator)
// ============================================================

export async function getRemoteResponses(formId, formKey) {
  const q = query(
    collection(db, SHARED_RESPONSES),
    where('formId', '==', formId),
    orderBy('submittedAt', 'desc')
  );
  const snap = await getDocs(q);
  const results = [];
  for (const d of snap.docs) {
    const data = d.data();
    let answers;
    if (data.encrypted && formKey) {
      try {
        const decrypted = await decryptData(data.answersJson, formKey);
        answers = JSON.parse(decrypted);
      } catch {
        answers = { _encrypted: true, _error: 'Decryption failed' };
      }
    } else if (data.encrypted && !formKey) {
      answers = { _encrypted: true, _error: 'No decryption key' };
    } else {
      answers = JSON.parse(data.answersJson);
    }
    results.push({
      id: d.id,
      formId: data.formId,
      answers,
      encrypted: !!data.encrypted,
      submittedAt: data.submittedAt,
      source: 'remote',
    });
  }
  return results;
}

// ============================================================
// REGENERATE MAGIC LINK
// ============================================================

export async function regenerateLink(formId, actor) {
  // Revoke old links
  const q = query(collection(db, MAGIC_LINKS), where('formId', '==', formId));
  const existing = await getDocs(q);
  for (const linkDoc of existing.docs) {
    await updateDoc(linkDoc.ref, { isRevoked: true });
  }

  const token = nanoid(16);
  const expires = expiresAtFromDays(await getExpiryDays());
  await setDoc(doc(db, MAGIC_LINKS, token), {
    formId,
    expiresAt: expires,
    createdAt: new Date().toISOString(),
    isRevoked: false,
  });

  await addAuditLog(formId, actor, 'regenerated_link', { token });
  return { token, expiresAt: expires };
}

// ============================================================
// REFRESH LINK EXPIRY (extend without regenerating)
// ============================================================

export async function refreshLinkExpiry(formId, days) {
  const expiryDays = days || await getExpiryDays();
  const q = query(collection(db, MAGIC_LINKS), where('formId', '==', formId));
  const snap = await getDocs(q);

  let refreshed = null;
  for (const linkDoc of snap.docs) {
    const data = linkDoc.data();
    if (!data.isRevoked) {
      const newExpiry = expiresAtFromDays(expiryDays);
      await updateDoc(linkDoc.ref, { expiresAt: newExpiry });
      refreshed = { token: linkDoc.id, expiresAt: newExpiry };
    }
  }

  if (!refreshed) throw new Error('No active link found to refresh');
  await addAuditLog(formId, 'system', 'refreshed_link_expiry', { days: expiryDays });
  return refreshed;
}

// ============================================================
// RE-SYNC FORM JSON
// ============================================================

export async function resyncSharedForm(formId, form) {
  await updateDoc(doc(db, SHARED_FORMS, formId), {
    formJson: JSON.stringify(form),
    updatedAt: new Date().toISOString(),
  });
}

// ============================================================
// LINK STATUS
// ============================================================

export async function getLinkStatus(formId) {
  const q = query(collection(db, MAGIC_LINKS), where('formId', '==', formId));
  const snap = await getDocs(q);

  for (const linkDoc of snap.docs) {
    const data = linkDoc.data();
    if (!data.isRevoked && new Date(data.expiresAt) > new Date()) {
      return { token: linkDoc.id, expiresAt: data.expiresAt, active: true };
    }
  }
  return { active: false };
}

// ============================================================
// CHANGE PASSPHRASE (for a collaborator — owner can change master)
// ============================================================

export async function changePassphrase(collaboratorId, newPassphrase, actor) {
  const ref = doc(db, COLLABORATORS, collaboratorId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Collaborator not found');

  const { salt, hash } = await hashPassphrase(newPassphrase);
  await updateDoc(ref, { salt, hash });

  const data = snap.data();
  await addAuditLog(data.formId, actor, 'changed_passphrase');
}

// ============================================================
// GET SHARED FORM METADATA (for manage dashboard)
// ============================================================

export async function getSharedFormData(formId, passphrase) {
  const formSnap = await getDoc(doc(db, SHARED_FORMS, formId));
  if (!formSnap.exists()) return null;

  const formData = formSnap.data();
  const form = JSON.parse(formData.formJson);

  // Attempt to unwrap the form key for decrypting responses
  let formKey = null;
  if (formData.encrypted && formData.wrappedKey && formData.keySalt && passphrase) {
    try {
      formKey = await unwrapFormKey(formData.wrappedKey, formData.keySalt, passphrase);
    } catch {
      // Wrong passphrase or corrupt key — responses will show as encrypted
    }
  }

  const responses = await getRemoteResponses(formId, formKey);
  const linkStatus = await getLinkStatus(formId);
  const collaborators = await getCollaborators(formId);
  const auditLogs = await getAuditLogs(formId);

  return { form, formId, responses, linkStatus, collaborators, auditLogs, encrypted: !!formData.encrypted };
}
