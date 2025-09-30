import { getDB } from './db.js';
import { Carnet, Meta, SkillEntry, Photo, ExportData, ID, Student } from '../data/schema.js';
import { getAllSkills } from '../data/skills.js';

// Génération d'ID pour les carnets
function generateCarnetId(studentId: ID): string {
  return `carnet_${studentId}`;
}

// Carnet operations
export async function getCarnet(studentId: ID): Promise<Carnet | null> {
  const db = await getDB();
  const carnetId = generateCarnetId(studentId);
  const result = await db.get('carnets', carnetId);
  return result?.data || null;
}

export async function saveCarnet(carnet: Carnet): Promise<void> {
  const db = await getDB();
  const carnetId = generateCarnetId(carnet.studentId);
  await db.put('carnets', {
    id: carnetId,
    data: carnet,
    updatedAt: Date.now()
  });
}

export async function initializeCarnet(studentId: ID, student?: Student): Promise<Carnet> {
  const existingCarnet = await getCarnet(studentId);
  if (existingCarnet) {
    // Migrer les anciennes données si nécessaire
    return await migrateCarnetIfNeeded(existingCarnet);
  }

  // Créer un nouveau carnet avec toutes les compétences initialisées
  const includeTransversal = await getSetting('includeTransversal') ?? false;
  const skills: Record<string, SkillEntry> = {};
  
  getAllSkills(includeTransversal).forEach(skill => {
    skills[skill.id] = {
      id: skill.id,
      status: '',
      comment: '',
      photos: []
    };
  });

  const newCarnet: Carnet = {
    studentId,
    meta: {
      eleve: student ? `${student.prenom} ${student.nom}` : '',
      annee: new Date().getFullYear().toString(),
      enseignant: '',
      periode: '1',
      avatar: student?.avatar
    },
    skills,
    synthese: {
      forces: '',
      axes: '',
      projets: ''
    }
  };

  await saveCarnet(newCarnet);
  return newCarnet;
}

// Migration des données pour les nouveaux programmes 2025
async function migrateCarnetIfNeeded(carnet: Carnet): Promise<Carnet> {
  const includeTransversal = await getSetting('includeTransversal') ?? false;
  const currentSkills = getAllSkills(includeTransversal);
  let needsMigration = false;

  // Vérifier si des compétences manquent
  const existingSkillIds = Object.keys(carnet.skills);
  const requiredSkillIds = currentSkills.map(s => s.id);
  
  for (const skillId of requiredSkillIds) {
    if (!carnet.skills[skillId]) {
      carnet.skills[skillId] = {
        id: skillId,
        status: '',
        comment: '',
        photos: []
      };
      needsMigration = true;
    }
  }

  // Supprimer les anciennes compétences qui n'existent plus
  for (const skillId of existingSkillIds) {
    if (!requiredSkillIds.includes(skillId)) {
      delete carnet.skills[skillId];
      needsMigration = true;
    }
  }

  if (needsMigration) {
    await saveCarnet(carnet);
  }

  return carnet;
}

// Activer/désactiver le domaine transversal pour un élève
export async function toggleTransversalDomain(studentId: ID, enabled: boolean): Promise<void> {
  await setSetting('includeTransversal', enabled);
  
  const carnet = await getCarnet(studentId);
  if (!carnet) return;

  if (enabled) {
    // Ajouter les compétences transversales
    getAllSkills(true).forEach(skill => {
      if (skill.domainId === 'transversal' && !carnet.skills[skill.id]) {
        carnet.skills[skill.id] = {
          id: skill.id,
          status: '',
          comment: '',
          photos: []
        };
      }
    });
  } else {
    // Supprimer les compétences transversales
    Object.keys(carnet.skills).forEach(skillId => {
      if (skillId.startsWith('trans')) {
        delete carnet.skills[skillId];
      }
    });
  }

  await saveCarnet(carnet);
}

// Meta operations
export async function updateMeta(studentId: ID, meta: Partial<Meta>): Promise<void> {
  const carnet = await getCarnet(studentId);
  if (!carnet) return;

  carnet.meta = { ...carnet.meta, ...meta };
  await saveCarnet(carnet);
}

