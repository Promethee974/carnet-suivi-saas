# Application Multi-Élèves - Carnet de Suivi GS

## 🎯 Vue d'Ensemble

L'application **Carnet de Suivi GS** a été étendue pour devenir une **application multi-élèves** complète, permettant aux enseignants de gérer plusieurs carnets de suivi simultanément tout en conservant toutes les fonctionnalités existantes.

## 🚀 Nouvelles Fonctionnalités

### 📋 Gestion Multi-Élèves
- **Liste des élèves** avec recherche et tri
- **Fiche individuelle** par élève avec avatar
- **Navigation fluide** entre liste et détail
- **Import CSV français** pour ajouter plusieurs élèves

### 🗂️ Organisation des Données
- **Base d'élèves** centralisée (IndexedDB)
- **Carnets dédiés** par élève
- **Isolation complète** des données entre élèves
- **Sauvegarde automatique** par élève

### 🔄 Import/Export Avancé
- **Import CSV français** (séparateur `;`, dates `DD/MM/YYYY`)
- **Export individuel** par élève (JSON + photos)
- **Import de carnet** vers un élève existant
- **Sauvegarde complète** de tous les élèves

## 📊 Structure des Données

### Types Principaux
```typescript
type Student = {
  id: ID;
  nom: string;
  prenom: string;
  sexe?: 'F'|'M'|'Autre'|'ND';
  naissance?: string; // ISO 'YYYY-MM-DD'
  avatar?: string;    // dataURL
  createdAt: number;
  updatedAt: number;
};

type Carnet = {
  studentId: ID;
  meta: Meta;
  skills: Record<string, SkillEntry>;
  synthese: Synthese;
  progress?: Record<string, { acquired: number; total: number }>;
};
```

### Base de Données IndexedDB
- **`students`** : Fiches élèves avec index sur nom et date de création
- **`carnets`** : Carnets par élève avec index sur studentId
- **`photos`** : Photos partagées avec index temporel
- **`settings`** : Paramètres globaux de l'application

## 🧭 Système de Routage

### Routes Disponibles
- **`#/`** : Liste des élèves
- **`#/student/{id}`** : Détail d'un élève
- **`#/student/{id}/print`** : Impression du carnet

### Navigation
```typescript
// Navigation programmatique
router.goToStudentsList();
router.goToStudentDetail(studentId);
router.goToStudentPrint(studentId);

// Écoute des changements
router.onRouteChange((route) => {
  // Réagir aux changements de route
});
```

## 📁 Architecture des Composants

### Nouveaux Composants
- **`students-list.ts`** : Liste des élèves avec recherche/tri
- **`student-detail.ts`** : Vue détaillée d'un élève
- **`router.ts`** : Système de routage SPA

### Composants Adaptés
- **`stats-summary.ts`** : Statistiques par élève
- **`domain-card.ts`** : Domaines avec studentId
- **`skill-item.ts`** : Compétences liées à un élève
- **`photo-gallery.ts`** : Photos par élève/compétence

## 📥 Import CSV Français

### Format Attendu
```csv
Unnamed: 0;NOM;Prénom;Sexe;Date de naissance
1;MARTIN;Emma;F;15/09/2018
2;DUBOIS;Lucas;M;22/03/2019
3;BERNARD;Léa;F;08/11/2018
```

### Fonctionnalités
- **Séparateur `;`** (standard français)
- **Dates DD/MM/YYYY** avec conversion automatique
- **Gestion des erreurs** ligne par ligne
- **Rapport d'import** détaillé
- **Validation** des données obligatoires

### Utilisation
```typescript
const result = await importStudentsFromCSV(csvContent);
console.log(`${result.imported} élèves importés`);
console.log(`${result.errors.length} erreurs`);
```

## 🔧 API Multi-Élèves

### Gestion des Élèves
```typescript
// CRUD Élèves
const students = await getAllStudents();
const student = await getStudent(id);
const newStudent = await createStudent(data);
const updated = await updateStudent(id, updates);
await deleteStudent(id);

// Recherche et tri
const filtered = await searchStudents(query);
const sorted = sortStudents(students, 'nom'|'prenom'|'createdAt');
```

