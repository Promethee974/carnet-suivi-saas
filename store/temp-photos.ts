import { getDB } from './db.js';
import { ID } from '../data/schema.js';

export interface TemporaryPhoto {
  id?: string;
  studentId: ID;
  imageData: string; // Base64
  timestamp: number;
  description?: string;
}

// Sauvegarder une photo temporaire
export async function saveTemporaryPhoto(photo: TemporaryPhoto): Promise<string> {
  const db = await getDB();
  const id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const photoWithId = {
    ...photo,
    id
  };

  await db.put('temp_photos', photoWithId);
  return id;
}

// Récupérer toutes les photos temporaires
export async function getTemporaryPhotos(): Promise<TemporaryPhoto[]> {
  const db = await getDB();
  const photos = await db.getAll('temp_photos');
  return photos.sort((a, b) => b.timestamp - a.timestamp);
}

// Récupérer les photos temporaires d'un élève
export async function getTemporaryPhotosByStudent(studentId: ID): Promise<TemporaryPhoto[]> {
  const photos = await getTemporaryPhotos();
  return photos.filter(photo => photo.studentId === studentId);
}

// Récupérer une photo temporaire par ID
export async function getTemporaryPhoto(photoId: string): Promise<TemporaryPhoto | null> {
  const db = await getDB();
  const photo = await db.get('temp_photos', photoId);
  return photo || null;
}

// Supprimer une photo temporaire
export async function deleteTemporaryPhoto(photoId: string): Promise<void> {
  const db = await getDB();
  await db.delete('temp_photos', photoId);
}

// Déplacer une photo temporaire vers les photos définitives
export async function moveTemporaryPhotoToSkill(
  tempPhotoId: string, 
  studentId: ID, 
  skillId: string,
  description?: string
): Promise<void> {
  const tempPhoto = await getTemporaryPhoto(tempPhotoId);
  if (!tempPhoto) {
    throw new Error('Photo temporaire introuvable');
  }

  // Importer les fonctions nécessaires
  const { addPhotoToSkill } = await import('./repo.js');
  
  // Créer la photo définitive
  const caption = (description ?? tempPhoto.description ?? '').trim();

  const photo = {
    id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    dataURL: tempPhoto.imageData,
    createdAt: tempPhoto.timestamp,
    caption: caption || undefined
  };

  // Ajouter à la compétence
  await addPhotoToSkill(studentId, skillId, photo);
  
  // Supprimer la photo temporaire
  await deleteTemporaryPhoto(tempPhotoId);
  
  // Déclencher un événement pour mettre à jour le compteur
  document.dispatchEvent(new CustomEvent('temp-photos-updated'));
}
