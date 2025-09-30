// Import des dépendances nécessaires
import { getAllStudents } from '../store/students-repo.js';
import { getTemporaryPhotos } from '../store/temp-photos.js';
import { Student } from '../data/schema.js';
import './student-modal.js';

export class StudentsList extends HTMLElement {
  private students: Student[] = [];
  private tempPhotosListenerActive = false;
  
  constructor() {
    super();
    console.group('StudentsList: Constructeur');
    console.log('Création d\'une nouvelle instance de StudentsList');
    
    // Lier le gestionnaire d'événements pour conserver la référence
    this.handleTempPhotosUpdated = this.handleTempPhotosUpdated.bind(this);
    console.log('Gestionnaire d\'événements lié:', this.handleTempPhotosUpdated);
    
    console.groupEnd();
  }

  // Méthodes de cycle de vie du composant
  connectedCallback() {
    console.group('StudentsList: connectedCallback');
    console.log('Le composant est connecté au DOM');
    
    // S'abonner aux événements si ce n'est pas déjà fait
    if (!this.tempPhotosListenerActive) {
      console.log('Ajout de l\'écouteur d\'événement temp-photos-updated');
      document.addEventListener('temp-photos-updated', this.handleTempPhotosUpdated as EventListener);
      this.tempPhotosListenerActive = true;
      console.log('Écouteur d\'événement temp-photos-updated ajouté avec succès');
    } else {
      console.log('L\'écouteur d\'événement temp-photos-updated est déjà actif');
    }

    // Assurer un premier rendu avant de charger les étudiants
    this.render();

    // Charger les étudiants
    void this.loadStudents();

    console.groupEnd();
  }
  
  disconnectedCallback() {
    console.group('StudentsList: disconnectedCallback');
{{ ... }}
    
    // Nettoyer les écouteurs d'événements
    if (this.tempPhotosListenerActive) {
      console.log('Retrait de l\'écouteur d\'événement temp-photos-updated');
      document.removeEventListener('temp-photos-updated', this.handleTempPhotosUpdated as EventListener);
      this.tempPhotosListenerActive = false;
    }
    
    console.groupEnd();
  }
  
  // Gestionnaire d'événement pour les mises à jour de photos
  private handleTempPhotosUpdated = (event: Event) => {
    const customEvent = event as CustomEvent<{ count: number }>;
    console.group('handleTempPhotosUpdated');
    console.log('Événement temp-photos-updated reçu dans handleTempPhotosUpdated', event);
    
    // Vérifier si le composant est toujours connecté au DOM
    if (!this.isConnected) {
      console.warn('Le composant n\'est plus connecté au DOM, annulation du traitement de l\'événement');
      console.groupEnd();
      return;
    }
    
    console.log('Mise à jour du compteur de photos...');
    this.updateTempPhotosCount()
      .then(() => {
        console.log('Mise à jour du comptreur terminée');
        console.groupEnd();
      })
      .catch((error: Error) => {
        console.error('Erreur lors de la mise à jour du comptreur:', error);
        console.groupEnd();
      });
  };
  
  // Méthode pour forcer la mise à jour du compteur de photos
  public async refreshPhotosCount(): Promise<void> {
    console.log('Forçage de la mise à jour du compteur de photos');
    return this.updateTempPhotosCount();
  }
  
