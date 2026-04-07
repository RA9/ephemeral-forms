// IndexedDB setup using idb library
import { openDB } from 'idb';

const DB_NAME = 'ephemeral-forms';
const DB_VERSION = 3;

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('forms')) {
          const formStore = db.createObjectStore('forms', { keyPath: 'id' });
          formStore.createIndex('createdAt', 'createdAt');
          formStore.createIndex('updatedAt', 'updatedAt');
        }

        if (!db.objectStoreNames.contains('responses')) {
          const responseStore = db.createObjectStore('responses', { keyPath: 'id' });
          responseStore.createIndex('formId', 'formId');
          responseStore.createIndex('submittedAt', 'submittedAt');
        }

        if (!db.objectStoreNames.contains('plugins')) {
          db.createObjectStore('plugins', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('share_meta')) {
          db.createObjectStore('share_meta', { keyPath: 'formId' });
        }

        if (!db.objectStoreNames.contains('creator_meta')) {
          db.createObjectStore('creator_meta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}
