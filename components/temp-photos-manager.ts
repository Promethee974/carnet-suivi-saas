import { getTemporaryPhotos, moveTemporaryPhotoToSkill, deleteTemporaryPhoto, TemporaryPhoto } from '../store/temp-photos.js';
import { getAllStudents } from '../store/students-repo.js';
import { getAllDomains } from '../data/skills.js';
import { Student, ID } from '../data/schema.js';
import { router } from '../utils/router.js';

export class TempPhotosManager extends HTMLElement {
  private tempPhotos: TemporaryPhoto[] = [];
  private students: Student[] = [];
  private selectedStudentId: ID | null = null;
  private selectedPhoto: TemporaryPhoto | null = null;

  connectedCallback() {
    this.loadData();
  }

  private async loadData() {
    try {
      [this.tempPhotos, this.students] = await Promise.all([
        getTemporaryPhotos(),
        getAllStudents()
      ]);
      this.render();
      this.attachEvents();
    } catch (error) {
      console.error('Erreur chargement données:', error);
      this.renderError();
    }
  }

  private render() {
    const photosByStudent = this.groupPhotosByStudent();
    const filteredPhotos = this.selectedStudentId 
      ? this.tempPhotos.filter(p => p.studentId === this.selectedStudentId)
      : this.tempPhotos;

    this.innerHTML = `
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <!-- En-tête -->
        <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div class="px-4 py-4">
            <div class="flex items-center justify-between">
              <button id="back-btn" class="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
                Retour à la liste
              </button>
              <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                📸 Photos en attente (${this.tempPhotos.length})
              </h1>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                ${this.tempPhotos.length} photo${this.tempPhotos.length > 1 ? 's' : ''} à attribuer
              </div>
            </div>
          </div>
        </header>

        <main class="container mx-auto px-4 py-6">
          ${this.tempPhotos.length === 0 ? this.renderEmptyState() : this.renderPhotosGrid(photosByStudent, filteredPhotos)}
        </main>

        <!-- Modale d'attribution -->
        ${this.renderAttributionModal()}
      </div>
    `;
  }

  private renderEmptyState() {
    return `
      <div class="text-center py-16">
        <div class="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Aucune photo en attente
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Les élèves n'ont pas encore pris de photos, ou toutes les photos ont été attribuées aux compétences.
        </p>
        <div class="space-y-4">
          <button onclick="location.hash='#/camera'" class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
            📸 Interface élève
          </button>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Dirigez les élèves vers l'interface de prise de photos
          </p>
        </div>
      </div>
    `;
  }

  private renderPhotosGrid(photosByStudent: Record<ID, TemporaryPhoto[]>, filteredPhotos: TemporaryPhoto[]) {
    return `
      <!-- Filtres -->
      <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div class="flex items-center gap-4">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrer par élève :</label>
            <select id="student-filter" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100">
              <option value="">Tous les élèves</option>
              ${this.students.map(student => `
                <option value="${student.id}" ${this.selectedStudentId === student.id ? 'selected' : ''}>
                  ${student.prenom} ${student.nom} (${photosByStudent[student.id]?.length || 0})
                </option>
              `).join('')}
            </select>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            ${filteredPhotos.length} photo${filteredPhotos.length > 1 ? 's' : ''} affichée${filteredPhotos.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <!-- Grille des photos -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        ${filteredPhotos.map(photo => this.renderPhotoCard(photo)).join('')}
      </div>
    `;
  }