  // Méthode pour mettre à jour le compteur de photos temporaires
  private async updateTempPhotosCount(): Promise<void> {
    console.group('updateTempPhotosCount');
    console.log('Mise à jour du compteur de photos temporaires...');
    
    try {
      const tempPhotos = await getTemporaryPhotos();
      const count = tempPhotos.length;
      console.log(`Nombre de photos temporaires trouvées: ${count}`);
      
      // Mettre à jour le compteur dans l'interface utilisateur
      const counterElement = this.querySelector<HTMLElement>('#temp-photos-count');
      if (counterElement) {
        counterElement.textContent = count.toString();
        counterElement.classList.toggle('hidden', count === 0);
        console.log('Compteur mis à jour avec succès');
      } else {
        console.warn('Élément #temp-photos-count non trouvé dans le DOM');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compteur de photos:', error);
    } finally {
      console.groupEnd();
    }
  }
  
  // Méthode pour charger les étudiants
  private async loadStudents(): Promise<void> {
    console.group('loadStudents');
    try {
      this.students = await getAllStudents();
      this.render();
      console.log(`${this.students.length} étudiants chargés avec succès`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Erreur lors du chargement des étudiants:', errorMessage);
      // Afficher un message d'erreur dans l'interface utilisateur
      this.innerHTML = `
        <div class="p-4 text-red-600 bg-red-100 rounded-lg">
          <p>Erreur lors du chargement des étudiants. Veuillez réessayer.</p>
          <button class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onclick="location.reload()">
            Réessayer
          </button>
        </div>
      `;
    } finally {
      console.groupEnd();
    }
  }
  
  // Méthode pour configurer les écouteurs d'événements
  private setupEventListeners(): void {
    // Bouton pour ajouter un nouvel élève
    const addButton = this.querySelector('#add-student');
    if (addButton) {
      addButton.addEventListener('click', () => {
        const modal = this.querySelector('#student-modal') as any;
        if (modal && typeof modal.open === 'function') {
          modal.open();
        }
      });
    }

    // Bouton pour importer des élèves
    const importButton = this.querySelector('#import-students');
    if (importButton) {
      importButton.addEventListener('click', () => {
        // Implémentez la logique d'importation ici
        alert('Fonctionnalité d\'importation à implémenter');
      });
    }

    // Bouton pour accéder aux photos en attente
    const tempPhotosButton = this.querySelector('#temp-photos-button');
    if (tempPhotosButton) {
      tempPhotosButton.addEventListener('click', () => {
        // Naviguer vers la page de gestion des photos temporaires
        window.location.hash = '/photos';
      });
    }

    // Gestion des clics sur les boutons "Voir" et "Modifier"
    this.querySelectorAll('.view-student, .edit-student').forEach(button => {
      button.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const studentId = target.closest('button')?.getAttribute('data-id');
        const isEdit = target.closest('button')?.classList.contains('edit-student');
        
        if (studentId) {
          if (isEdit) {
            // Ouvrir la modale d'édition
            const modal = this.querySelector('#student-modal') as any;
            if (modal && typeof modal.open === 'function') {
              const student = this.students.find(s => s.id === studentId);
              if (student) {
                modal.open(student);
              }
            }
          } else {
            // Naviguer vers la page de détail de l'élève
            window.location.hash = `/students/${studentId}`;
          }
        }
      });
    });
  }
  
  // Méthode pour rendre le composant
  private render(): void {
    console.log('Rendu du composant StudentsList');
    
    this.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <!-- En-tête -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Liste des élèves</h1>
            <p class="text-gray-600 dark:text-gray-400">
              Gérer les élèves et suivre leur progression
            </p>
          </div>
          <div class="mt-4 md:mt-0 flex space-x-4">
            <!-- Bouton pour ajouter un élève -->
            <button id="add-student" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Ajouter un élève
            </button>
            
            <!-- Bouton pour importer depuis un fichier -->
            <button id="import-students" class="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 px-4 py-2 rounded-lg flex items-center dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              Importer
            </button>
            
            <!-- Compteur de photos en attente -->
            <button id="temp-photos-button" class="relative bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg flex items-center dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              Photos en attente
              <span id="temp-photos-count" class="ml-2 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                0
              </span>
            </button>
          </div>
        </div>
        
        <!-- Liste des élèves -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nom
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Prénom
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date de naissance
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700" id="students-table-body">
                ${this.students.length === 0 ? `
                  <tr>
                    <td colspan="4" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <div class="flex flex-col items-center justify-center">
                        <svg class="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        <p class="text-lg font-medium">Aucun élève enregistré</p>
                        <p class="mt-1">Commencez par ajouter un élève pour commencer le suivi</p>
                      </div>
                    </td>
                  </tr>
                ` : this.students.map(student => `
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ${student.nom}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      ${student.prenom}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      ${student.birthDate ? new Date(student.birthDate).toLocaleDateString('fr-FR') : 'Non renseignée'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4 view-student" data-id="${student.id}">
                        Voir
                      </button>
                      <button class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 edit-student" data-id="${student.id}">
                        Modifier
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Modal pour l'ajout/édition d'un élève -->
      <student-modal id="student-modal"></student-modal>
    `;
    
    // Ajouter les écouteurs d'événements
    this.setupEventListeners();
    
    // Mettre à jour le compteur de photos
    this.updateTempPhotosCount().catch(error => {
      console.error('Erreur lors de la mise à jour du compteur de photos:', error);
    });
  }
}

customElements.define('students-list', StudentsList);
