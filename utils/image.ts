export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.85,
  format: 'jpeg'
};

export function compressImage(
  file: File | Blob,
  options: ImageCompressionOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Impossible de créer le contexte canvas'));
      return;
    }

    img.onload = () => {
      // Calculer les nouvelles dimensions en préservant le ratio
      let { width, height } = img;
      
      if (width > opts.maxWidth || height > opts.maxHeight) {
        const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir en base64
      const mimeType = opts.format === 'jpeg' ? 'image/jpeg' : 
                      opts.format === 'webp' ? 'image/webp' : 'image/png';
      
      const dataURL = canvas.toDataURL(mimeType, opts.quality);
      resolve(dataURL);
    };

    img.onerror = () => {
      reject(new Error('Erreur lors du chargement de l\'image'));
    };

    // Créer une URL pour l'image
    const url = URL.createObjectURL(file);
    img.src = url;
    
    // Nettoyer l'URL après utilisation
    const originalOnLoad = img.onload;
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (originalOnLoad) {
        originalOnLoad.call(img, new Event('load'));
      }
    };
  });
}

export async function captureWithPreview(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let stream: MediaStream | null = null;
    
    try {
      // Demander l'accès à la caméra
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });

      // Créer la modal de prévisualisation
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content max-w-4xl">
          <div class="p-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">📸 Prévisualisation caméra</h3>
              <button type="button" class="btn-icon" id="close-camera">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div class="relative bg-black rounded-lg overflow-hidden mb-4">
              <video id="camera-preview" autoplay playsinline class="w-full h-auto max-h-96 object-contain"></video>
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-64 h-64 border-2 border-white border-dashed rounded-lg opacity-50"></div>
              </div>
            </div>
            
            <div class="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
              Cadrez votre photo et cliquez sur "Capturer" quand vous êtes prêt
            </div>
            
            <div class="flex justify-center gap-4">
              <button type="button" class="btn-secondary" id="cancel-camera">
                ❌ Annuler
              </button>
              <button type="button" class="btn-primary" id="capture-photo">
                📸 Capturer la photo
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Configurer la vidéo
      const video = modal.querySelector('#camera-preview') as HTMLVideoElement;
      video.srcObject = stream;

      // Fonction de nettoyage
      const cleanup = () => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
      };

      // Fonction d'annulation
      const cancelCapture = () => {
        cleanup();
        reject(new Error('Capture annulée par l\'utilisateur'));
      };

      // Fonction de capture
      const capturePhoto = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Impossible de créer le contexte canvas');
          }

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          ctx.drawImage(video, 0, 0);
          
          const dataURL = canvas.toDataURL('image/jpeg', 0.85);
          
          cleanup();
          resolve(dataURL);
        } catch (error) {
          cleanup();
          reject(error);
        }
      };

      // Événements
      modal.querySelector('#close-camera')?.addEventListener('click', cancelCapture);
      modal.querySelector('#cancel-camera')?.addEventListener('click', cancelCapture);
      modal.querySelector('#capture-photo')?.addEventListener('click', capturePhoto);
      
      // Fermer avec clic sur l'overlay
      modal.addEventListener('click', (e) => {
        if (e.target === modal) cancelCapture();
      });

      // Fermer avec Escape
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cancelCapture();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);

      // Gestion des erreurs vidéo
      video.onerror = () => {
        cleanup();
        reject(new Error('Erreur lors de l\'accès à la caméra'));
      };

    } catch (error) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      reject(new Error('Caméra non disponible ou accès refusé'));
    }
  });
}

export function generatePhotoId(): string {
  return `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
