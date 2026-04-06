import { getDB } from './db.js';
import { v4 as uuidv4 } from 'uuid';

export async function createForm(formData = {}) {
  const db = await getDB();
  const now = new Date().toISOString();
  const form = {
    id: uuidv4(),
    title: formData.title || 'Untitled Form',
    description: formData.description || '',
    questions: formData.questions || [],
    settings: {
      themeColor: '#6c5ce7',
      confirmationMessage: 'Your response has been recorded.',
      collectEmail: false,
      shuffleQuestions: false,
      limitOneResponse: false,
      ...(formData.settings || {}),
    },
    createdAt: now,
    updatedAt: now,
  };
  await db.put('forms', form);
  return form;
}

export async function getForm(id) {
  const db = await getDB();
  return db.get('forms', id);
}

export async function updateForm(id, updates) {
  const db = await getDB();
  const form = await db.get('forms', id);
  if (!form) throw new Error(`Form ${id} not found`);
  const updated = {
    ...form,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await db.put('forms', updated);
  return updated;
}

export async function deleteForm(id) {
  const db = await getDB();
  // Delete all responses for this form
  const tx = db.transaction(['forms', 'responses'], 'readwrite');
  const responseIndex = tx.objectStore('responses').index('formId');
  let cursor = await responseIndex.openCursor(id);
  while (cursor) {
    cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.objectStore('forms').delete(id);
  await tx.done;
}

export async function listForms() {
  const db = await getDB();
  const forms = await db.getAllFromIndex('forms', 'createdAt');
  return forms.reverse(); // newest first
}

export async function duplicateForm(id) {
  const db = await getDB();
  const form = await db.get('forms', id);
  if (!form) throw new Error(`Form ${id} not found`);
  const now = new Date().toISOString();
  const newForm = {
    ...form,
    id: uuidv4(),
    title: `${form.title} (Copy)`,
    createdAt: now,
    updatedAt: now,
  };
  await db.put('forms', newForm);
  return newForm;
}
