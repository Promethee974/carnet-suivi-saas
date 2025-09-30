import { getDB } from '../store/db.js';
import { Student, Carnet } from '../data/schema.js';

export interface BackupData {
  version: string;
  timestamp: number;
  students: Student[];
  carnets: Array<{
    id: string;
    data: Carnet;
    updatedAt: number;
  }>;
  photos: Array<{
    id: string;
    dataURL: string;
    createdAt: number;
    caption?: string;
  }>;
  tempPhotos: Array<{
    id: string;
    studentId: string;
    imageData: string;
    timestamp: number;
    description?: string;
  }>;
  settings: Array<{
    key: string;
    value: any;
  }>;
  domainOrders: Array<{
    studentId: string;
    order: string[];
  }>;
}

export class BackupService {
  private static readonly BACKUP_VERSION = '1.0.0';
  private static readonly AUTO_BACKUP_KEY = 'carnet-auto-backup';
  private static readonly BACKUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private static autoBackupInterval: number | null = null;

  /**
   * Crée une sauvegarde complète de toutes les données
   */
  static async createFullBackup(): Promise<BackupData> {
    const db = await getDB();
    
    // Récupérer toutes les données
    const [students, carnets, photos, tempPhotos, settings] = await Promise.all([
      db.getAll('students'),
      db.getAll('carnets'),
      db.getAll('photos'),
      db.getAll('temp_photos'),
      db.getAll('settings')
    ]);

    // Récupérer les ordres de domaines depuis localStorage
    const domainOrders: Array<{studentId: string; order: string[]}> = [];
    for (const student of students) {
      const orderKey = `domain-order-${student.id}`;
      const savedOrder = localStorage.getItem(orderKey);
      if (savedOrder) {
        try {
          const order = JSON.parse(savedOrder);
          domainOrders.push({
            studentId: student.id,
            order: order.map((item: any) => item.domainId)
          });
        } catch (error) {
          console.warn(`Erreur lecture ordre domaines pour ${student.id}:`, error);
        }
      }
    }

    const backup: BackupData = {
      version: this.BACKUP_VERSION,
      timestamp: Date.now(),
      students,
      carnets,
      photos,
      tempPhotos,
      settings,
      domainOrders
    };

    return backup;
  }

