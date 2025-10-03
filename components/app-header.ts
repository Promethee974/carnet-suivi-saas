import { getCarnet, initializeCarnet, updateMeta, saveCarnet } from '../store/repo.js';
import { compressImage } from '../utils/image.js';

function debounce<T extends (...args: any[]) => void>(fn: T, delay = 400) {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), delay);
  };
}

export class AppHeader extends HTMLElement {
  private studentId: string = '';
  
  constructor() {
    super();
    this.studentId = this.getCurrentStudentId();
    this.render();
  }
  
  private getCurrentStudentId(): string {
    // Récupérer l'ID de l'étudiant actuel depuis l'URL ou utiliser une valeur par défaut
    return window.location.hash.split('/')[2] || 'default-student';
  }

  private async render() {
    this.studentId = this.getCurrentStudentId();
    const carnet = (await getCarnet(this.studentId)) || (await initializeCarnet(this.studentId));

    this.innerHTML = `
      <header class="border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur sticky top-0 z-40 pt-safe-top">
        <div class="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <label class="relative block">
              <input type="file" accept="image/*" class="sr-only" id="avatar-input" />
              <div class="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary-500 cursor-pointer bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                ${carnet.meta.avatar ? `<img src="${carnet.meta.avatar}" alt="Avatar" class="w-full h-full object-cover" />` : `
                  <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                `}
              </div>
            </label>
            <div class="grid grid-cols-2 gap-2 items-center">
              <label class="text-xs text-gray-500" for="eleve">Élève</label>
              <input id="eleve" class="input" type="text" value="${carnet.meta.eleve}" placeholder="Nom de l'élève"/>
              <label class="text-xs text-gray-500" for="annee">Année</label>
              <input id="annee" class="input" type="text" value="${carnet.meta.annee}" placeholder="2025-2026"/>
              <label class="text-xs text-gray-500" for="enseignant">Enseignant</label>
              <input id="enseignant" class="input" type="text" value="${carnet.meta.enseignant}" placeholder="Mme/M. ..."/>
              <label class="text-xs text-gray-500" for="periode">Période</label>
              <select id="periode" class="input">
                ${['1','2','3','4','5'].map(p => `<option value="${p}" ${carnet.meta.periode===p?'selected':''}>${p}</option>`).join('')}
              </select>
            </div>
          </div>

          <nav class="flex items-center gap-2 toolbar" aria-label="Barre d'outils">
            <button id="synthese-toggle" class="btn-secondary" title="Synthèse générale">Synthèse</button>
          </nav>
        </div>
      </header>
    `;

    this.attachEvents();
  }

  private attachEvents() {
    const onInput = debounce(async () => {
      const eleve = (this.querySelector('#eleve') as HTMLInputElement).value;
      const annee = (this.querySelector('#annee') as HTMLInputElement).value;
      const enseignant = (this.querySelector('#enseignant') as HTMLInputElement).value;
      const periode = (this.querySelector('#periode') as HTMLSelectElement).value as any;
      await updateMeta(this.studentId, { eleve, annee, enseignant, periode });
    }, 300);

    this.querySelectorAll('#eleve,#annee,#enseignant,#periode').forEach(el => {
      el.addEventListener('input', onInput);
      el.addEventListener('change', onInput);
    });

    const avatarInput = this.querySelector('#avatar-input') as HTMLInputElement;
    avatarInput.addEventListener('change', async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const dataURL = await compressImage(file, { maxWidth: 512, maxHeight: 512, quality: 0.9 });
      await updateMeta(this.studentId, { avatar: dataURL });
      await this.render();
    });

    // Toolbar
    this.querySelector('#synthese-toggle')?.addEventListener('click', () => this.showSyntheseModal());
  }

  private async showSyntheseModal() {
    this.studentId = this.getCurrentStudentId();
    const carnet = await getCarnet(this.studentId);
    if (!carnet) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content max-w-2xl">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-semibold">Synthèse générale - Programmes 2025</h3>
            <button type="button" class="btn-icon" id="close-modal">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2" for="forces">Points forts de l'élève</label>
              <textarea id="forces" class="textarea h-24" placeholder="Décrivez les points forts observés...">${carnet.synthese.forces || ''}</textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2" for="axes">Axes de progrès</label>
              <textarea id="axes" class="textarea h-24" placeholder="Identifiez les axes de progrès...">${carnet.synthese.axes || ''}</textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2" for="projets">Projets pédagogiques</label>
              <textarea id="projets" class="textarea h-24" placeholder="Décrivez les projets envisagés...">${carnet.synthese.projets || ''}</textarea>
            </div>
          </div>
          
          <div class="flex justify-end gap-3 mt-6">
            <button type="button" class="btn-secondary" id="cancel-modal">Annuler</button>
            <button type="button" class="btn-primary" id="save-synthese">Sauvegarder</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Gestion des événements
    const closeModal = () => document.body.removeChild(modal);
    
    modal.querySelector('#close-modal')?.addEventListener('click', closeModal);
    modal.querySelector('#cancel-modal')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Sauvegarde
    modal.querySelector('#save-synthese')?.addEventListener('click', async () => {
      const forces = (modal.querySelector('#forces') as HTMLTextAreaElement).value;
      const axes = (modal.querySelector('#axes') as HTMLTextAreaElement).value;
      const projets = (modal.querySelector('#projets') as HTMLTextAreaElement).value;
      
      carnet.synthese = { forces, axes, projets };
      await saveCarnet(carnet);
      closeModal();
    });

    // Fermer avec Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }
}

customElements.define('app-header', AppHeader);
