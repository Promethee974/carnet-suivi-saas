import { Photo } from '../data/schema.js';
import { compressImage, captureWithPreview, generatePhotoId } from '../utils/image.js';

export class PhotoGallery extends HTMLElement {
  private photos: Photo[] = [];
  private _skillId: string = '';
  private onPhotoAdd?: (photo: Photo) => void;
  private onPhotoRemove?: (photoId: string) => void;
  
  get skillId(): string {
    return this._skillId;
  }

  constructor() {
    super();
    this.render();
  }

  static get observedAttributes() {
    return ['skill-id'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'skill-id' && newValue !== oldValue) {
      this._skillId = newValue;
    }
  }

  setPhotos(photos: Photo[]) {
    this.photos = photos;
    this.render();
  }

  setCallbacks(onAdd: (photo: Photo) => void, onRemove: (photoId: string) => void) {
    this.onPhotoAdd = onAdd;
    this.onPhotoRemove = onRemove;
  }

  private render() {
    this.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Photos (${this.photos.length})
          </h4>
          <div class="flex gap-2">
            <button type="button" class="btn-icon" id="add-from-camera" title="Prendre une photo">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </button>
            <button type="button" class="btn-icon" id="add-from-gallery" title="Choisir une photo">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </button>
          </div>
        </div>
        
        ${this.photos.length > 0 ? `
          <div class="photo-grid">
            ${this.photos.map(photo => `
              <div class="space-y-1" data-photo-id="${photo.id}">
                <div class="photo-thumbnail group relative">
                  <img src="${photo.dataURL}" alt="${photo.caption || 'Photo'}" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <div class="opacity-0 group-hover:opacity-100 flex gap-1">
                      <button type="button" class="btn-icon bg-white text-gray-700 hover:bg-gray-100" data-action="view" data-photo-id="${photo.id}" title="Voir en grand">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                      </button>
                      <button type="button" class="btn-icon bg-red-500 text-white hover:bg-red-600" data-action="delete" data-photo-id="${photo.id}" title="Supprimer">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                ${photo.caption ? `<p class="text-xs text-gray-600 dark:text-gray-400 leading-snug">${photo.caption}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
            Aucune photo ajoutée
          </div>
        `}
      </div>
      
      <input type="file" id="file-input" accept="image/*" style="display: none;">
    `;

    this.attachEventListeners();
  }

  private attachEventListeners() {
    const addFromCamera = this.querySelector('#add-from-camera');
    const addFromGallery = this.querySelector('#add-from-gallery');
    const fileInput = this.querySelector('#file-input') as HTMLInputElement;

    addFromCamera?.addEventListener('click', () => this.handleCameraCapture());
    addFromGallery?.addEventListener('click', () => fileInput.click());
    fileInput?.addEventListener('change', (e) => this.handleFileSelect(e));

    // Event delegation pour les actions sur les photos
    this.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('[data-action]') as HTMLElement;
      
      if (button) {
        const action = button.dataset.action;
        const photoId = button.dataset.photoId;
        
        if (action === 'view' && photoId) {
          this.viewPhoto(photoId, e);
        } else if (action === 'delete' && photoId) {
          this.deletePhoto(photoId);
        }
      }
    });
  }

  private async handleCameraCapture() {
    try {
      const dataURL = await captureWithPreview();
      await this.previewAndConfirmPhoto(dataURL);
    } catch (error) {
      console.error('Erreur capture caméra:', error);
      if (error instanceof Error && error.message.includes('annulé')) {
        // L'utilisateur a annulé, ne pas afficher d'erreur
        return;
      }
      alert('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
    }
  }

  private async handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      try {
        const dataURL = await compressImage(file);
        await this.previewAndConfirmPhoto(dataURL);
      } catch (error) {
        console.error('Erreur compression image:', error);
        alert('Erreur lors du traitement de l\'image.');
      }
    }
    
    input.value = ''; // Reset input
  }

  private async previewAndConfirmPhoto(dataURL: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Créer une modal de prévisualisation
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content max-w-2xl">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Prévisualisation de la photo</h3>
              <button type="button" class="btn-icon" id="close-preview">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div class="mb-6">
              <img src="${dataURL}" alt="Prévisualisation" class="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-200 dark:border-gray-600">
            </div>
            
            <div class="mb-4">
              <label for="photo-caption" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Légende (optionnelle)
              </label>
              <input 
                type="text" 
                id="photo-caption" 
                class="input" 
                placeholder="Ajouter une description à cette photo..."
                maxlength="200"
              />
            </div>
            
            <div class="flex justify-end gap-3">
              <button type="button" class="btn-secondary" id="cancel-photo">
                ❌ Annuler
              </button>
              <button type="button" class="btn-primary" id="confirm-photo">
                ✅ Ajouter la photo
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Gestion des événements
      const closePreview = () => {
        document.body.removeChild(modal);
        reject(new Error('Annulé par l\'utilisateur'));
      };

      const confirmPhoto = async () => {
        const captionInput = modal.querySelector('#photo-caption') as HTMLInputElement;
        const caption = captionInput.value.trim();
        
        document.body.removeChild(modal);
        await this.addPhoto(dataURL, caption);
        resolve();
      };

      modal.querySelector('#close-preview')?.addEventListener('click', closePreview);
      modal.querySelector('#cancel-photo')?.addEventListener('click', closePreview);
      modal.querySelector('#confirm-photo')?.addEventListener('click', confirmPhoto);
      
      // Fermer avec clic sur l'overlay
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closePreview();
      });

      // Fermer avec Escape
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closePreview();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);

      // Focus sur le champ de légende
      setTimeout(() => {
        const captionInput = modal.querySelector('#photo-caption') as HTMLInputElement;
        captionInput?.focus();
      }, 100);
    });
  }

  private async addPhoto(dataURL: string, caption?: string) {
    const photo: Photo = {
      id: generatePhotoId(),
      dataURL,
      createdAt: Date.now(),
      caption: caption || undefined
    };

    this.photos.push(photo);
    this.render();
    
    if (this.onPhotoAdd) {
      this.onPhotoAdd(photo);
    }
  }

  private viewPhoto(photoId: string, event?: Event) {
    // Empêcher la propagation de l'événement pour éviter les déclenchements multiples
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Vérifier si une modale est déjà ouverte
    if (document.querySelector('.modal-overlay')) {
      return;
    }

    const photo = this.photos.find(p => p.id === photoId);
    if (!photo) return;

    // Créer une modal pour afficher la photo en grand
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content max-w-4xl">
        <div class="p-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Photo</h3>
            <button type="button" class="btn-icon" id="close-modal">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <img src="${photo.dataURL}" alt="Photo" class="w-full h-auto max-h-[70vh] object-contain rounded-lg">
          <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Ajoutée le ${new Date(photo.createdAt).toLocaleString('fr-FR')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Fermer la modal
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector('#close-modal')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
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

  /**
   * Trouve une photo temporaire correspondant à une photo de la galerie
   * En comparant les données d'image (puisque les IDs sont différents)
   */
  private async findTemporaryPhoto(photoId: string) {
    const photo = this.photos.find(p => p.id === photoId);
    if (!photo) return null;

    try {
      const { getTemporaryPhotos } = await import('../store/temp-photos.js');
      const tempPhotos = await getTemporaryPhotos();
      
      // Trouver une photo temporaire avec les mêmes données d'image
      return tempPhotos.find(temp => temp.imageData === photo.dataURL) || null;
    } catch (error) {
      console.error('Erreur lors de la recherche de la photo temporaire:', error);
      return null;
    }
  }

  private async deletePhoto(photoId: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      return;
    }

    // Supprimer la photo de la liste locale
    this.photos = this.photos.filter(p => p.id !== photoId);
    this.render();
    
    // Notifier le composant parent
    if (this.onPhotoRemove) {
      this.onPhotoRemove(photoId);
    }

    // Essayer de supprimer la photo temporaire correspondante
    try {
      const tempPhoto = await this.findTemporaryPhoto(photoId);
      if (tempPhoto) {
        const { deleteTemporaryPhoto } = await import('../store/temp-photos.js');
        await deleteTemporaryPhoto(tempPhoto.id!);
        console.log('Photo temporaire supprimée avec succès');
        // Déclencher un événement pour mettre à jour le compteur
        document.dispatchEvent(new CustomEvent('temp-photos-updated'));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la photo temporaire:', error);
    }
  }
}

customElements.define('photo-gallery', PhotoGallery);
