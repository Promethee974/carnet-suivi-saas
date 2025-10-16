# 📸 GUIDE - Option C : Gestion des Photos

## État actuel

✅ **Backend** : Routes API photos prêtes
✅ **Frontend** : Service `photos-api.ts` prêt
⏳ **En cours** : Intégration dans `student-detail-api.ts`

---

## Modifications à faire dans `student-detail-api.ts`

### 1. Importer le service photos (ligne 6)

```typescript
import { router } from '../utils/router.js';
import { studentsApi, Student } from '../services/students-api.js';
import { photosApi, Photo } from '../services/photos-api.js';  // AJOUTER CETTE LIGNE
```

### 2. Supprimer l'interface Photo locale (lignes 8-14)

**Supprimer** :
```typescript
interface Photo {
  id: string;
  studentId: string;
  url: string;
  description?: string;
  createdAt: string;
}
```

L'interface `Photo` vient maintenant de `photos-api.ts`

### 3. Charger les photos dans `loadStudent()` (lignes 40-54)

**Remplacer** :
```typescript
try {
  this.student = await studentsApi.getById(this.studentId);

  // TODO: Charger les photos quand l'API sera prête
  // this.photos = await photosApi.getByStudentId(this.studentId);

  this.isLoading = false;
  this.render();
  this.attachEventListeners();
} catch (error) {
  console.error('[StudentDetailAPI] Erreur...');
  this.isLoading = false;
  this.renderError('Impossible de charger...');
}
```

**Par** :
```typescript
try {
  // Charger les données de l'élève
  this.student = await studentsApi.getById(this.studentId);

  // Charger les photos de l'élève
  try {
    this.photos = await photosApi.getByStudent(this.studentId);
    console.log('[StudentDetailAPI] Photos chargées:', this.photos.length);
  } catch (photoError) {
    console.error('[StudentDetailAPI] Erreur photos:', photoError);
    this.photos = []; // Ne pas bloquer si les photos ne chargent pas
  }

  this.isLoading = false;
  this.render();
  this.attachEventListeners();
} catch (error) {
  console.error('[StudentDetailAPI] Erreur...');
  this.isLoading = false;
  this.renderError('Impossible de charger...');
}
```

### 4. Modifier `renderPhotosTab()` pour afficher les photos

**Trouver la section avec les photos** (dans le grid) et **remplacer** :
```typescript
<img src="${photo.url}" alt="${photo.description || 'Photo'}" ...>
```

**Par** :
```typescript
<img src="${photo.s3Url}" alt="${photo.caption || 'Photo'}" ...>
```

### 5. Ajouter overlay et actions sur les photos

Dans `renderPhotosTab()`, dans le `map` des photos, **ajouter** après l'img :

```typescript
<!-- Overlay au survol -->
<div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
  <div class="flex gap-2">
    <button
      data-photo-id="${photo.id}"
      data-photo-url="${photo.s3Url}"
      class="view-photo-btn p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
      title="Voir en grand"
    >
      <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
    </button>
    <button
      data-photo-id="${photo.id}"
      class="delete-photo-btn p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
      title="Supprimer"
    >
      <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
      </svg>
    </button>
  </div>
</div>

${photo.caption ? `
  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
    <p class="text-white text-xs truncate">${photo.caption}</p>
  </div>
` : ''}
```

Et ajouter `group relative` aux classes du div parent de l'image.

### 6. Ajouter event listeners pour les photos

Dans `attachEventListeners()`, **ajouter** :

```typescript
// Voir photo en grand
this.querySelectorAll('.view-photo-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const photoUrl = (e.currentTarget as HTMLElement).dataset.photoUrl!;
    this.showPhotoModal(photoUrl);
  });
});

// Supprimer photo
this.querySelectorAll('.delete-photo-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const photoId = (e.currentTarget as HTMLElement).dataset.photoId!;
    await this.handleDeletePhoto(photoId);
  });
});
```

### 7. Ajouter les méthodes de gestion des photos

**À la fin de la classe**, ajouter :

