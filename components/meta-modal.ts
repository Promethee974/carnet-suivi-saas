import { Meta, ID } from '../data/schema.js';
import { updateMeta, getCarnet, getSetting, setSetting } from '../store/repo.js';

export class MetaModal extends HTMLElement {
  private studentId: ID = '';
  private meta: Meta | null = null;
  private onSave?: (meta: Meta) => void;
  private onCancel?: () => void;

  constructor() {
    super();
  }

  // Ouvrir la modale pour éditer les métadonnées du carnet
  public async openForEdit(studentId: ID, onSave: (meta: Meta) => void, onCancel: () => void) {
    this.studentId = studentId;
    this.onSave = onSave;
    this.onCancel = onCancel;
    
    // Charger les métadonnées actuelles
    const carnet = await getCarnet(studentId);
    this.meta = carnet?.meta || {
      eleve: '',
      annee: new Date().getFullYear().toString(),
      enseignant: '',
      periode: '1'
    };
    
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

  private async render() {
    this.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    this.style.display = 'none';

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const includeTransversal = await getSetting('includeTransversal') ?? false;

    this.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Informations du carnet
            </h2>
            <button id="close-btn" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form id="meta-form" class="space-y-4">
            <!-- Nom de l'élève (lecture seule) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Élève
              </label>
              <input 
                type="text" 
                value="${this.meta?.eleve || ''}"
                class="input w-full bg-gray-50 dark:bg-gray-700"
                readonly
              />
              <p class="text-xs text-gray-500 mt-1">
                Le nom de l'élève est automatiquement synchronisé
              </p>
            </div>

            <!-- Année scolaire -->
            <div>
              <label for="annee" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Année scolaire <span class="text-red-500">*</span>
              </label>
              <select id="annee" name="annee" required class="input w-full">
                ${years.map(year => `
                  <option value="${year}" ${this.meta?.annee === year.toString() ? 'selected' : ''}>
                    ${year}-${year + 1}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Enseignant -->
            <div>
              <label for="enseignant" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Enseignant <span class="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                id="enseignant" 
                name="enseignant" 
                required
                value="${this.meta?.enseignant || ''}"
                class="input w-full"
                placeholder="Nom de l'enseignant"
              />
            </div>

            <!-- Période -->
            <div>
              <label for="periode" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Période d'évaluation <span class="text-red-500">*</span>
              </label>
              <select id="periode" name="periode" required class="input w-full">
                <option value="1" ${this.meta?.periode === '1' ? 'selected' : ''}>Période 1 (Sept-Oct)</option>
                <option value="2" ${this.meta?.periode === '2' ? 'selected' : ''}>Période 2 (Nov-Déc)</option>
                <option value="3" ${this.meta?.periode === '3' ? 'selected' : ''}>Période 3 (Jan-Fév)</option>
                <option value="4" ${this.meta?.periode === '4' ? 'selected' : ''}>Période 4 (Mar-Avr)</option>
                <option value="5" ${this.meta?.periode === '5' ? 'selected' : ''}>Période 5 (Mai-Juin)</option>
              </select>
            </div>

            <!-- Réglages d'affichage -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Réglages d'affichage
              </label>
              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm">
                  <input type="checkbox" id="include-transversal" class="rounded" ${includeTransversal ? 'checked' : ''}>
                  <span>Inclure "Vie de classe et autonomie"</span>
                </label>
              </div>
            </div>

            <!-- Informations -->
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div class="flex">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div class="text-sm text-blue-800 dark:text-blue-200">
                  <p class="font-medium mb-1">Informations importantes :</p>
                  <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>Ces informations apparaîtront sur les exports et impressions</li>
                    <li>L'année scolaire est utilisée pour l'archivage</li>
                    <li>La période permet de suivre l'évolution dans l'année</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Boutons -->
            <div class="flex gap-3 pt-4">
              <button type="button" id="cancel-btn" class="btn-secondary flex-1">
                Annuler
              </button>
              <button type="submit" class="btn-primary flex-1">
                Enregistrer
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

    // Soumission du formulaire
    this.querySelector('#meta-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  private handleCancel() {
    this.hide();
    this.onCancel?.();
  }

  private async handleSubmit() {
    const form = this.querySelector('#meta-form') as HTMLFormElement;
    const formData = new FormData(form);
    
    const annee = formData.get('annee') as string;
    const enseignant = (formData.get('enseignant') as string).trim();
    const periode = formData.get('periode') as '1' | '2' | '3' | '4' | '5';
    const includeTransversal = (this.querySelector('#include-transversal') as HTMLInputElement).checked;

    if (!enseignant) {
      alert('Le nom de l\'enseignant est obligatoire');
      return;
    }

    try {
      const updatedMeta: Partial<Meta> = {
        annee,
        enseignant,
        periode
      };

      // Sauvegarder les métadonnées et le réglage
      await Promise.all([
        updateMeta(this.studentId, updatedMeta),
        setSetting('includeTransversal', includeTransversal)
      ]);
      
      // Créer l'objet Meta complet pour le callback
      const fullMeta: Meta = {
        ...this.meta!,
        ...updatedMeta
      };

      this.hide();
      this.onSave?.(fullMeta);

    } catch (error) {
      console.error('Erreur sauvegarde métadonnées:', error);
      alert('Erreur lors de la sauvegarde');
    }
  }
}

customElements.define('meta-modal', MetaModal);