// Skill operations
export async function updateSkill(studentId: ID, skillId: string, updates: Partial<SkillEntry>): Promise<void> {
  const carnet = await getCarnet(studentId);
  if (!carnet || !carnet.skills[skillId]) return;

  // Si le statut change et n'est pas vide, ajouter l'horodatage et la période
  if (updates.status !== undefined && updates.status !== '') {
    updates.evaluatedAt = Date.now();
    updates.period = carnet.meta.periode;
  }
  // Si le statut devient vide, supprimer l'horodatage et la période
  else if (updates.status === '') {
    updates.evaluatedAt = undefined;
    updates.period = undefined;
  }

  carnet.skills[skillId] = { ...carnet.skills[skillId], ...updates };
  await saveCarnet(carnet);
}

// Photo operations
export async function savePhoto(photo: Photo): Promise<void> {
  const db = await getDB();
  await db.put('photos', photo);
}

export async function getPhoto(photoId: string): Promise<Photo | null> {
  const db = await getDB();
  const photo = await db.get('photos', photoId);
  return photo || null;
}

export async function deletePhoto(photoId: string): Promise<void> {
  const db = await getDB();
  await db.delete('photos', photoId);
}

export async function addPhotoToSkill(studentId: ID, skillId: string, photo: Photo): Promise<void> {
  await savePhoto(photo);
  
  const carnet = await getCarnet(studentId);
  if (!carnet || !carnet.skills[skillId]) return;

  carnet.skills[skillId].photos.push(photo);
  await saveCarnet(carnet);
}

export async function removePhotoFromSkill(studentId: ID, skillId: string, photoId: string): Promise<void> {
  const carnet = await getCarnet(studentId);
  if (!carnet || !carnet.skills[skillId]) return;

  carnet.skills[skillId].photos = carnet.skills[skillId].photos.filter(p => p.id !== photoId);
  await saveCarnet(carnet);
  await deletePhoto(photoId);
}

// Settings operations
export async function getSetting(key: string): Promise<any> {
  const db = await getDB();
  const result = await db.get('settings', key);
  return result?.value;
}

export async function setSetting(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}

// Export/Import operations pour un élève
export async function exportStudentData(studentId: ID): Promise<ExportData> {
  const carnet = await getCarnet(studentId);
  if (!carnet) {
    throw new Error('Aucun carnet à exporter pour cet élève');
  }

  const db = await getDB();
  
  // Récupérer toutes les photos liées à ce carnet
  const carnetPhotos: string[] = [];
  Object.values(carnet.skills).forEach(skill => {
    skill.photos.forEach(photo => carnetPhotos.push(photo.id));
  });
  
  const photos: Record<string, string> = {};
  for (const photoId of carnetPhotos) {
    const photo = await db.get('photos', photoId);
    if (photo) {
      photos[photoId] = photo.dataURL;
    }
  }

  return {
    version: '2.0.0',
    carnet,
    photos,
    exportedAt: Date.now()
  };
}

export async function importStudentData(data: ExportData, targetStudentId?: ID): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['carnets', 'photos'], 'readwrite');

  // Utiliser l'ID cible ou celui du carnet importé
  const studentId = targetStudentId || data.carnet.studentId;
  const carnetId = generateCarnetId(studentId);
  
  // Mettre à jour l'ID étudiant dans le carnet
  const updatedCarnet = { ...data.carnet, studentId };

  // Sauvegarder le carnet
  await tx.objectStore('carnets').put({
    id: carnetId,
    data: updatedCarnet,
    updatedAt: Date.now()
  });

  // Sauvegarder les photos
  for (const [photoId, dataURL] of Object.entries(data.photos)) {
    // Trouver les métadonnées de la photo dans le carnet
    let photoMeta: Photo | null = null;
    
    for (const skill of Object.values(data.carnet.skills)) {
      const photo = skill.photos.find(p => p.id === photoId);
      if (photo) {
        photoMeta = photo;
        break;
      }
    }

    if (photoMeta) {
      await tx.objectStore('photos').put({
        id: photoId,
        dataURL,
        createdAt: photoMeta.createdAt,
        caption: photoMeta.caption
      });
    }
  }

  await tx.done;
}

// Alias pour compatibilité avec l'ancienne version
export { exportStudentData as exportData };
export { importStudentData as importData };
