export type ID = string;
export type Sex = 'F' | 'M' | 'Autre' | 'ND';
export type SkillStatus = '' | 'NA' | 'EC' | 'A';

export interface Student {
  id: ID;
  nom: string;
  prenom: string;
  sexe?: Sex;
  naissance?: string; // ISO 'YYYY-MM-DD'
  birthDate?: string; // Alias pour naissance pour compatibilité
  photo?: string;     // URL de la photo
  avatar?: string;    // dataURL (pour compatibilité)
  createdAt: number;
  updatedAt: number;
}

export interface Photo {
  id: string;
  dataURL: string;
  createdAt: number;
  caption?: string;
}

export interface SkillEntry {
  id: string;
  status: SkillStatus;
  comment: string;
  photos: Photo[];
  evaluatedAt?: number; // Timestamp de l'évaluation
  period?: string; // Période d'évaluation ('1', '2', '3', '4', '5')
}

export interface Meta {
  eleve: string;
  annee: string;
  enseignant: string;
  periode: '1' | '2' | '3' | '4' | '5';
  avatar?: string;
}

export interface Synthese {
  forces: string;
  axes: string;
  projets: string;
}

export interface Carnet {
  studentId: ID;
  meta: Meta;
  skills: Record<string, SkillEntry>;
  synthese: Synthese;
  // Cache calculé pour les performances
  progress?: Record<string, { acquired: number; total: number }>;
}

// Import CSV
export interface CSVRow {
  "Unnamed: 0": string;
  "NOM": string;
  "Prénom": string;
  "Sexe": string;
  "Date de naissance": string;
}

export interface Domain {
  id: string;
  name: string;
  color: string;
  skills: Skill[];
}

export interface Skill {
  id: string;
  text: string;
  domainId: string;
}

export interface ProgressStats {
  total: number;
  acquired: number;
  inProgress: number;
  notAcquired: number;
  percentage: number;
}

export interface ExportData {
  version: string;
  carnet: Carnet;
  photos: Record<string, string>; // photoId -> base64
  exportedAt: number;
}
