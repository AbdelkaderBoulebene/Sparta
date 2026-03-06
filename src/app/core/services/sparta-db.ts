import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'sparta-db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getSpartaDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const workoutStore = db.createObjectStore('workouts', {
            keyPath: 'id',
            autoIncrement: true,
          });
          workoutStore.createIndex('date', 'date');
          workoutStore.createIndex('createdAt', 'createdAt');
        }
        if (oldVersion < 2) {
          db.createObjectStore('templates', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      },
    });
  }
  return dbPromise;
}
