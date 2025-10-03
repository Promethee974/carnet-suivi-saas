import { BackupService, BackupData } from '../services/backup.js';
import { router } from '../utils/router.js';

export class BackupManager extends HTMLElement {
  private isLoading = false;
  private dataSize: any = null;
  private autoBackups: BackupData[] = [];

  connectedCallback() {
    this.refreshView();
  }

  private async refreshView() {
    await this.loadData();
    this.render();
    this.attachEvents();
  }

  private async loadData() {
    try {
      this.dataSize = await BackupService.getDataSize();
      this.autoBackups = BackupService.getAutoBackups();
    } catch (error) {
      console.error('Erreur chargement données sauvegarde:', error);
    }
  }

  private render() {
    this.innerHTML = `
      <div class="min-h-screen">
        <!-- Header simple avec retour -->
        <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 pt-safe-top">
          <div class="max-w-4xl mx-auto px-4 py-3">
            <button id="back-btn" class="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Retour
            </button>
          </div>
        </header>

        <main class="max-w-4xl mx-auto p-6">
          <!-- En-tête de page -->
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              💾 Gestion des Sauvegardes
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
              Protégez vos données contre la perte lors du vidage du cache
            </p>
          </div>

        <!-- Statistiques -->
        <div class="grid md:grid-cols-4 gap-4 mb-8">
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${this.dataSize?.students || 0}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Élèves</div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              ${this.dataSize?.carnets || 0}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Carnets</div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
              ${this.dataSize?.photos || 0}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Photos</div>
          </div>
          
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
              ${this.dataSize?.totalMB || 0} MB
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Taille totale</div>
          </div>
        </div>

        <!-- Actions principales -->
        <div class="grid md:grid-cols-2 gap-6 mb-8">
          <!-- Export -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-4">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Exporter les données
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Télécharger une sauvegarde complète
                </p>
              </div>
            </div>
            
            <button id="export-btn" class="w-full btn-primary" ${this.isLoading ? 'disabled' : ''}>
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
              </svg>
              ${this.isLoading ? 'Export en cours...' : 'Télécharger la sauvegarde'}
            </button>
          </div>

          <!-- Import -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-4">
                <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Importer des données
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Restaurer depuis une sauvegarde
                </p>
              </div>
            </div>
            
            <input type="file" id="import-input" accept=".json" class="hidden">
            <button id="import-btn" class="w-full btn-success" ${this.isLoading ? 'disabled' : ''}>
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              ${this.isLoading ? 'Import en cours...' : 'Choisir un fichier de sauvegarde'}
            </button>
          </div>
        </div>

        <!-- Sauvegardes automatiques -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                🔄 Sauvegardes automatiques
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Sauvegardes créées automatiquement toutes les 30 minutes
              </p>
            </div>
            <button id="refresh-btn" class="btn-secondary">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Sauvegarder
            </button>
          </div>

          ${this.autoBackups.length > 0 ? `
            <div class="space-y-3">
              ${this.autoBackups.map((backup, index) => {
                const date = new Date(backup.timestamp);
                const isRecent = Date.now() - backup.timestamp < 60 * 60 * 1000; // 1 heure
                
                return `
                  <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div class="flex items-center">
                      <div class="w-10 h-10 ${isRecent ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-600'} rounded-lg flex items-center justify-center mr-3">
                        <svg class="w-5 h-5 ${isRecent ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                        </svg>
                      </div>
                      <div>
                        <div class="font-medium text-gray-900 dark:text-gray-100">
                          ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                          ${backup.students.length} élèves • ${backup.photos.length} photos
                          ${isRecent ? ' • Récente' : ''}
                        </div>
                      </div>
                    </div>
                    <button class="restore-auto-btn btn-secondary" data-index="${index}">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      Restaurer
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="text-center py-8">
              <svg class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
              </svg>
              <p class="text-gray-500 dark:text-gray-400 mb-2">Aucune sauvegarde automatique</p>
              <p class="text-sm text-gray-400 dark:text-gray-500">
                Les sauvegardes se créent automatiquement toutes les 30 minutes
              </p>
            </div>
          `}
        </div>

        <!-- Informations -->
        <div class="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div class="flex items-start">
            <svg class="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div>
              <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Conseils de sauvegarde
              </h4>
              <ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>Exportez régulièrement</strong> vos données vers un fichier</li>
                <li>• <strong>Conservez plusieurs sauvegardes</strong> à différentes dates</li>
                <li>• <strong>Testez la restauration</strong> sur un autre appareil si possible</li>
                <li>• <strong>Les sauvegardes automatiques</strong> sont stockées localement (30 min)</li>
                <li>• <strong>En cas de problème</strong>, utilisez l'import pour restaurer vos données</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private attachEvents() {
    // Retour simple à la page précédente
    this.querySelector('#back-btn')?.addEventListener('click', () => {
      router.goBack();
    });
    // Export
    this.querySelector('#export-btn')?.addEventListener('click', async () => {
      await this.handleExport();
    });

    // Import
    this.querySelector('#import-btn')?.addEventListener('click', () => {
      const input = this.querySelector('#import-input') as HTMLInputElement;
      input?.click();
    });

    this.querySelector('#import-input')?.addEventListener('change', async (e) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (file) {
        await this.handleImport(file);
        input.value = ''; // Reset input
      }
    });

    // Actualiser
    this.querySelector('#refresh-btn')?.addEventListener('click', async () => {
      if (this.isLoading) return;

      const refreshBtn = this.querySelector('#refresh-btn') as HTMLButtonElement | null;
      refreshBtn?.setAttribute('disabled', 'true');
      const originalText = refreshBtn?.innerHTML;

      if (refreshBtn) {
        refreshBtn.innerHTML = `
          <svg class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sauvegarde...`;
      }

      this.isLoading = true;
      this.updateLoadingState();

      try {
        await BackupService.createAutoBackup();
        this.isLoading = false;
        await this.refreshView();
        this.updateLoadingState();
        this.showSuccess('✅ Sauvegarde créée avec succès');
      } catch (error) {
        console.error('Erreur lors de la sauvegarde manuelle:', error);
        this.showError('❌ Impossible de créer une sauvegarde');
      } finally {
        this.isLoading = false;
        this.updateLoadingState();
        const newRefreshBtn = this.querySelector('#refresh-btn') as HTMLButtonElement | null;
        if (newRefreshBtn) {
          newRefreshBtn.removeAttribute('disabled');
          if (originalText) {
            newRefreshBtn.innerHTML = originalText;
          }
        }
      }
    });

    // Restaurer sauvegardes auto
    this.querySelectorAll('.restore-auto-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const index = parseInt((e.target as HTMLElement).closest('button')?.dataset.index || '0');
        await this.handleRestoreAuto(index);
      });
    });
  }

  private async handleExport() {
    if (this.isLoading) return;

    try {
      this.isLoading = true;
      this.updateLoadingState();

      await BackupService.exportBackup();
      
      this.showSuccess('✅ Sauvegarde exportée avec succès !');
    } catch (error) {
      console.error('Erreur export:', error);
      this.showError('❌ Erreur lors de l\'export de la sauvegarde');
    } finally {
      this.isLoading = false;
      this.updateLoadingState();
    }
  }

  private async handleImport(file: File) {
    if (this.isLoading) return;

    const confirmed = confirm(
      '⚠️ ATTENTION !\n\n' +
      'L\'import va remplacer TOUTES vos données actuelles.\n' +
      'Assurez-vous d\'avoir exporté vos données actuelles si nécessaire.\n\n' +
      'Voulez-vous continuer ?'
    );

    if (!confirmed) return;

    try {
      this.isLoading = true;
      this.updateLoadingState();

      await BackupService.importBackup(file);
      
      this.showSuccess('✅ Sauvegarde importée avec succès ! La page va se recharger...');
      
      // La page se rechargera automatiquement dans BackupService.restoreFromBackup
    } catch (error) {
      console.error('Erreur import:', error);
      this.showError('❌ ' + (error as Error).message);
      this.isLoading = false;
      this.updateLoadingState();
    }
  }

  private async handleRestoreAuto(index: number) {
    if (this.isLoading) return;

    const backup = this.autoBackups[index];
    const date = new Date(backup.timestamp);
    
    const confirmed = confirm(
      '⚠️ ATTENTION !\n\n' +
      `Restaurer la sauvegarde du ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')} ?\n\n` +
      'Cette action va remplacer toutes vos données actuelles.\n\n' +
      'Voulez-vous continuer ?'
    );

    if (!confirmed) return;

    try {
      this.isLoading = true;
      this.updateLoadingState();

      await BackupService.restoreAutoBackup(index);
      
      this.showSuccess('✅ Sauvegarde restaurée avec succès ! La page va se recharger...');
    } catch (error) {
      console.error('Erreur restauration auto:', error);
      this.showError('❌ ' + (error as Error).message);
      this.isLoading = false;
      this.updateLoadingState();
    }
  }

  private updateLoadingState() {
    const exportBtn = this.querySelector('#export-btn') as HTMLButtonElement;
    const importBtn = this.querySelector('#import-btn') as HTMLButtonElement;
    
    if (exportBtn) {
      exportBtn.disabled = this.isLoading;
      exportBtn.innerHTML = this.isLoading ? 
        'Export en cours...' : 
        `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
        </svg>
        Télécharger la sauvegarde`;
    }
    
    if (importBtn) {
      importBtn.disabled = this.isLoading;
      importBtn.innerHTML = this.isLoading ? 
        'Import en cours...' : 
        `<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
        Choisir un fichier de sauvegarde`;
    }
  }

  private showSuccess(message: string) {
    this.showToast(message, 'success');
  }

  private showError(message: string) {
    this.showToast(message, 'error');
  }

  private showToast(message: string, type: 'success' | 'error') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
      type === 'success' 
        ? 'bg-green-600 text-white' 
        : 'bg-red-600 text-white'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 5000);
  }
}

customElements.define('backup-manager', BackupManager);
