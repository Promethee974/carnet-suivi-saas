import { ExportData, ID } from '../data/schema.js';
import { exportStudentData, importStudentData } from '../store/repo.js';

export async function exportToJSON(studentId: ID): Promise<void> {
  try {
    const data = await exportStudentData(studentId);
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carnet-suivi-${data.carnet.meta.eleve || 'eleve'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    throw new Error('Erreur lors de l\'export des données');
  }
}

export async function importFromJSON(file: File, targetStudentId?: ID): Promise<void> {
  try {
    const text = await file.text();
    const data: ExportData = JSON.parse(text);
    
    // Validation basique
    if (!data.carnet || !data.photos || !data.version) {
      throw new Error('Format de fichier invalide');
    }
    
    await importStudentData(data, targetStudentId);
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    if (error instanceof SyntaxError) {
      throw new Error('Fichier JSON invalide');
    }
    throw new Error('Erreur lors de l\'import des données');
  }
}

export function createFileInput(accept: string = '.json'): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      resolve(file || null);
    };
    
    input.oncancel = () => resolve(null);
    
    input.click();
  });
}

export async function generatePDF(): Promise<void> {
  // Pour l'impression, on utilise la fonction native du navigateur
  // Les styles d'impression seront définis dans print.css
  window.print();
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
