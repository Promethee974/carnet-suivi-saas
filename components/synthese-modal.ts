import { getCarnet, saveCarnet } from '../store/repo.js';
import { ID, Synthese } from '../data/schema.js';

export class SyntheseModal extends HTMLElement {
  private studentId: ID = '';
  private onSave: ((synthese: Synthese) => void) | null = null;
  private onCancel: (() => void) | null = null;

  connectedCallback() {
    this.render();
  }

  private render() {
    this.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 hidden" id="synthese-overlay">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <!-- En-tête -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              📝 Synthèse Personnalisée
            </h2>
            <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" id="synthese-close" aria-label="Fermer">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- Corps -->
          <div class="p-6">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-400">
              💡 <strong>Conseil :</strong> Rédigez une synthèse personnalisée pour cet élève. Ces informations apparaîtront dans le carnet imprimé et permettront aux parents de mieux comprendre les progrès de leur enfant.
            </p>

            <form id="synthese-form" class="space-y-6">
              <!-- Points forts -->
              <div class="space-y-2">
                <label for="forces" class="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                    <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  Points forts
                </label>
                <textarea 
                  id="forces" 
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-none h-32" 
                  placeholder="Décrivez les points forts de l'élève, ses réussites, ses qualités particulières, ses domaines de prédilection..."
                ></textarea>
              </div>

              <!-- Axes de progrès -->
              <div class="space-y-2">
                <label for="axes" class="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
                    <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                    </svg>
                  </div>
                  Axes de progrès
                </label>
                <textarea 
                  id="axes" 
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-none h-32" 
                  placeholder="Identifiez les domaines à développer, les compétences à consolider, les difficultés rencontrées..."
                ></textarea>
              </div>

              <!-- Projets et perspectives -->
              <div class="space-y-2">
                <label for="projets" class="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-3">
                    <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                    </svg>
                  </div>
                  Projets et perspectives
                </label>
                <textarea 
                  id="projets" 
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-none h-32" 
                  placeholder="Décrivez les projets envisagés, les perspectives d'évolution, les objectifs pour la suite..."
                ></textarea>
              </div>
            </form>
          </div>

          <!-- Pied de page -->
          <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <button type="button" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600" id="synthese-cancel">
              Annuler
            </button>
            <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600" id="synthese-save">
              <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Enregistrer la synthèse
            </button>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents() {
    const overlay = this.querySelector('#synthese-overlay') as HTMLElement;
    const closeBtn = this.querySelector('#synthese-close') as HTMLElement;
    const cancelBtn = this.querySelector('#synthese-cancel') as HTMLElement;
    const saveBtn = this.querySelector('#synthese-save') as HTMLElement;
    const form = this.querySelector('#synthese-form') as HTMLFormElement;

    // Fermer la modale
    const closeModal = () => {
      overlay.classList.add('hidden');
      if (this.onCancel) this.onCancel();
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    
    // Fermer en cliquant sur l'overlay
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // Fermer avec Échap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
        closeModal();
      }
    });

    // Sauvegarder
    const handleSave = async () => {
      const forces = (this.querySelector('#forces') as HTMLTextAreaElement).value.trim();
      const axes = (this.querySelector('#axes') as HTMLTextAreaElement).value.trim();
      const projets = (this.querySelector('#projets') as HTMLTextAreaElement).value.trim();

      const synthese: Synthese = {
        forces: forces || '',
        axes: axes || '',
        projets: projets || ''
      };

      try {
        // Sauvegarder dans le carnet
        const carnet = await getCarnet(this.studentId);
        if (carnet) {
          carnet.synthese = synthese;
          await saveCarnet(carnet);
        }

        overlay.classList.add('hidden');
        if (this.onSave) this.onSave(synthese);
      } catch (error) {
        console.error('Erreur sauvegarde synthèse:', error);
        alert('Erreur lors de la sauvegarde de la synthèse');
      }
    };

    saveBtn?.addEventListener('click', handleSave);
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSave();
    });
  }

  public async openForEdit(
    studentId: ID,
    onSave: (synthese: Synthese) => void,
    onCancel: () => void
  ) {
    this.studentId = studentId;
    this.onSave = onSave;
    this.onCancel = onCancel;

    try {
      // Charger les données existantes
      const carnet = await getCarnet(studentId);
      const synthese = carnet?.synthese;

      // Pré-remplir les champs
      if (synthese) {
        const forcesField = this.querySelector('#forces') as HTMLTextAreaElement;
        const axesField = this.querySelector('#axes') as HTMLTextAreaElement;
        const projetsField = this.querySelector('#projets') as HTMLTextAreaElement;
        
        if (forcesField) forcesField.value = synthese.forces || '';
        if (axesField) axesField.value = synthese.axes || '';
        if (projetsField) projetsField.value = synthese.projets || '';
      }

      // Afficher la modale
      const overlay = this.querySelector('#synthese-overlay') as HTMLElement;
      overlay.classList.remove('hidden');

      // Focus sur le premier champ
      setTimeout(() => {
        (this.querySelector('#forces') as HTMLTextAreaElement)?.focus();
      }, 100);

    } catch (error) {
      console.error('Erreur chargement synthèse:', error);
      alert('Erreur lors du chargement de la synthèse');
    }
  }
}

customElements.define('synthese-modal', SyntheseModal);
