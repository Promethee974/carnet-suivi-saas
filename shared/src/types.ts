// Types partagés entre frontend et backend

export type ID = string;

// ============================================
// UTILISATEURS & AUTH
// ============================================

export enum UserRole {
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  SCHOOL = 'SCHOOL',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  TRIALING = 'TRIALING',
}

export interface User {
  id: ID;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// ÉLÈVES & CARNETS
// ============================================

export enum Sex {
  F = 'F',
  M = 'M',
  AUTRE = 'AUTRE',
  ND = 'ND',
}

export type SkillStatus = '' | 'NA' | 'EC' | 'A';

export interface Student {
  id: ID;
  userId: ID;
  organizationId?: ID;
  nom: string;
  prenom: string;
  sexe?: Sex;
  naissance?: string; // ISO date string
  photoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Photo {
  id: ID;
  studentId: ID;
  userId: ID;
  skillId?: string;
  s3Key: string;
  s3Url: string;
  caption?: string;
  mimeType?: string;
  size?: number;
  createdAt: Date;
}

export interface TempPhoto {
  id: ID;
  studentId: ID;
  userId: ID;
  s3Key: string;
  s3Url: string;
  description?: string;
  createdAt: Date;
}

export interface SkillEntry {
  id: string;
  status: SkillStatus;
  comment: string;
  photos: Photo[];
  evaluatedAt?: number;
  period?: string;
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
  id: ID;
  studentId: ID;
  userId: ID;
  meta: Meta;
  skills: Record<string, SkillEntry>;
  synthese: Synthese;
  progress?: Record<string, { acquired: number; total: number }>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DOMAINES & COMPÉTENCES
// ============================================

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

// ============================================
// ACTIVITÉ
// ============================================

export enum ActivityType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  BACKUP = 'BACKUP',
  RESTORE = 'RESTORE',
}

export interface ActivityLog {
  id: ID;
  userId: ID;
  type: ActivityType;
  entity: string;
  entityId?: string;
  description?: string;
  details?: any;
  createdAt: Date;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// AUTH DTOs
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: string;
}
