import { getAllStudents } from '../store/students-repo.js';
import { Student } from '../data/schema.js';
import { router } from '../utils/router';

declare global {
  interface Window {
    webkitURL: typeof URL;
  }
}

export class StudentCamera extends HTMLElement {
  private students: Student[] = [];
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private capturedPhoto: string | null = null;
  private fileInput: HTMLInputElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private selectedStudentId: string | null = null;

  connectedCallback() {
    this.loadStudents();
  }

  disconnectedCallback() {
    this.stopCamera();
  }

  private async loadStudents() {
    try {
      this.students = await getAllStudents();
      this.render();
    } catch (error) {
      console.error('Erreur chargement élèves:', error);
      this.renderError();
    }
  }

  private stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  private showError(message: string): void {
    console.error(message);
    const errorElement = this.querySelector('#error-message');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove('hidden');
      setTimeout(() => {
        errorElement.classList.add('hidden');
      }, 5000);
    }
  }

  private showSuccess(): void {
    const successElement = this.querySelector('#success-message');
    if (successElement) {
      successElement.classList.remove('hidden');
      setTimeout(() => {
        successElement.classList.add('hidden');
      }, 3000);
    }
  }

  private render(): void {
    try {
      // Si on a une photo capturée, afficher l'aperçu
      if (this.capturedPhoto) {
        this.innerHTML = this.renderPhotoReview();
      } 
      // Si un élève est sélectionné, afficher la caméra
      else if (this.selectedStudentId) {
        this.innerHTML = this.renderCameraView();
        // Initialiser la caméra uniquement si un élève est sélectionné
        this.initializeCamera().catch(console.error);
      }
      // Sinon, afficher la sélection d'élève
      else {
        this.innerHTML = `
          <div id="student-selection-view" class="bg-white dark:bg-gray-900 min-h-screen">
            <div class="max-w-5xl mx-auto min-h-screen flex flex-col">
              <header class="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
                <button id="back-btn" class="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 transition-colors">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Retour</span>
                </button>
                <h1 class="text-lg font-semibold text-gray-900 dark:text-white">Mode élève</h1>
                <span class="text-sm text-gray-400 dark:text-gray-500">Trombinoscope</span>
              </header>
              <main class="flex-1 px-4 py-6">
                ${this.renderStudentSelection()}
              </main>
            </div>
          </div>`;
      }
      
      // Mettre en place les écouteurs d'événements
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Erreur lors du rendu:', error);
      this.renderError();
    }
  }

  private renderError(): void {
    this.innerHTML = `
      <div class="p-4 text-red-600">
        <p>Erreur lors du chargement des données. Veuillez réessayer plus tard.</p>
      </div>`;
  }

  private renderPhotoReview(): string {
    if (!this.capturedPhoto) return '';
    const selectedStudent = this.students.find(s => s.id === this.selectedStudentId);
    const studentName = selectedStudent ? `${selectedStudent.prenom} ${selectedStudent.nom}` : 'Élève';
    
    return `
      <div class="bg-white dark:bg-gray-900 min-h-screen">
        <div class="max-w-5xl mx-auto min-h-screen flex flex-col">
          <header class="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
            <button id="back-btn" class="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Retour</span>
            </button>
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">Aperçu de la photo</h1>
            <span class="text-sm text-gray-400 dark:text-gray-500">${studentName}</span>
          </header>
          <main class="flex-1 px-4 py-6 space-y-6">
            <div class="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center aspect-[3/4] sm:aspect-[4/3] overflow-hidden">
              <img src="${this.capturedPhoto}" alt="Aperçu de la photo" class="h-full w-full object-contain" />
            </div>
            <div class="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:justify-center">
              <button id="retake-btn" class="px-6 py-2 rounded-full bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Reprendre
              </button>
              <button id="save-btn" class="px-6 py-2 rounded-full bg-green-500 text-sm font-medium text-white shadow-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Enregistrer
              </button>
            </div>
          </main>
        </div>
      </div>`;
  }

  private renderStudentSelection(): string {
    if (this.students.length === 0) {
      return `
        <div class="p-4 text-center">
          <p class="text-red-500">Aucun élève trouvé. Veuillez réessayer plus tard.</p>
          <button id="retry-btn" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Réessayer
          </button>
        </div>`;
    }

    return `
      <div class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Sélectionnez un élève</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          ${this.students.map(student => {
            const portrait = student.photo || student.avatar || '';
            const initials = `${student.prenom.charAt(0)}${student.nom.charAt(0)}`;
            return `
              <div class="group relative cursor-pointer" data-student-id="${student.id}" id="student-${student.id}">
                <input type="radio" id="student-radio-${student.id}" name="student-selection" class="sr-only" value="${student.id}">
                <label for="student-radio-${student.id}" class="block cursor-pointer">
                <div class="relative w-full pb-[135%] overflow-hidden rounded-3xl shadow-md border border-transparent transition-all duration-200 group-hover:shadow-xl group-hover:border-blue-200 dark:group-hover:border-blue-500" role="button" tabindex="0">
                  ${portrait ? `
                    <img src="${portrait}" alt="Portrait de ${student.prenom} ${student.nom}" class="absolute inset-0 h-full w-full object-cover" />
                  ` : `
                    <div class="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 text-white">
                      <span class="text-3xl font-semibold">${initials}</span>
                    </div>
                  `}
                  <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 py-2">
                    <p class="text-sm font-medium text-white leading-tight">${student.prenom}</p>
                    <p class="text-[11px] uppercase tracking-wide text-white/80">${student.nom}</p>
                  </div>
                  <div class="absolute inset-0 rounded-3xl ring-0 ring-blue-400/0 group-hover:ring-4 group-hover:ring-blue-400/40 dark:group-hover:ring-blue-500/40 transition"></div>
                </div>
                </label>
              </div>
            `;
          }).join('')}
        </div>
      </div>`;
  }

  private renderCameraView(): string {
    // Récupérer les informations de l'élève sélectionné
    const selectedStudent = this.students.find(s => s.id === this.selectedStudentId);
    const studentName = selectedStudent ? `${selectedStudent.prenom} ${selectedStudent.nom}` : 'Élève sélectionné';
    
    return `
      <div class="bg-white dark:bg-gray-900 min-h-screen">
        <div class="max-w-5xl mx-auto min-h-screen flex flex-col">
          <header class="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
            <button id="back-btn" class="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Retour</span>
            </button>
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">Prendre une photo</h1>
            <span class="text-sm text-gray-400 dark:text-gray-500">${studentName}</span>
          </header>
          <main class="flex-1 px-4 py-6 space-y-6">
            <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-300">
              <p class="font-medium text-gray-900 dark:text-white">Élève sélectionné : ${studentName}</p>
              <button id="back-to-students" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
                Changer d'élève
              </button>
            </div>
            <div class="relative rounded-2xl bg-black overflow-hidden aspect-[3/4] sm:aspect-[4/3]">
              <video 
                id="camera-preview" 
                class="w-full h-full object-cover"
                autoplay
                muted
                playsinline
                webkit-playsinline
                x-webkit-airplay="allow"
                x5-video-player-type="h5"
                x5-video-player-fullscreen="true"
                x5-video-orientation="portrait"
              ></video>
              <div id="camera-error" class="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-center px-6 py-4 hidden">
                <p>La caméra n'est pas disponible. Vérifiez les permissions ou utilisez le bouton ci-dessous pour importer une photo.</p>
              </div>
              <div id="camera-loading" class="absolute inset-0 flex items-center justify-center bg-black/30 hidden">
                <div class="animate-spin rounded-full h-10 w-10 border-2 border-white/70 border-t-transparent"></div>
              </div>
            </div>
            <div class="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
              <button id="capture-btn" class="px-6 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition-colors">
                Prendre la photo
              </button>
              <button id="upload-btn" class="px-6 py-3 rounded-full bg-white text-blue-600 font-semibold border border-blue-200 shadow-sm hover:bg-blue-50 transition-colors">
                Importer une image
              </button>
            </div>
          </main>
          <div id="error-message" class="fixed bottom-4 left-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg hidden"></div>
          <div id="success-message" class="fixed bottom-4 left-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg hidden">
            Photo enregistrée avec succès !
          </div>
        </div>
      </div>`;
  }

  private capturePhoto(): void {
    if (!this.video) {
      this.showError("La caméra n'est pas prête. Veuillez réessayer.");
      return;
    }
    
    // Créer un canvas temporaire si nécessaire
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
    }

    const width = this.video.videoWidth || this.video.clientWidth;
    const height = this.video.videoHeight || this.video.clientHeight;

    if (!width || !height) {
      this.showError("La caméra n'est pas encore prête. Patientez un instant puis réessayez.");
      return;
    }

    this.canvas.width = width;
    this.canvas.height = height;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    
    // Dessiner l'image de la vidéo sur le canvas
    ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    
    // Convertir en base64
    this.capturedPhoto = this.canvas.toDataURL('image/jpeg', 0.9);
    
    // Mettre à jour l'affichage
    this.render();
  }

  private async savePhoto(): Promise<void> {
    console.group('savePhoto');
    console.log('Début de la sauvegarde de la photo...');
    
    if (!this.capturedPhoto) {
      console.error('Aucune photo capturée');
      this.showError("Aucune photo à enregistrer.");
      return;
    }
    
    if (!this.selectedStudentId) {
      console.error('Aucun élève sélectionné');
      this.showError("Aucun élève sélectionné.");
      return;
    }
    
    try {
      console.log('Chargement du module temp-photos...');
      const tempPhotosModule = await import('../store/temp-photos.js');
      console.log('Module temp-photos chargé:', Object.keys(tempPhotosModule));
      
      // Vérifier que la fonction existe
      if (typeof tempPhotosModule.saveTemporaryPhoto !== 'function') {
        throw new Error('La fonction saveTemporaryPhoto n\'existe pas dans le module');
      }
      
      console.log('Sauvegarde de la photo pour l\'élève:', this.selectedStudentId);
      console.log('Taille de la photo:', this.capturedPhoto.length, 'caractères');
      
      // Sauvegarder la photo temporaire
      const photoId = await tempPhotosModule.saveTemporaryPhoto({
        studentId: this.selectedStudentId,
        imageData: this.capturedPhoto,
        timestamp: Date.now(),
        description: 'Photo en attente d\'attribution'
      });
      
      console.log('Photo sauvegardée avec ID:', photoId);
      
      // Vérifier que la photo a bien été sauvegardée
      const savedPhoto = await tempPhotosModule.getTemporaryPhoto(photoId);
      console.log('Photo récupérée après sauvegarde:', savedPhoto ? 'succès' : 'échec');
      
      if (!savedPhoto) {
        throw new Error('La photo n\'a pas pu être récupérée après la sauvegarde');
      }
      
      // Compter les photos temporaires
      const allPhotos = await tempPhotosModule.getTemporaryPhotos();
      console.log('Nombre total de photos temporaires:', allPhotos.length);
      
      // Afficher un message de succès
      this.showSuccess();
      
      // Déclencher un événement pour mettre à jour le compteur
      console.log('Déclenchement de l\'événement temp-photos-updated');
      const event = new CustomEvent('temp-photos-updated', { detail: { count: allPhotos.length } });
      document.dispatchEvent(event);
      
      // Réinitialiser après la sauvegarde
      this.capturedPhoto = null;
      this.selectedStudentId = null;
      this.render();
      
      // Rediriger vers la page d'accueil après un court délai
      console.log('Préparation de la redirection vers la page d\'accueil...');
      console.log('État du router:', router ? 'disponible' : 'indisponible');
      
      // Utiliser une promesse pour s'assurer que le rendu est terminé
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Exécution de la redirection...');
      try {
        if (router && typeof router.navigateTo === 'function') {
          console.log('Appel de router.navigateTo({ name: \'home\' })');
          router.navigateTo({ name: 'home' });
          console.log('Redirection effectuée avec succès');
        } else {
          console.error('Impossible de rediriger: router.navigateTo non disponible');
          console.log('Méthode de secours: utilisation de window.location.hash');
          window.location.hash = '/home';
        }
      } catch (error) {
        console.error('Erreur lors de la redirection:', error);
        // Méthode de secours
        window.location.hash = '/home';
      }
      
    } catch (error: unknown) {
      console.error('Erreur lors de la sauvegarde de la photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible de sauvegarder la photo';
      this.showError(`Erreur: ${errorMessage}`);
    } finally {
      console.groupEnd();
    }
  }

  private setupFileInput(): HTMLInputElement {
    // Supprimer l'ancien input file s'il existe
    if (this.fileInput) {
      document.body.removeChild(this.fileInput);
      this.fileInput = null;
    }
    
    // Créer un nouvel input file
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/*';
    if ('capture' in this.fileInput) {
      (this.fileInput as any).capture = 'environment';
    }
    this.fileInput.style.display = 'none';
    
    // Ajouter l'input au body
    document.body.appendChild(this.fileInput);
    
    // Gérer la sélection de fichier
    this.fileInput.addEventListener('change', (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (event.target?.result) {
            this.capturedPhoto = event.target.result as string;
            this.render();
          }
        };
        
        reader.readAsDataURL(file);
      }
    });
    
    return this.fileInput;
  }
  
  private async initializeCamera(): Promise<void> {
    try {
      // Vérifier si l'API est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'API de la caméra n'est pas disponible sur cet appareil");
      }
      
      // Arrêter le flux existant s'il y en a un
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      // Configuration pour la caméra arrière par défaut
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Initialiser this.video s'il n'existe pas encore
      if (!this.video) {
        this.video = this.querySelector('#camera-preview');
      }
      
      if (this.video) {
        this.video.srcObject = this.stream;
        this.video.setAttribute('playsinline', 'true');
        this.video.setAttribute('autoplay', 'true');
        this.video.setAttribute('muted', 'true');
        this.video.setAttribute('webkit-playsinline', 'true');
        
        const loadingElement = this.querySelector('#camera-loading');
        if (loadingElement) {
          loadingElement.classList.remove('hidden');
        }

        // Attendre que la vidéo soit prête
        await new Promise<void>((resolve) => {
          const onPlaying = () => {
            if (this.video) {
              this.video.removeEventListener('playing', onPlaying);
            }
            if (loadingElement) {
              loadingElement.classList.add('hidden');
            }
            resolve();
          };
          
          if (this.video) {
            this.video.addEventListener('playing', onPlaying);
            this.video.play().catch(e => {
              console.error('Erreur lecture vidéo:', e);
              this.showError("Impossible de démarrer la caméra. Vérifiez les permissions.");
              if (loadingElement) {
                loadingElement.classList.add('hidden');
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Erreur initialisation caméra:', error);
      this.showError("Impossible d'accéder à la caméra. Vérifiez les permissions ou utilisez le bouton d'import.");
      
      // Afficher le message d'erreur dans l'interface
      const errorElement = this.querySelector('#camera-error');
      if (errorElement) {
        errorElement.classList.remove('hidden');
      }
    }
  }
  
  private setupEventListeners(): void {
    // Gestionnaire pour la sélection d'élève
    const studentSelection = this.querySelectorAll('[data-student-id]');
    studentSelection.forEach(el => {
      el.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const studentId = target.getAttribute('data-student-id');
        if (studentId) {
          this.selectedStudentId = studentId;
          this.render();
        }
      });
    });

    // Gestionnaire pour le bouton de retour à la sélection
    const backToStudentsBtn = this.querySelector('#back-to-students');
    if (backToStudentsBtn) {
      backToStudentsBtn.addEventListener('click', () => {
        this.selectedStudentId = null;
        this.render();
      });
    }

    // Gestionnaire pour le bouton de réessai
    const retryBtn = this.querySelector('#retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => this.loadStudents());
    }

    // Gestionnaire pour le bouton de capture
    const captureBtn = this.querySelector('#capture-btn');
    if (captureBtn) {
      captureBtn.addEventListener('click', () => this.capturePhoto());
    }
    
    // Gestionnaire pour le bouton d'import
    const uploadBtn = this.querySelector('#upload-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        const input = this.setupFileInput();
        if (input) input.click();
      });
    }
    
    // Gestionnaire pour le bouton de reprise
    const retakeBtn = this.querySelector('#retake-btn');
    if (retakeBtn) {
      retakeBtn.addEventListener('click', () => {
        this.capturedPhoto = null;
        this.render();
      });
    }
    
    // Gestionnaire pour le bouton de sauvegarde
    const saveBtn = this.querySelector('#save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.savePhoto());
    }
    
    // Gestionnaire pour le bouton de retour
    const backBtn = this.querySelector('#back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.stopCamera();
        if (router && typeof router.navigateTo === 'function') {
          router.navigateTo({ name: 'home' });
        }
      });
    }
  }
}

// Enregistrer le composant personnalisé
if (!customElements.get('student-camera')) {
  customElements.define('student-camera', StudentCamera);
}
