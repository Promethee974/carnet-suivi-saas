import { ID } from '../data/schema.js';

// Types d'événements personnalisés
export interface CarnetEvents {
  'skill-updated': {
    studentId: ID;
    skillId: string;
    domainId: string;
    status: string;
  };
  'carnet-updated': {
    studentId: ID;
  };
  'student-updated': {
    studentId: ID;
  };
}

// Gestionnaire d'événements centralisé
class EventManager extends EventTarget {
  // Émettre un événement typé
  emit<K extends keyof CarnetEvents>(type: K, detail: CarnetEvents[K]) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  // Écouter un événement typé
  on<K extends keyof CarnetEvents>(
    type: K, 
    listener: (event: CustomEvent<CarnetEvents[K]>) => void
  ) {
    this.addEventListener(type, listener as EventListener);
  }

  // Supprimer un écouteur
  off<K extends keyof CarnetEvents>(
    type: K, 
    listener: (event: CustomEvent<CarnetEvents[K]>) => void
  ) {
    this.removeEventListener(type, listener as EventListener);
  }
}

// Instance globale du gestionnaire d'événements
export const eventManager = new EventManager();

// Fonctions utilitaires pour émettre des événements communs
export function emitSkillUpdate(studentId: ID, skillId: string, domainId: string, status: string) {
  eventManager.emit('skill-updated', { studentId, skillId, domainId, status });
}

export function emitCarnetUpdate(studentId: ID) {
  eventManager.emit('carnet-updated', { studentId });
}

export function emitStudentUpdate(studentId: ID) {
  eventManager.emit('student-updated', { studentId });
}
