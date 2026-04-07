import { getDB } from './db.js';
import { v4 as uuidv4 } from 'uuid';

export async function addResponse(formId, answers) {
  const db = await getDB();
  const response = {
    id: uuidv4(),
    formId,
    answers, // { questionId: value }
    submittedAt: new Date().toISOString(),
  };
  await db.put('responses', response);
  return response;
}

export async function getResponses(formId) {
  const db = await getDB();
  const index = db.transaction('responses').store.index('formId');
  const responses = await index.getAll(formId);
  return responses.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

export async function getResponseCount(formId) {
  const db = await getDB();
  const index = db.transaction('responses').store.index('formId');
  return index.count(formId);
}

export async function deleteResponse(id) {
  const db = await getDB();
  await db.delete('responses', id);
}

export async function deleteAllResponses(formId) {
  const db = await getDB();
  const tx = db.transaction('responses', 'readwrite');
  const index = tx.store.index('formId');
  let cursor = await index.openCursor(formId);
  while (cursor) {
    cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function getResponseStats(formId) {
  const responses = await getResponses(formId);
  const total = responses.length;

  const now = new Date();
  const dailyCounts = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toDateString();
    return responses.filter(r => new Date(r.submittedAt).toDateString() === ds).length;
  });

  if (total === 0) return { total: 0, latest: null, today: 0, dailyCounts };

  const today = now.toDateString();
  const todayCount = responses.filter(r =>
    new Date(r.submittedAt).toDateString() === today
  ).length;

  return {
    total,
    latest: responses[0].submittedAt,
    today: todayCount,
    dailyCounts,
  };
}