  /**
   * Exporte une sauvegarde vers un fichier JSON
   */
  static async exportBackup(): Promise<void> {
    try {
      const backup = await this.createFullBackup();
      
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const date = new Date().toISOString().split('T')[0];
      link.download = `carnet-suivi-backup-${date}.json`;
      link.href = url;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      console.log('✅ Sauvegarde exportée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
      throw new Error('Impossible d\'exporter la sauvegarde');
    }
  }

  /**
   * Importe et restaure une sauvegarde depuis un fichier
   */
  static async importBackup(file: File): Promise<void> {
    try {
      const content = await file.text();
      const backup: BackupData = JSON.parse(content);
      
      // Vérifier la version
      if (!backup.version || backup.version !== this.BACKUP_VERSION) {
        console.warn('⚠️ Version de sauvegarde différente:', backup.version);
      }
      
      await this.restoreFromBackup(backup);
      
      console.log('✅ Sauvegarde importée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'import:', error);
      throw new Error('Impossible d\'importer la sauvegarde. Vérifiez le format du fichier.');
    }
  }

  /**
   * Restaure les données depuis une sauvegarde
   */
  static async restoreFromBackup(backup: BackupData): Promise<void> {
    const db = await getDB();
    
    try {
      // Commencer une transaction pour toutes les opérations
      const tx = db.transaction(['students', 'carnets', 'photos', 'temp_photos', 'settings'], 'readwrite');
      
      // Vider les stores existants
      await Promise.all([
        tx.objectStore('students').clear(),
        tx.objectStore('carnets').clear(),
        tx.objectStore('photos').clear(),
        tx.objectStore('temp_photos').clear(),
        tx.objectStore('settings').clear()
      ]);
      
      // Restaurer les données
      const promises: Promise<any>[] = [];
      
      // Étudiants
      for (const student of backup.students) {
        promises.push(tx.objectStore('students').add(student));
      }
      
      // Carnets
      for (const carnet of backup.carnets) {
        promises.push(tx.objectStore('carnets').add(carnet));
      }
      
      // Photos
      for (const photo of backup.photos) {
        promises.push(tx.objectStore('photos').add(photo));
      }
      
      // Photos temporaires
      for (const tempPhoto of backup.tempPhotos) {
        promises.push(tx.objectStore('temp_photos').add(tempPhoto));
      }
      
      // Paramètres
      for (const setting of backup.settings) {
        promises.push(tx.objectStore('settings').add(setting));
      }
      
      await Promise.all(promises);
      await tx.done;
      
      // Restaurer les ordres de domaines dans localStorage
      for (const domainOrder of backup.domainOrders) {
        const orderData = domainOrder.order.map((domainId, index) => ({
          domainId,
          order: index
        }));
        localStorage.setItem(
          `domain-order-${domainOrder.studentId}`,
          JSON.stringify(orderData)
        );
      }
      
      console.log('✅ Données restaurées avec succès');
      
      // Recharger la page pour appliquer les changements
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Erreur lors de la restauration:', error);
      throw new Error('Impossible de restaurer les données');
    }
  }

  /**
   * Sauvegarde automatique en localStorage
   */
  static async createAutoBackup(): Promise<void> {
    try {
      const backup = await this.createFullBackup();
      
      // Garder seulement les 3 dernières sauvegardes auto
      const existingBackups = this.getAutoBackups();
      if (existingBackups.length >= 3) {
        existingBackups.splice(0, existingBackups.length - 2);
      }
      
      existingBackups.push(backup);
      
      localStorage.setItem(this.AUTO_BACKUP_KEY, JSON.stringify(existingBackups));
      
      console.log('💾 Sauvegarde automatique créée');
    } catch (error) {
      console.error('❌ Erreur sauvegarde automatique:', error);
    }
  }

  /**
   * Récupère les sauvegardes automatiques
   */
  static getAutoBackups(): BackupData[] {
    try {
      const stored = localStorage.getItem(this.AUTO_BACKUP_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Erreur lecture sauvegardes auto:', error);
      return [];
    }
  }

  /**
   * Restaure depuis une sauvegarde automatique
   */
  static async restoreAutoBackup(index: number): Promise<void> {
    const backups = this.getAutoBackups();
    if (index < 0 || index >= backups.length) {
      throw new Error('Sauvegarde automatique introuvable');
    }
    
    await this.restoreFromBackup(backups[index]);
  }

  /**
   * Démarre la sauvegarde automatique périodique
   */
  static startAutoBackup(): void {
    if (this.autoBackupInterval) {
      return; // Déjà démarré
    }
    
    // Première sauvegarde immédiate
    this.createAutoBackup();
    
    // Puis toutes les 30 minutes
    this.autoBackupInterval = window.setInterval(() => {
      this.createAutoBackup();
    }, this.BACKUP_INTERVAL);
    
    console.log('🔄 Sauvegarde automatique démarrée (toutes les 30 min)');
  }

  /**
   * Arrête la sauvegarde automatique
   */
  static stopAutoBackup(): void {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval);
      this.autoBackupInterval = null;
      console.log('⏹️ Sauvegarde automatique arrêtée');
    }
  }

  /**
   * Vérifie si des données existent
   */
  static async hasData(): Promise<boolean> {
    try {
      const db = await getDB();
      const students = await db.getAll('students');
      return students.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calcule la taille approximative des données
   */
  static async getDataSize(): Promise<{
    students: number;
    carnets: number;
    photos: number;
    tempPhotos: number;
    totalMB: number;
  }> {
    try {
      const backup = await this.createFullBackup();
      const json = JSON.stringify(backup);
      const sizeBytes = new Blob([json]).size;
      
      return {
        students: backup.students.length,
        carnets: backup.carnets.length,
        photos: backup.photos.length,
        tempPhotos: backup.tempPhotos.length,
        totalMB: Math.round(sizeBytes / (1024 * 1024) * 100) / 100
      };
    } catch (error) {
      return {
        students: 0,
        carnets: 0,
        photos: 0,
        tempPhotos: 0,
        totalMB: 0
      };
    }
  }

  /**
   * Nettoie les anciennes sauvegardes automatiques
   */
  static cleanupAutoBackups(): void {
    try {
      const backups = this.getAutoBackups();
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      const recentBackups = backups.filter(backup => backup.timestamp > oneWeekAgo);
      
      if (recentBackups.length !== backups.length) {
        localStorage.setItem(this.AUTO_BACKUP_KEY, JSON.stringify(recentBackups));
        console.log(`🧹 ${backups.length - recentBackups.length} anciennes sauvegardes supprimées`);
      }
    } catch (error) {
      console.error('❌ Erreur nettoyage sauvegardes:', error);
    }
  }
}

// Démarrer la sauvegarde automatique au chargement
document.addEventListener('DOMContentLoaded', () => {
  BackupService.startAutoBackup();
  BackupService.cleanupAutoBackups();
});

// Sauvegarder avant fermeture de la page
window.addEventListener('beforeunload', () => {
  BackupService.createAutoBackup();
});