### Gestion des Carnets
```typescript
// Carnet par élève
const carnet = await getCarnet(studentId);
const initialized = await initializeCarnet(studentId, student);
await saveCarnet(carnet);

// Compétences par élève
await updateSkill(studentId, skillId, updates);
await addPhotoToSkill(studentId, skillId, photo);
await removePhotoFromSkill(studentId, skillId, photoId);
```

### Export/Import
```typescript
// Export individuel
const data = await exportStudentData(studentId);

// Import vers élève existant
await importStudentData(data, targetStudentId);
```

## 🎨 Interface Utilisateur

### Vue Liste
- **Cartes élèves** avec avatar, nom, âge, sexe
- **Barre de recherche** en temps réel
- **Tri** par nom, prénom, ou date d'ajout
- **Actions rapides** : éditer, supprimer
- **Import CSV** et ajout manuel

### Vue Détail
- **Navigation** avec breadcrumb
- **Informations élève** en en-tête
- **Tableau de bord** statistiques personnalisé
- **Domaines de compétences** identiques à l'ancienne version
- **Actions** : synthèse, export, impression

### Fonctionnalités Conservées
- ✅ **Photos par compétence** avec galerie
- ✅ **Observations textuelles** détaillées
- ✅ **États NA/EC/A** avec progression visuelle
- ✅ **Thème clair/sombre** persistant
- ✅ **PWA offline-first** avec service worker
- ✅ **Impression PDF** optimisée
- ✅ **Domaine transversal** optionnel

## 🔄 Migration des Données

### Compatibilité Ascendante
- **Détection automatique** de l'ancienne version
- **Migration transparente** vers la nouvelle structure
- **Préservation** des données existantes
- **Création** d'un élève par défaut si nécessaire

### Processus de Migration
1. **Détection** de la version de base de données
2. **Création** des nouveaux stores IndexedDB
3. **Migration** des carnets existants
4. **Association** à un élève par défaut
5. **Nettoyage** des anciennes structures

## 📱 Utilisation Pratique

### Workflow Enseignant
1. **Import CSV** de la liste de classe
2. **Ajout manuel** d'élèves supplémentaires
3. **Navigation** vers le détail de chaque élève
4. **Évaluation** des compétences avec photos/observations
5. **Suivi** de la progression via les statistiques
6. **Export/Impression** des carnets individuels

### Avantages Multi-Élèves
- **Centralisation** de tous les carnets
- **Vue d'ensemble** de la classe
- **Comparaisons** entre élèves possibles
- **Sauvegarde** groupée ou individuelle
- **Flexibilité** dans l'organisation

## 🚀 Performance et Optimisation

### Stockage Optimisé
- **Compression** automatique des photos
- **Index** sur les champs de recherche fréquents
- **Lazy loading** des données élèves
- **Cache** des statistiques calculées

### Navigation Fluide
- **Routage côté client** sans rechargement
- **Transitions** animées entre vues
- **État** préservé lors de la navigation
- **Historique** navigateur respecté

## 🔮 Extensions Futures

### Fonctionnalités Envisageables
- **Groupes d'élèves** et classes multiples
- **Comparaisons** inter-élèves avec graphiques
- **Rapports** de classe automatisés
- **Synchronisation** cloud optionnelle
- **Collaboration** entre enseignants
- **Notifications** de suivi

### Architecture Extensible
- **Modularité** des composants
- **API** claire et documentée
- **Types TypeScript** stricts
- **Tests** unitaires possibles

---

## 🎉 Résumé

L'application **Carnet de Suivi GS** est maintenant une **solution complète multi-élèves** qui :

✅ **Conserve** toutes les fonctionnalités existantes  
✅ **Ajoute** la gestion multi-élèves avec routage  
✅ **Supporte** l'import CSV français  
✅ **Maintient** les performances offline-first  
✅ **Respecte** les programmes 2025  
✅ **Offre** une expérience utilisateur moderne  

**Prête pour une utilisation en classe avec plusieurs élèves !**
