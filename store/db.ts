import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Student, Carnet } from '../data/schema.js';

export interface CarnetDB extends DBSchema {
  students: {
    key: string;
    value: Student;
    indexes: { nom: string; prenom: string };
  };
  carnets: {
    key: string;
    value: {
      id: string;
      data: Carnet;
      updatedAt: number;
    };
    indexes: { studentId: string };
  };
  photos: {
    key: string;
    value: {
      id: string;
      dataURL: string;
      createdAt: number;
      caption?: string;
    };
    indexes: { studentId: string; skillId: string };
  };
  temp_photos: {
    key: string;
    value: {
      id: string;
      studentId: string;
      imageData: string;
      timestamp: number;
      description?: string;
    };
    indexes: { studentId: string; timestamp: number };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
}

// Configuration de la base de données
const DB_CONFIG = {
  name: 'carnet-suivi-gs',
  version: 3 // Dernière version avec le store temp_photos
};

let dbInstance: IDBPDatabase<CarnetDB> | null = null;
export async function initDB(): Promise<IDBPDatabase<CarnetDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await openDB<CarnetDB>(DB_CONFIG.name, DB_CONFIG.version, {
    upgrade(db, oldVersion) {
      // Version 1: Structure initiale
      if (oldVersion < 1) {
        // Store pour les carnets
        const carnetsStore = db.createObjectStore('carnets', { keyPath: 'id' });
        carnetsStore.createIndex('studentId', 'data.studentId');
        
        // Store pour les photos
        const photosStore = db.createObjectStore('photos', { keyPath: 'id' });
        photosStore.createIndex('studentId', 'studentId');
        photosStore.createIndex('skillId', 'skillId');
        
        // Store pour les paramètres
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      
      // Version 2: Ajout du store students
      if (oldVersion < 2) {
        const studentsStore = db.createObjectStore('students', { keyPath: 'id' });
        studentsStore.createIndex('nom', 'nom');
        studentsStore.createIndex('prenom', 'prenom');
      }

      // Version 3: Ajout du store pour les photos temporaires
      if (oldVersion < 3) {
        const tempPhotosStore = db.createObjectStore('temp_photos', { keyPath: 'id' });
        tempPhotosStore.createIndex('studentId', 'studentId');
        tempPhotosStore.createIndex('timestamp', 'timestamp');
      }
    },
  });

  dbInstance = db;
  return db;
}

export async function getDB(): Promise<IDBPDatabase<CarnetDB>> {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['students', 'carnets', 'photos', 'settings'], 'readwrite');
  
  await Promise.all([
    tx.objectStore('students').clear(),
    tx.objectStore('carnets').clear(),
    tx.objectStore('photos').clear(),
    tx.objectStore('settings').clear(),
  ]);
  
  await tx.done;
}
