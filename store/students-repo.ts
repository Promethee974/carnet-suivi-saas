import { getDB } from './db.js';
import { Student, ID, Sex } from '../data/schema.js';

// Génération d'ID unique
export function generateStudentId(): ID {
  return `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// CRUD Élèves
export async function getAllStudents(): Promise<Student[]> {
  const db = await getDB();
  return await db.getAll('students');
}

export async function getStudent(id: ID): Promise<Student | null> {
  const db = await getDB();
  const student = await db.get('students', id);
  return student || null;
}

export async function createStudent(data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> {
  const now = Date.now();
  const student: Student = {
    id: generateStudentId(),
    ...data,
    createdAt: now,
    updatedAt: now
  };
  
  const db = await getDB();
  await db.put('students', student);
  return student;
}

export async function updateStudent(id: ID, updates: Partial<Omit<Student, 'id' | 'createdAt'>>): Promise<Student | null> {
  const db = await getDB();
  const existing = await db.get('students', id);
  if (!existing) return null;

  const updated: Student = {
    ...existing,
    ...updates,
    updatedAt: Date.now()
  };

  await db.put('students', updated);
  return updated;
}

export async function deleteStudent(id: ID): Promise<boolean> {
  const db = await getDB();
  const tx = db.transaction(['students', 'carnets'], 'readwrite');
  
  // Supprimer l'élève
  await tx.objectStore('students').delete(id);
  
  // Supprimer tous les carnets associés
  const carnetsIndex = tx.objectStore('carnets').index('studentId');
  const carnets = await carnetsIndex.getAll(id);
  
  for (const carnet of carnets) {
    await tx.objectStore('carnets').delete(carnet.id);
  }
  
  await tx.done;
  return true;
}

// Import CSV français
export function parseCSVDate(dateStr: string): string | undefined {
  if (!dateStr || dateStr.trim() === '') return undefined;
  
  // Format attendu: DD/MM/YYYY
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return undefined;
  
  const [day, month, year] = parts;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  if (isNaN(date.getTime())) return undefined;
  
  // Retourner au format ISO YYYY-MM-DD
  return date.toISOString().split('T')[0];
}

export function parseSex(sexStr: string): Sex {
  const normalized = sexStr.trim().toUpperCase();
  switch (normalized) {
    case 'F':
    case 'FÉMININ':
    case 'FEMININ':
    case 'FILLE':
      return 'F';
    case 'M':
    case 'MASCULIN':
    case 'GARÇON':
    case 'GARCON':
      return 'M';
    case 'AUTRE':
      return 'Autre';
    default:
      return 'ND';
  }
}

export async function importStudentsFromCSV(csvContent: string): Promise<{ imported: number; errors: string[] }> {
  const lines = csvContent.trim().split('\n');
  const errors: string[] = [];
  let imported = 0;

  // Ignorer la première ligne (headers)
  for (let i = 1; i < lines.length; i++) {
    try {
      const line = lines[i].trim();
      if (!line) continue;

      // Séparer par point-virgule (CSV français)
      const columns = line.split(';').map(col => col.trim().replace(/^"|"$/g, ''));
      
      if (columns.length < 5) {
        errors.push(`Ligne ${i + 1}: Format invalide (${columns.length} colonnes au lieu de 5)`);
        continue;
      }

      const [, nom, prenom, sexe, naissance] = columns;
      
      if (!nom || !prenom) {
        errors.push(`Ligne ${i + 1}: Nom ou prénom manquant`);
        continue;
      }

      await createStudent({
        nom: nom.trim(),
        prenom: prenom.trim(),
        sexe: parseSex(sexe),
        naissance: parseCSVDate(naissance)
      });

      imported++;
    } catch (error) {
      errors.push(`Ligne ${i + 1}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  return { imported, errors };
}

// Recherche et tri
export async function searchStudents(query: string): Promise<Student[]> {
  const students = await getAllStudents();
  
  if (!query.trim()) return students;
  
  const searchTerm = query.toLowerCase();
  return students.filter(student => 
    student.nom.toLowerCase().includes(searchTerm) ||
    student.prenom.toLowerCase().includes(searchTerm) ||
    `${student.prenom} ${student.nom}`.toLowerCase().includes(searchTerm)
  );
}

export function sortStudents(students: Student[], sortBy: 'nom' | 'prenom' | 'createdAt' = 'nom'): Student[] {
  return [...students].sort((a, b) => {
    switch (sortBy) {
      case 'nom':
        return a.nom.localeCompare(b.nom);
      case 'prenom':
        return a.prenom.localeCompare(b.prenom);
      case 'createdAt':
        return b.createdAt - a.createdAt; // Plus récent en premier
      default:
        return 0;
    }
  });
}
