// IndexedDB setup using idb library
import { openDB } from 'idb';

const DB_NAME = 'ephemeral-forms';
const DB_VERSION = 2;

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Forms store
        if (!db.objectStoreNames.contains('forms')) {
          const formStore = db.createObjectStore('forms', { keyPath: 'id' });
          formStore.createIndex('createdAt', 'createdAt');
          formStore.createIndex('updatedAt', 'updatedAt');
        }

        // Responses store
        if (!db.objectStoreNames.contains('responses')) {
          const responseStore = db.createObjectStore('responses', { keyPath: 'id' });
          responseStore.createIndex('formId', 'formId');
          responseStore.createIndex('submittedAt', 'submittedAt');
        }

        // Plugins store
        if (!db.objectStoreNames.contains('plugins')) {
          db.createObjectStore('plugins', { keyPath: 'id' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Share metadata store (v2)
        if (!db.objectStoreNames.contains('share_meta')) {
          db.createObjectStore('share_meta', { keyPath: 'formId' });
        }
      },
    });
  }
  return dbPromise;
}