```typescript
private showPhotoModal(photoUrl: string) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <button id="close-photo-modal" class="absolute top-4 right-4 text-white hover:text-gray-300">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
    <img src="${photoUrl}" alt="Photo" class="max-w-full max-h-full object-contain">
  `;

  const closeModal = () => document.body.removeChild(modal);
  modal.addEventListener('click', closeModal);
  modal.querySelector('#close-photo-modal')?.addEventListener('click', closeModal);

  document.body.appendChild(modal);
}

private async handleDeletePhoto(photoId: string) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
    return;
  }

  try {
    await photosApi.delete(photoId);
    // Recharger les photos
    this.photos = await photosApi.getByStudent(this.studentId);
    // Re-render uniquement l'onglet photos
    const tabContent = this.querySelector('#tab-content');
    if (tabContent) {
      tabContent.innerHTML = this.renderPhotosTab();
      this.attachEventListeners();
    }
  } catch (error) {
    console.error('[StudentDetailAPI] Erreur suppression photo:', error);
    alert('Erreur lors de la suppression de la photo');
  }
}
```

### 8. Ajouter l'upload de photos (bonus)

Pour le bouton "Ajouter une photo", créer une méthode :

```typescript
private showUploadModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4">Ajouter une photo</h2>
      <form id="upload-photo-form">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Photo
          </label>
          <input
            type="file"
            id="photo-input"
            accept="image/*"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Légende (optionnel)
          </label>
          <input
            type="text"
            id="caption-input"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Description de la photo..."
          />
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            id="cancel-upload-btn"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            Uploader
          </button>
        </div>
      </form>
      <div id="upload-progress" class="mt-4 hidden">
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div id="progress-bar" class="bg-indigo-600 h-2 rounded-full" style="width: 0%"></div>
        </div>
        <p class="text-sm text-gray-600 mt-2 text-center">Upload en cours...</p>
      </div>
    </div>
  `;

  const closeModal = () => document.body.removeChild(modal);

  modal.querySelector('#cancel-upload-btn')?.addEventListener('click', closeModal);

  modal.querySelector('#upload-photo-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = modal.querySelector('#photo-input') as HTMLInputElement;
    const captionInput = modal.querySelector('#caption-input') as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) return;

    // Afficher la barre de progression
    modal.querySelector('#upload-progress')?.classList.remove('hidden');

    try {
      // Upload de la photo
      await photosApi.upload(file, this.studentId, undefined, captionInput.value || undefined);

      // Recharger les photos
      this.photos = await photosApi.getByStudent(this.studentId);

      closeModal();

      // Re-render l'onglet photos
      const tabContent = this.querySelector('#tab-content');
      if (tabContent) {
        tabContent.innerHTML = this.renderPhotosTab();
        this.attachEventListeners();
      }
    } catch (error) {
      console.error('[StudentDetailAPI] Erreur upload photo:', error);
      alert('Erreur lors de l\'upload de la photo');
      modal.querySelector('#upload-progress')?.classList.add('hidden');
    }
  });

  document.body.appendChild(modal);
}
```

Et dans `attachEventListeners()`, modifier le bouton "Ajouter une photo" :

```typescript
const addPhotoBtn = this.querySelector('#add-photo-btn');
addPhotoBtn?.addEventListener('click', () => {
  this.showUploadModal();
});
```

---

## 🧪 Tests à faire

1. **Affichage des photos** : Vérifier que les photos s'affichent dans la galerie
2. **Voir en grand** : Cliquer sur l'œil pour voir la photo en modal
3. **Supprimer** : Cliquer sur la poubelle pour supprimer une photo
4. **Upload** : Cliquer sur "Ajouter une photo" et uploader une image
5. **Légende** : Vérifier que les légendes s'affichent

---

## 📝 Fichiers concernés

- ✅ `backend/src/modules/photos/photos.routes.ts` - Routes API (déjà fait)
- ✅ `frontend/src/services/photos-api.ts` - Service API (déjà fait)
- ⏳ `frontend/src/components/student-detail-api.ts` - À modifier (ce guide)

---

## 🚀 Prochaine session

Une fois l'Option C terminée, vous pourrez :
- Option D : Backup/Restore
- Option E : Optimisations & Polish
- Option F : Carnet de Suivi complet
- Option G : Multi-organisation

**Bon développement ! 🎉**
