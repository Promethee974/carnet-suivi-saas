# Phase 2 - Corrections des Routes API

## Résumé

Correction des chemins de routes dans les tests d'intégration pour qu'ils correspondent aux routes réellement implémentées dans l'application.

## Problème identifié

Les tests utilisaient des chemins de routes incorrects qui ne correspondaient pas à l'implémentation réelle des routes dans `carnets.routes.ts` et `photos.routes.ts`.

### Routes Carnets

**Tests (incorrects)** :
- `GET /api/carnets/:studentId`
- `PUT /api/carnets/:id`
- `DELETE /api/carnets/:id`

**Implémentation réelle** :
- `GET /api/carnets/students/:studentId/carnet`
- `PUT /api/carnets/students/:studentId/carnet`
- `DELETE /api/carnets/students/:studentId/carnet`

### Routes Photos

**Tests (incorrects)** :
- `GET /api/photos/student/:studentId`
- `GET /api/photos/temp/student/:studentId`

**Implémentation réelle** :
- `GET /api/photos/students/:studentId/photos`
- `GET /api/photos/students/:studentId/temp-photos`

## Corrections apportées

### 1. [carnets.routes.test.ts](backend/src/__tests__/integration/carnets.routes.test.ts)

**Tests corrigés** : 12 tests

#### GET endpoints
```typescript
// ❌ Avant
.get(`/api/carnets/${student.id}`)

// ✅ Après
.get(`/api/carnets/students/${student.id}/carnet`)
```

#### PUT endpoints
```typescript
// ❌ Avant
.put(`/api/carnets/${carnetId}`)

// ✅ Après
.put(`/api/carnets/students/${student.id}/carnet`)
```

**Bénéfice supplémentaire** : Plus besoin de récupérer d'abord le carnet pour avoir son ID, on utilise directement l'ID de l'élève.

#### DELETE endpoints
```typescript
// ❌ Avant
.delete(`/api/carnets/${carnetId}`)

// ✅ Après
.delete(`/api/carnets/students/${student.id}/carnet`)
```

### 2. [photos.routes.test.ts](backend/src/__tests__/integration/photos.routes.test.ts)

**Tests corrigés** : 5 tests

#### Photos d'un élève
```typescript
// ❌ Avant
.get(`/api/photos/student/${student.id}`)

// ✅ Après
.get(`/api/photos/students/${student.id}/photos`)
```

#### Photos temporaires
```typescript
// ❌ Avant
.get(`/api/photos/temp/student/${student.id}`)

// ✅ Après
.get(`/api/photos/students/${student.id}/temp-photos`)
```

## Résultats

### Avant corrections
- ❌ **97 tests échoués**
- ✅ 131 tests réussis
- 📊 **57% de taux de réussite**

### Après corrections
- ❌ **90 tests échoués** (-7 échecs)
- ✅ **138 tests réussis** (+7 réussites)
- 📊 **60.5% de taux de réussite** (+3.5%)

### Amélioration
- ✅ **+7 tests corrigés**
- 📈 **+3.5 points** de taux de réussite
- 🎯 Progression vers l'objectif de 70%

## Tests par fichier

### carnets.routes.test.ts
- **Total** : 12 tests
- **Réussis** : 8 tests
- **Échoués** : 4 tests
- **Taux** : 66.7%

Les 4 échecs restants sont des problèmes de timeout liés à la gestion d'erreurs 404, non liés aux chemins de routes.

### photos.routes.test.ts
- Tests améliorés mais certains endpoints (GET /api/photos/:id, PUT /api/photos/:id) nécessitent une vérification car ces routes peuvent ne pas exister.

## Tests restants qui échouent

Les 90 tests qui échouent encore sont dus à :

1. **Timeouts sur les 404** (~35 tests)
   - Les tests qui attendent une erreur 404 timeout au lieu de recevoir l'erreur
   - **Cause** : Le middleware d'erreur ne gère pas correctement certaines erreurs
   - **Solution** : Wrapper les contrôleurs avec asyncHandler

2. **Routes manquantes** (~10 tests)
   - Certains tests utilisent des routes qui n'existent peut-être pas
   - Exemple : GET /api/photos/:id
   - **Solution** : Vérifier l'implémentation ou adapter les tests

3. **Validation Zod** (~25 tests)
   - Tests qui attendent un 400 mais reçoivent un 500
   - **Cause** : Schémas Zod manquants dans certains controllers
   - **Solution** : Ajouter la validation

4. **Tests unitaires** (~20 tests)
   - Erreurs de logique métier ou de données de test
   - Non liés aux routes

## Structure des routes

### Convention adoptée

L'API utilise une structure RESTful hiérarchique :

```
/api/{resource}/students/:studentId/{sub-resource}
```

**Avantages** :
- ✅ Clair et explicite
- ✅ Respect de la hiérarchie des ressources
- ✅ Évite les ambiguïtés

**Exemples** :
- `/api/carnets/students/:studentId/carnet` - Le carnet d'un élève spécifique
- `/api/photos/students/:studentId/photos` - Les photos d'un élève
- `/api/photos/students/:studentId/temp-photos` - Les photos temporaires d'un élève

## Prochaines étapes

### Priorité HAUTE
1. **Fixer les timeouts 404**
   - Wrapper tous les contrôleurs avec `asyncHandler`
   - S'assurer que les erreurs sont bien propagées

### Priorité MOYENNE
2. **Vérifier les routes manquantes**
   - GET /api/photos/:id
   - PUT /api/photos/:id
   - Soit implémenter, soit adapter les tests

3. **Ajouter la validation Zod manquante**
   - Identifier les endpoints sans validation
   - Ajouter les schémas appropriés

### Objectif
- 🎯 **Atteindre 70% de taux de réussite** (160/228 tests)
- 📊 **15 tests supplémentaires** à corriger

## Commandes de test

```bash
# Tous les tests
npm test

# Tests carnets uniquement
npm test carnets.routes.test.ts

# Tests photos uniquement
npm test photos.routes.test.ts

# Mode watch
npm run test:watch

# Avec couverture
npm run test:coverage
```

## Conclusion

La correction des chemins de routes a permis de **résoudre 7 tests supplémentaires** et d'améliorer le taux de réussite de **57% à 60.5%**.

Les routes API suivent maintenant une convention claire et hiérarchique qui reflète correctement la structure des ressources de l'application.

Les tests restants nécessitent principalement des correctifs au niveau de la gestion d'erreurs et de la validation, non au niveau des routes.

---

**Date**: 2025-10-22
**Tests corrigés**: 7
**Taux de réussite**: 60.5% (138/228)
**Objectif Phase 2**: ✅ Atteint (>60%)
**Prochain objectif**: 70% (Phase 3)
