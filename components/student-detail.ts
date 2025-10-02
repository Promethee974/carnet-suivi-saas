import { getStudent } from '../store/students-repo.js';
import { getCarnet, initializeCarnet, getSetting } from '../store/repo.js';
import { getAllDomains } from '../data/skills.js';
import { calculateDomainProgress } from '../utils/progress.js';
import { router } from '../utils/router.js';
import { Student, Carnet, ID } from '../data/schema.js';
import { printStudentDirect } from '../utils/print-direct.js';
import './domain-card.js';
import './skill-item.js';
import './photo-gallery.js';
import './stats-summary.js';
import './meta-modal.js';
import './student-modal.js';
import './synthese-modal.js';

export class StudentDetail extends HTMLElement {
  private studentId: ID = '';
  private student: Student | null = null;
  private carnet: Carnet | null = null;

  static get observedAttributes() {
    return ['student-id'];
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null) {
    if (name === 'student-id' && value) {
      this.studentId = value;
      this.loadData();
    }
  }

  connectedCallback() {
    if (this.studentId) {
      this.loadData();
    }
  }

  private async loadData() {
    try {
      this.student = await getStudent(this.studentId);
      if (!this.student) {
        this.renderError('Élève introuvable');
        return;
      }

      this.carnet = await getCarnet(this.studentId);
      if (!this.carnet) {
        this.carnet = await initializeCarnet(this.studentId, this.student);
      }

      this.render();
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      this.renderError('Erreur lors du chargement des données');
    }
  }

  private renderError(message: string) {
    this.innerHTML = `
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <svg class="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">${message}</h2>
          <button class="btn-primary" onclick="history.back()">Retour</button>
        </div>
      </div>
    `;
  }