  private renderPhotoCard(photo: TemporaryPhoto) {
    const student = this.students.find(s => s.id === photo.studentId);
    const timeAgo = this.formatTimeAgo(photo.timestamp);

    return `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <!-- Image -->
        <div class="aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <img 
            src="${photo.imageData}" 
            alt="Photo de ${student?.prenom || 'élève'}" 
            class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
            onclick="this.closest('temp-photos-manager').showPhotoModal('${photo.id}')"
          >
        </div>
        
        <!-- Informations -->
        <div class="p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
              ${student?.avatar ? `
                <img src="${student.avatar}" alt="Avatar" class="w-full h-full object-cover">
              ` : `
                <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              `}
            </div>
            <span class="font-medium text-gray-900 dark:text-gray-100 text-sm">
              ${student ? `${student.prenom} ${student.nom}` : 'Élève inconnu'}
            </span>
          </div>
          
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            📅 ${timeAgo}
          </p>
          
          <!-- Actions -->
          <div class="flex gap-2">
            <button 
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded transition-colors"
              onclick="this.closest('temp-photos-manager').openAttributionModal('${photo.id}')"
            >
              📎 Attribuer
            </button>
            <button 
              class="bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2 px-3 rounded transition-colors"
              onclick="this.closest('temp-photos-manager').deletePhoto('${photo.id}')"
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderAttributionModal() {
    const domains = getAllDomains(true);
    
    return `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 hidden" id="attribution-modal">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <!-- En-tête -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              📎 Attribuer la photo à une compétence
            </h2>
            <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" id="close-modal">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- Corps -->
          <div class="p-6">
            <!-- Aperçu photo -->
            <div class="mb-6 text-center">
              <div class="inline-block bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img id="modal-photo" src="" alt="Photo à attribuer" class="max-w-full max-h-48 object-contain">
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-2" id="modal-student">
                <!-- Nom élève sera inséré ici -->
              </p>
            </div>

            <!-- Sélection domaine -->
            <div class="mb-4">
              <label for="domain-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Domaine de compétence
              </label>
              <select id="domain-select" name="domain" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100">
                <option value="">Choisir un domaine...</option>
                ${domains.map(domain => `
                  <option value="${domain.id}">${domain.name}</option>
                `).join('')}
              </select>
            </div>

            <!-- Sélection compétence -->
            <div class="mb-6">
              <label for="skill-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Compétence spécifique
              </label>
              <select id="skill-select" name="skill" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100" disabled>
                <option value="">Choisir d'abord un domaine...</option>
              </select>
            </div>

            <!-- Description optionnelle -->
            <div class="mb-6">
              <label for="photo-description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (optionnelle)
              </label>
              <textarea 
                id="photo-description" 
                name="description"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-none h-20"
                placeholder="Décrivez ce que montre cette photo..."
              ></textarea>
            </div>
          </div>

          <!-- Pied de page -->
          <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600" id="cancel-attribution">
              Annuler
            </button>
            <button type="button" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600" id="confirm-attribution" disabled>
              <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Attribuer la photo
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderError() {
    this.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/20">
        <div class="text-center">
          <svg class="w-16 h-16 mx-auto text-red-600 dark:text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <h2 class="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Erreur de chargement</h2>
          <p class="text-red-700 dark:text-red-300 mb-4">Impossible de charger les photos temporaires</p>
          <button onclick="location.reload()" class="bg-red-600 text-white px-4 py-2 rounded">
            Réessayer
          </button>
        </div>
      </div>
    `;
  }

  private attachEvents() {
    // Retour
    this.querySelector('#back-btn')?.addEventListener('click', () => {
      router.goToStudentsList();
    });

    // Filtre par élève
    this.querySelector('#student-filter')?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.selectedStudentId = target.value as ID || null;
      this.render();
      this.attachEvents();
    });

    // Modale
    this.setupModalEvents();
  }

  private setupModalEvents() {
    const modal = this.querySelector('#attribution-modal') as HTMLElement;
    const closeBtn = this.querySelector('#close-modal');
    const cancelBtn = this.querySelector('#cancel-attribution');
    const confirmBtn = this.querySelector('#confirm-attribution') as HTMLButtonElement;
    const domainSelect = this.querySelector('#domain-select') as HTMLSelectElement;
    const skillSelect = this.querySelector('#skill-select') as HTMLSelectElement;

    // Fermer modale
    const closeModal = () => {
      modal.classList.add('hidden');
      this.selectedPhoto = null;
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Changement de domaine
    domainSelect?.addEventListener('change', () => {
      this.updateSkillsSelect(domainSelect.value);
      this.updateConfirmButton();
    });

    // Changement de compétence
    skillSelect?.addEventListener('change', () => {
      this.updateConfirmButton();
    });

    // Confirmation
    confirmBtn?.addEventListener('click', () => {
      this.confirmAttribution();
    });
  }

  private updateSkillsSelect(domainId: string) {
    const skillSelect = this.querySelector('#skill-select') as HTMLSelectElement;
    const confirmBtn = this.querySelector('#confirm-attribution') as HTMLButtonElement;
    
    if (!domainId) {
      skillSelect.disabled = true;
      skillSelect.innerHTML = '<option value="">Choisir d\'abord un domaine...</option>';
      confirmBtn.disabled = true;
      return;
    }

    const domains = getAllDomains(true);
    const domain = domains.find((d: { id: string }) => d.id === domainId);
    
    if (!domain || !('skills' in domain)) return;

    skillSelect.disabled = false;
    skillSelect.innerHTML = `
      <option value="">Choisir une compétence...</option>
      ${(domain as any).skills.map((skill: { id: string; text: string }) => `
        <option value="${skill.id}">${skill.text}</option>
      `).join('')}
    `;
  }

  private updateConfirmButton() {
    const confirmBtn = this.querySelector('#confirm-attribution') as HTMLButtonElement;
    const domainSelect = this.querySelector('#domain-select') as HTMLSelectElement;
    const skillSelect = this.querySelector('#skill-select') as HTMLSelectElement;
    
    confirmBtn.disabled = !domainSelect.value || !skillSelect.value;
  }

  private async confirmAttribution() {
    if (!this.selectedPhoto) return;

    const skillSelect = this.querySelector('#skill-select') as HTMLSelectElement;
    const descriptionTextarea = this.querySelector('#photo-description') as HTMLTextAreaElement;
    
    const skillId = skillSelect.value;
    const description = descriptionTextarea.value.trim();

    if (!skillId) return;

    try {
      // Mettre à jour la description si fournie
      if (description && this.selectedPhoto.id) {
        // Ici on pourrait mettre à jour la description de la photo temporaire
        // Pour simplifier, on l'utilisera lors du déplacement
      }

      // Déplacer la photo vers la compétence
      await moveTemporaryPhotoToSkill(
        this.selectedPhoto.id!,
        this.selectedPhoto.studentId,
        skillId
      );

      // Fermer la modale
      const modal = this.querySelector('#attribution-modal') as HTMLElement;
      modal.classList.add('hidden');

      // Recharger les données
      await this.loadData();
      
      // Déclencher un événement pour mettre à jour le compteur
      const event = new CustomEvent('temp-photos-updated', {
        detail: { count: this.tempPhotos.length }
      });
      document.dispatchEvent(event);
      
      console.log(`Photo ${this.selectedPhoto.id} attribuée avec succès à la compétence ${skillId}`);
      
      // Message de succès
      this.showSuccessMessage('Photo attribuée avec succès !');

    } catch (error) {
      console.error('Erreur attribution photo:', error);
      alert('Erreur lors de l\'attribution de la photo');
    }
  }

  private showSuccessMessage(message: string) {
    // Créer un toast de succès temporaire
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  private groupPhotosByStudent(): Record<ID, TemporaryPhoto[]> {
    const groups: Record<ID, TemporaryPhoto[]> = {};
    for (const photo of this.tempPhotos) {
      if (!groups[photo.studentId]) {
        groups[photo.studentId] = [];
      }
      groups[photo.studentId].push(photo);
    }
    return groups;
  }

  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'À l\'instant';
  }

  // Méthodes publiques appelées depuis le HTML
  public showPhotoModal(photoId: string) {
    const photo = this.tempPhotos.find(p => p.id === photoId);
    if (!photo) return;

    // Créer une modale simple pour voir la photo en grand
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `
      <div class="max-w-4xl max-h-full">
        <img src="${photo.imageData}" alt="Photo" class="max-w-full max-h-full object-contain rounded-lg">
        <button class="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl">&times;</button>
      </div>
    `;
    
    modal.addEventListener('click', () => modal.remove());
    document.body.appendChild(modal);
  }

  public openAttributionModal(photoId: string) {
    const photo = this.tempPhotos.find(p => p.id === photoId);
    if (!photo) return;

    this.selectedPhoto = photo;
    const student = this.students.find(s => s.id === photo.studentId);

    // Remplir la modale
    const modalPhoto = this.querySelector('#modal-photo') as HTMLImageElement;
    const modalStudent = this.querySelector('#modal-student') as HTMLElement;
    const modal = this.querySelector('#attribution-modal') as HTMLElement;

    modalPhoto.src = photo.imageData;
    modalStudent.textContent = student ? `${student.prenom} ${student.nom}` : 'Élève inconnu';

    // Réinitialiser les sélections
    const domainSelect = this.querySelector('#domain-select') as HTMLSelectElement;
    const skillSelect = this.querySelector('#skill-select') as HTMLSelectElement;
    const descriptionTextarea = this.querySelector('#photo-description') as HTMLTextAreaElement;

    domainSelect.value = '';
    skillSelect.value = '';
    skillSelect.disabled = true;
    skillSelect.innerHTML = '<option value="">Choisir d\'abord un domaine...</option>';
    descriptionTextarea.value = photo.description || '';

    this.updateConfirmButton();

    // Afficher la modale
    modal.classList.remove('hidden');
  }

  public async deletePhoto(photoId: string) {
    const photo = this.tempPhotos.find(p => p.id === photoId);
    if (!photo) return;

    const student = this.students.find(s => s.id === photo.studentId);
    const studentName = student ? `${student.prenom} ${student.nom}` : 'cet élève';

    if (!confirm(`Êtes-vous sûr de vouloir supprimer la photo de ${studentName} ?\n\nCet action est irréversible.`)) {
      return;
    }

    try {
      await deleteTemporaryPhoto(photoId);
      this.tempPhotos = this.tempPhotos.filter(p => p.id !== photoId);
      this.render();
      
      // Déclencher un événement pour mettre à jour le compteur
      const event = new CustomEvent('temp-photos-updated', {
        detail: { count: this.tempPhotos.length }
      });
      document.dispatchEvent(event);
      
      console.log(`Photo ${photoId} supprimée avec succès`);
    } catch (error) {
      console.error('Erreur suppression photo:', error);
      alert('Erreur lors de la suppression de la photo');
    }
  }
}

customElements.define('temp-photos-manager', TempPhotosManager);
