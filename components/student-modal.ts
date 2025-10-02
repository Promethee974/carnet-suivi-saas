import { Student, ID, Sex } from '../data/schema.js';
import { createStudent, updateStudent, getStudent } from '../store/students-repo.js';
import { compressImage } from '../utils/image.js';

export class StudentModal extends HTMLElement {
  private student: Student | null = null;
  private isEditing = false;
  private onSave?: (student: Student) => void;
  private onCancel?: () => void;

  constructor() {
    super();
  }

  // Ouvrir la modale pour créer un nouvel élève
  public openForCreate(onSave: (student: Student) => void, onCancel: () => void) {
    this.student = null;
    this.isEditing = false;
    this.onSave = onSave;
    this.onCancel = onCancel;
    this.render();
    this.show();
  }

  // Ouvrir la modale pour éditer un élève existant
  public async openForEdit(studentId: ID, onSave: (student: Student) => void, onCancel: () => void) {
    this.student = await getStudent(studentId);
    this.isEditing = true;
    this.onSave = onSave;
    this.onCancel = onCancel;
    this.render();
    this.show();
  }

  private show() {
    this.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Focus sur le premier champ
    setTimeout(() => {
      const firstInput = this.querySelector('input') as HTMLInputElement;
      firstInput?.focus();
    }, 100);
  }

  private hide() {
    this.style.display = 'none';
    document.body.style.overflow = '';
  }

  private render() {
    this.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    this.style.display = 'none';

    this.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              ${this.isEditing ? 'Modifier l\'élève' : 'Nouvel élève'}
            </h2>
            <button id="close-btn" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form id="student-form" class="space-y-4">
            <!-- Avatar -->
            <div class="text-center">
              <div class="relative inline-block">
                <div id="avatar-preview" class="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                  ${this.student?.avatar ? `
                    <img src="${this.student.avatar}" alt="Avatar" class="w-full h-full object-cover" />
                  ` : `
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  `}
                </div>
                <button type="button" id="change-avatar" class="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </button>
              </div>
              <input type="file" id="avatar-input" accept="image/*" class="hidden" />
            </div>

            <!-- Nom -->
            <div>
              <label for="nom" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom <span class="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                id="nom" 
                name="nom" 
                required
                value="${this.student?.nom || ''}"
                class="input w-full"
                placeholder="Nom de famille"
              />
            </div>

            <!-- Prénom -->
            <div>
              <label for="prenom" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prénom <span class="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                id="prenom" 
                name="prenom" 
                required
                value="${this.student?.prenom || ''}"
                class="input w-full"
                placeholder="Prénom"
              />
            </div>

            <!-- Sexe -->
            <div>
              <label for="sexe" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sexe
              </label>
              <select id="sexe" name="sexe" class="input w-full">
                <option value="">Non spécifié</option>
                <option value="F" ${this.student?.sexe === 'F' ? 'selected' : ''}>Féminin</option>
                <option value="M" ${this.student?.sexe === 'M' ? 'selected' : ''}>Masculin</option>
                <option value="Autre" ${this.student?.sexe === 'Autre' ? 'selected' : ''}>Autre</option>
                <option value="ND" ${this.student?.sexe === 'ND' ? 'selected' : ''}>Ne souhaite pas dire</option>
              </select>
            </div>

            <!-- Date de naissance -->
            <div>
              <label for="naissance" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de naissance
              </label>
              <input 
                type="date" 
                id="naissance" 
                name="naissance" 
                value="${this.student?.naissance || ''}"
                class="input w-full"
              />
            </div>

            <!-- Boutons -->
            <div class="flex gap-3 pt-4">
              <button type="button" id="cancel-btn" class="btn-secondary flex-1">
                Annuler
              </button>
              <button type="submit" class="btn-primary flex-1">
                ${this.isEditing ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents() {
    // Fermeture
    this.querySelector('#close-btn')?.addEventListener('click', () => this.handleCancel());
    this.querySelector('#cancel-btn')?.addEventListener('click', () => this.handleCancel());
    
    // Clic en dehors de la modale
    this.addEventListener('click', (e) => {
      if (e.target === this) {
        this.handleCancel();
      }
    });

    // Échap pour fermer
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.handleCancel();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Changement d'avatar
    this.querySelector('#change-avatar')?.addEventListener('click', () => {
      const input = this.querySelector('#avatar-input') as HTMLInputElement;
      input.click();
    });

    this.querySelector('#avatar-input')?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const compressedDataURL = await compressImage(file);
          const preview = this.querySelector('#avatar-preview')!;
          preview.innerHTML = `<img src="${compressedDataURL}" alt="Avatar" class="w-full h-full object-cover" />`;
        } catch (error) {
          console.error('Erreur compression image:', error);
          alert('Erreur lors du traitement de l\'image');
        }
      }
    });

    // Soumission du formulaire
    this.querySelector('#student-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  private handleCancel() {
    this.hide();
    this.onCancel?.();
  }

  private async handleSubmit() {
    const form = this.querySelector('#student-form') as HTMLFormElement;
    const formData = new FormData(form);
    
    const nom = (formData.get('nom') as string).trim();
    const prenom = (formData.get('prenom') as string).trim();
    const sexe = formData.get('sexe') as Sex | '';
    const naissance = formData.get('naissance') as string;

    if (!nom || !prenom) {
      alert('Le nom et le prénom sont obligatoires');
      return;
    }

    try {
      // Récupérer l'avatar
      const avatarImg = this.querySelector('#avatar-preview img') as HTMLImageElement;
      const avatar = avatarImg?.src || undefined;

      let student: Student;

      if (this.isEditing) {
        // Modification
        if (!this.student) {
          throw new Error('Aucun élève à modifier');
        }
        const updatedStudent = await updateStudent(this.student!.id, {
          nom,
          prenom,
          sexe: sexe || undefined,
          naissance: naissance || undefined,
          avatar
        });
        if (!updatedStudent) {
          throw new Error('Erreur lors de la modification de l\'élève');
        }
        student = updatedStudent;
      } else {
        // Création
        student = await createStudent({
          nom,
          prenom,
          sexe: sexe || undefined,
          naissance: naissance || undefined,
          avatar
        });
      }

      this.hide();
      this.onSave?.(student);

    } catch (error) {
      console.error('Erreur sauvegarde élève:', error);
      alert('Erreur lors de la sauvegarde');
    }
  }
}

customElements.define('student-modal', StudentModal);