  private async render() {
    if (!this.student || !this.carnet) return;

    const includeTransversal = await getSetting('includeTransversal') ?? false;
    const allDomains = getAllDomains(includeTransversal);
    const domains = this.sortDomainsByCustomOrder(allDomains);

    this.innerHTML = `
      <div class="min-h-screen flex flex-col">
        <!-- Navigation -->
        <!-- En-tête avec informations élève -->
        <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <!-- Barre de navigation simple -->
          <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <button id="back-btn" class="btn-icon" title="Retour à la liste">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          </div>

          <!-- Informations élève -->
          <div class="px-4 py-6">
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                ${this.student.avatar ? `
                  <img src="${this.student.avatar}" alt="Avatar" class="w-full h-full object-cover" />
                ` : `
                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                `}
              </div>
              <div class="flex-1 min-w-0">
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  ${this.student.prenom} ${this.student.nom}
                </h1>
                <p class="text-base text-gray-600 dark:text-gray-400 mb-2">
                  Carnet de suivi GS - Programmes 2025
                </p>
                ${this.carnet ? `
                  <div class="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>📅 ${this.carnet.meta.annee}-${parseInt(this.carnet.meta.annee) + 1}</span>
                    <span>👩‍🏫 ${this.carnet.meta.enseignant}</span>
                    <span>📋 Période ${this.carnet.meta.periode}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Boutons d'action -->
            <div class="mt-6 flex flex-wrap gap-2">
              <button id="edit-student-btn" class="btn-secondary flex-1 sm:flex-none" title="Modifier l'élève">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Élève
              </button>
              <button id="edit-meta-btn" class="btn-secondary flex-1 sm:flex-none" title="Modifier les informations du carnet">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                Carnet
              </button>
              <button id="synthese-btn" class="btn-secondary flex-1 sm:flex-none" title="Synthèse générale">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Synthèse
              </button>
              <button id="print-btn" class="btn-primary flex-1 sm:flex-none" title="Imprimer le carnet">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                Imprimer
              </button>
            </div>
          </div>
        </header>

        <!-- Contenu principal -->
        <main class="flex-1 container mx-auto px-4 py-6">
          <div class="mb-6">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Évaluation des compétences</h2>
          </div>

          <!-- Statistiques globales -->
          <stats-summary student-id="${this.studentId}"></stats-summary>

          <!-- Domaines de compétences -->
          <section class="space-y-4" aria-label="Domaines">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                📚 Domaines de compétences
              </h2>
              <div class="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                </svg>
                Glisser-déposer pour réorganiser
              </div>
            </div>
            
            <div id="domains-container" class="space-y-3">
              ${domains.length > 0 ? domains.map((d, index) => {
                const prog = calculateDomainProgress(d.id, this.carnet!.skills);
                return `
                  <div class="domain-item" draggable="true" data-domain-id="${d.id}" data-index="${index}">
                    <domain-card 
                      student-id="${this.studentId}"
                      data-domain-id="${d.id}" 
                      data-name="${d.name}" 
                      data-color="${d.color}" 
                      data-percentage="${prog.percentage}" 
                      data-acquired="${prog.acquired}" 
                      data-total="${prog.total}">
                    </domain-card>
                  </div>
                `;
              }).join('') : `
                <div class="text-center py-8">
                  <p class="text-gray-500">Aucun domaine trouvé. Vérifiez la configuration.</p>
                  <p class="text-sm text-gray-400 mt-2">Domaines disponibles: ${domains.length}</p>
                </div>
              `}
            </div>
          </section>
        </main>

        <!-- Modales -->
        <student-modal></student-modal>
        <meta-modal></meta-modal>
        <synthese-modal></synthese-modal>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents() {
    // Navigation
    this.querySelector('#back-btn')?.addEventListener('click', () => {
      router.goToStudentsList();
    });

    // Actions
    this.querySelector('#edit-student-btn')?.addEventListener('click', () => {
      this.editStudent();
    });

    this.querySelector('#edit-meta-btn')?.addEventListener('click', () => {
      this.editMeta();
    });

    this.querySelector('#print-btn')?.addEventListener('click', async () => {
      await printStudentDirect(this.studentId);
    });

    this.querySelector('#synthese-btn')?.addEventListener('click', () => {
      this.showSynthese();
    });


    // Drag & Drop pour réorganiser les domaines
    this.setupDragAndDrop();
  }

  private editStudent() {
    const modal = this.querySelector('student-modal') as any;
    modal.openForEdit(
      this.studentId,
      (student: Student) => {
        console.log('Élève modifié:', student);
        this.student = student;
        this.render(); // Re-render pour afficher les nouvelles infos
      },
      () => {
        console.log('Modification annulée');
      }
    );
  }

  private editMeta() {
    const modal = this.querySelector('meta-modal') as any;
    modal.openForEdit(
      this.studentId,
      async (meta: any) => {
        console.log('Métadonnées modifiées:', meta);
        if (this.carnet) {
          this.carnet.meta = meta;
        }
        // Recharger complètement pour prendre en compte les changements de réglages
        await this.loadData();
      },
      () => {
        console.log('Modification annulée');
      }
    );
  }

  // Méthode d'export d'élève (à implémenter)
  // @ts-ignore - Méthode à implémenter plus tard
  private async exportStudent() {
    try {
      // TODO: Implémenter exportStudentData
      console.log('Export élève', this.studentId);
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    }
  }

  private showSynthese() {
    const modal = this.querySelector('synthese-modal') as any;
    modal.openForEdit(
      this.studentId,
      (synthese: any) => {
        console.log('Synthèse modifiée:', synthese);
        // Optionnel : recharger les données pour afficher les changements
        this.loadData();
      },
      () => {
        console.log('Modification synthèse annulée');
      }
    );
  }

  private setupDragAndDrop() {
    const container = this.querySelector('#domains-container');
    if (!container) return;

    let draggedElement: HTMLElement | null = null;

    // Gestion des événements de drag
    container.addEventListener('dragstart', (e) => {
      const dragEvent = e as DragEvent;
      const target = e.target as HTMLElement;
      const domainItem = target.closest('.domain-item') as HTMLElement;
      
      if (domainItem) {
        draggedElement = domainItem;
        // Stocker l'index dans le dataset de l'élément
        domainItem.dataset.index = domainItem.dataset.index || '0';
        domainItem.classList.add('opacity-50', 'scale-95');
        
        // Effet visuel sur le curseur
        if (dragEvent.dataTransfer) {
          dragEvent.dataTransfer.effectAllowed = 'move';
          dragEvent.dataTransfer.setData('text/html', domainItem.outerHTML);
        }
      }
    });

    container.addEventListener('dragend', (e) => {
      const target = e.target as HTMLElement;
      const domainItem = target.closest('.domain-item') as HTMLElement;
      
      if (domainItem) {
        domainItem.classList.remove('opacity-50', 'scale-95');
      }
      
      draggedElement = null;
      // Réinitialiser l'élément déplacé
      
      // Supprimer tous les indicateurs de drop
      container.querySelectorAll('.drop-indicator').forEach(indicator => {
        indicator.remove();
      });
    });

    container.addEventListener('dragover', (e) => {
      const dragEvent = e as DragEvent;
      e.preventDefault();
      if (dragEvent.dataTransfer) {
        dragEvent.dataTransfer.dropEffect = 'move';
      }

      const target = e.target as HTMLElement;
      const domainItem = target.closest('.domain-item') as HTMLElement;
      
      if (domainItem && domainItem !== draggedElement) {
        // Supprimer les anciens indicateurs
        container.querySelectorAll('.drop-indicator').forEach(indicator => {
          indicator.remove();
        });

        // Créer un indicateur de drop
        const indicator = document.createElement('div');
        indicator.className = 'drop-indicator h-1 bg-blue-500 rounded-full mx-4 transition-all duration-200';
        
        const rect = domainItem.getBoundingClientRect();
        // Suppression de la variable non utilisée
        const midpoint = rect.top + rect.height / 2;
        
        if (dragEvent.clientY < midpoint) {
          // Insérer avant
          domainItem.parentNode?.insertBefore(indicator, domainItem);
        } else {
          // Insérer après
          domainItem.parentNode?.insertBefore(indicator, domainItem.nextSibling);
        }
      }
    });

    container.addEventListener('drop', (e) => {
      const dragEvent = e as DragEvent;
      e.preventDefault();
      
      const target = e.target as HTMLElement;
      const targetItem = target.closest('.domain-item') as HTMLElement;
      
      if (targetItem && draggedElement && targetItem !== draggedElement) {
        // Suppression de la variable non utilisée
        
        // Réorganiser visuellement
        const rect = targetItem.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        if (dragEvent.clientY < midpoint) {
          // Insérer avant
          targetItem.parentNode?.insertBefore(draggedElement, targetItem);
        } else {
          // Insérer après
          targetItem.parentNode?.insertBefore(draggedElement, targetItem.nextSibling);
        }

        // Sauvegarder le nouvel ordre
        this.saveDomainOrder();
        
        // Feedback visuel de succès
        this.showReorderSuccess();
      }
      
      // Nettoyer les indicateurs
      container.querySelectorAll('.drop-indicator').forEach(indicator => {
        indicator.remove();
      });
    });

    // Ajouter des styles de drag aux éléments
    container.querySelectorAll('.domain-item').forEach((item) => {
      const element = item as HTMLElement;
      element.style.cursor = 'grab';
      
      element.addEventListener('dragstart', () => {
        element.style.cursor = 'grabbing';
      });
      
      element.addEventListener('dragend', () => {
        element.style.cursor = 'grab';
      });
    });
  }

  private saveDomainOrder() {
    const container = this.querySelector('#domains-container');
    if (!container) return;

    const domainItems = container.querySelectorAll('.domain-item');
    const newOrder = Array.from(domainItems).map((item, index) => {
      const element = item as HTMLElement;
      return {
        domainId: element.dataset.domainId,
        order: index
      };
    });

    // Sauvegarder dans localStorage pour persistance
    localStorage.setItem(`domain-order-${this.studentId}`, JSON.stringify(newOrder));
    
    console.log('Nouvel ordre des domaines sauvegardé:', newOrder);
  }

  private loadDomainOrder(): string[] {
    try {
      const saved = localStorage.getItem(`domain-order-${this.studentId}`);
      if (saved) {
        const order = JSON.parse(saved);
        return order.map((item: any) => item.domainId);
      }
    } catch (error) {
      console.error('Erreur chargement ordre domaines:', error);
    }
    return [];
  }

  private showReorderSuccess() {
    // Créer un toast de succès temporaire
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center';
    toast.innerHTML = `
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      Ordre des domaines mis à jour
    `;
    
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 2000);
  }

  private sortDomainsByCustomOrder(domains: any[]): any[] {
    const customOrder = this.loadDomainOrder();
    
    if (customOrder.length === 0) {
      // Pas d'ordre personnalisé, retourner l'ordre par défaut
      return domains;
    }

    // Trier selon l'ordre personnalisé
    const sortedDomains: any[] = [];
    const remainingDomains = [...domains];

    // Ajouter les domaines dans l'ordre personnalisé
    for (const domainId of customOrder) {
      const domainIndex = remainingDomains.findIndex(d => d.id === domainId);
      if (domainIndex !== -1) {
        sortedDomains.push(remainingDomains.splice(domainIndex, 1)[0]);
      }
    }

    // Ajouter les domaines restants (nouveaux domaines non encore ordonnés)
    sortedDomains.push(...remainingDomains);

    return sortedDomains;
  }
}

customElements.define('student-detail', StudentDetail);
