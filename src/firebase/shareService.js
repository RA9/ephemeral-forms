// Firestore service for magic link sharing
import { db } from './config.js';
import {
  collection, doc, getDoc, setDoc, updateDoc, addDoc,
  query, where, getDocs, orderBy, Timestamp, deleteDoc
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

const SHARED_FORMS = 'shared_forms';
const MAGIC_LINKS = 'magic_links';
const SHARED_RESPONSES = 'shared_responses';

const TTL_DAYS = 3;

function expiresAt() {
  const d = new Date();
  d.setDate(d.getDate() + TTL_DAYS);
  return d.toISOString();
}

// ============================================================
// Share a form — creates shared_form + magic_link, returns metadata
// ============================================================

export async function shareForm(form) {
  const token = nanoid(16);
  const creatorSecret = nanoid(24);
  const now = new Date().toISOString();
  const expires = expiresAt();

  // Store the full form
  await setDoc(doc(db, SHARED_FORMS, form.id), {
    formJson: JSON.stringify(form),
    creatorSecret,
    createdAt: now,
    updatedAt: now,
  });

  // Create magic link
  await setDoc(doc(db, MAGIC_LINKS, token), {
    formId: form.id,
    expiresAt: expires,
    createdAt: now,
    isRevoked: false,
  });

  return { token, expiresAt: expires, creatorSecret };
}

// ============================================================
// Get form by magic link token (respondent side)
// ============================================================

export async function getSharedForm(token) {
  const linkSnap = await getDoc(doc(db, MAGIC_LINKS, token));
  if (!linkSnap.exists()) return { error: 'not_found' };

  const link = linkSnap.data();
  if (link.isRevoked) return { error: 'revoked' };
  if (new Date(link.expiresAt) < new Date()) return { error: 'expired' };

  const formSnap = await getDoc(doc(db, SHARED_FORMS, link.formId));
  if (!formSnap.exists()) return { error: 'not_found' };

  const form = JSON.parse(formSnap.data().formJson);
  return { form, expiresAt: link.expiresAt, token };
}

// ============================================================
// Submit a response to a shared form (respondent side)
// ============================================================

export async function submitSharedResponse(token, answers) {
  // Validate link is still active
  const linkSnap = await getDoc(doc(db, MAGIC_LINKS, token));
  if (!linkSnap.exists()) throw new Error('Link not found');

  const link = linkSnap.data();
  if (link.isRevoked || new Date(link.expiresAt) < new Date()) {
    throw new Error('Link expired');
  }

  const responseId = nanoid(16);
  await setDoc(doc(db, SHARED_RESPONSES, responseId), {
    formId: link.formId,
    answersJson: JSON.stringify(answers),
    submittedAt: new Date().toISOString(),
  });

  return { id: responseId };
}

// ============================================================
// Get remote responses (creator side — requires creatorSecret)
// ============================================================

export async function getRemoteResponses(formId, creatorSecret) {
  // Verify ownership
  const formSnap = await getDoc(doc(db, SHARED_FORMS, formId));
  if (!formSnap.exists()) return [];
  if (formSnap.data().creatorSecret !== creatorSecret) {
    throw new Error('Unauthorized');
  }

  const q = query(
    collection(db, SHARED_RESPONSES),
    where('formId', '==', formId),
    orderBy('submittedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      formId: data.formId,
      answers: JSON.parse(data.answersJson),
      submittedAt: data.submittedAt,
      source: 'remote',
    };
  });
}

// ============================================================
// Regenerate magic link (creator side — revokes old, creates new)
// ============================================================

export async function regenerateLink(formId, creatorSecret) {
  // Verify ownership
  const formSnap = await getDoc(doc(db, SHARED_FORMS, formId));
  if (!formSnap.exists()) throw new Error('Form not found');
  if (formSnap.data().creatorSecret !== creatorSecret) {
    throw new Error('Unauthorized');
  }

  // Revoke existing links
  const q = query(
    collection(db, MAGIC_LINKS),
    where('formId', '==', formId)
  );
  const existingLinks = await getDocs(q);
  for (const linkDoc of existingLinks.docs) {
    await updateDoc(linkDoc.ref, { isRevoked: true });
  }

  // Also update the form JSON in case creator edited it
  const currentForm = await getDoc(doc(db, SHARED_FORMS, formId));

  // Create new link
  const token = nanoid(16);
  const expires = expiresAt();
  await setDoc(doc(db, MAGIC_LINKS, token), {
    formId,
    expiresAt: expires,
    createdAt: new Date().toISOString(),
    isRevoked: false,
  });

  return { token, expiresAt: expires };
}

// ============================================================
// Re-sync form JSON after edits (creator side)
// ============================================================

export async function resyncSharedForm(formId, creatorSecret, form) {
  const formSnap = await getDoc(doc(db, SHARED_FORMS, formId));
  if (!formSnap.exists()) throw new Error('Form not found');
  if (formSnap.data().creatorSecret !== creatorSecret) {
    throw new Error('Unauthorized');
  }

  await updateDoc(doc(db, SHARED_FORMS, formId), {
    formJson: JSON.stringify(form),
    updatedAt: new Date().toISOString(),
  });
}

// ============================================================
// Get link status (creator side)
// ============================================================

export async function getLinkStatus(formId, creatorSecret) {
  const formSnap = await getDoc(doc(db, SHARED_FORMS, formId));
  if (!formSnap.exists()) return null;
  if (formSnap.data().creatorSecret !== creatorSecret) return null;

  const q = query(
    collection(db, MAGIC_LINKS),
    where('formId', '==', formId)
  );
  const snap = await getDocs(q);

  for (const linkDoc of snap.docs) {
    const data = linkDoc.data();
    if (!data.isRevoked && new Date(data.expiresAt) > new Date()) {
      return {
        token: linkDoc.id,
        expiresAt: data.expiresAt,
        active: true,
      };
    }
  }

  return { active: false };
}
