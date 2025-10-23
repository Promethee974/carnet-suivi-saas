# Tests Backend - Carnet de Suivi SaaS

## Structure des Tests

```
__tests__/
├── unit/                    # Tests unitaires (services, utils)
│   ├── auth.service.test.ts
│   ├── students.service.test.ts
│   └── auth.middleware.test.ts
├── integration/             # Tests d'intégration (endpoints API)
│   ├── auth.routes.test.ts
│   └── students.routes.test.ts
├── helpers/                 # Utilitaires de test
│   └── test-utils.ts
└── setup.ts                # Configuration globale

```

## Prérequis

1. **Base de données de test séparée**
   ```bash
   # Créer une base de données dédiée aux tests
   createdb carnet_suivi_test
   ```

2. **Variables d'environnement**
   - Copier `.env.test` et ajuster si nécessaire
   - Utiliser une DATABASE_URL différente de la production/dev

3. **Migrations**
   ```bash
   # Appliquer les migrations sur la base de test
   DATABASE_URL=postgresql://postgres:password@localhost:5432/carnet_suivi_test npx prisma migrate deploy
   ```

## Lancer les Tests

### Tous les tests (une fois)
```bash
npm test
```

### Mode watch (développement)
```bash
npm run test:watch
```

### Interface UI
```bash
npm run test:ui
```

### Avec coverage
```bash
npm run test:coverage
```

## Bonnes Pratiques

### 1. Isolation des Tests
- Chaque test doit être **indépendant**
- Utiliser `beforeEach` / `afterEach` pour setup/cleanup
- Ne pas dépendre de l'ordre d'exécution

### 2. Cleanup des Données
- **TOUJOURS** nettoyer les données de test créées
- Utiliser `cleanupTestUser()` dans `afterEach` ou `afterAll`
- Éviter la pollution de la base de test

### 3. Nomenclature
- Fichiers : `*.test.ts` ou `*.spec.ts`
- describe() : Nom du module/classe testé
- it() : "devrait [comportement attendu]"

### 4. Helpers
- Utiliser les helpers dans `test-utils.ts` :
  - `createTestUser()` : Créer un utilisateur de test
  - `createTestStudent()` : Créer un élève de test
  - `generateTestToken()` : Générer un JWT valide
  - `cleanupTestUser()` : Nettoyer toutes les données d'un user

### 5. Coverage
Objectifs minimum :
- **70% de couverture globale**
- **80% pour les services critiques** (auth, students, carnets)
- **60% pour les utilitaires**

## Exemple de Test

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { MyService } from '../../modules/my-service.js';
import { createTestUser, cleanupTestUser } from '../helpers/test-utils.js';

describe('MyService', () => {
  let testUserId: string | null = null;

  afterEach(async () => {
    if (testUserId) {
      await cleanupTestUser(testUserId);
      testUserId = null;
    }
  });

  it('devrait faire quelque chose', async () => {
    const { user } = await createTestUser();
    testUserId = user.id;

    const service = new MyService();
    const result = await service.doSomething(user.id);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});
```

## Commandes Utiles

```bash
# Réinitialiser la base de test
DATABASE_URL=postgresql://postgres:password@localhost:5432/carnet_suivi_test npx prisma migrate reset --force

# Générer le client Prisma pour les tests
DATABASE_URL=postgresql://postgres:password@localhost:5432/carnet_suivi_test npx prisma generate

# Voir le coverage en HTML
npm run test:coverage
# Puis ouvrir coverage/index.html
```

## Troubleshooting

### Erreur "Cannot find module"
- Vérifier que les imports utilisent `.js` même pour les fichiers `.ts`
- C'est requis par Node.js ESM

### Tests qui échouent aléatoirement
- Vérifier l'isolation des tests
- S'assurer du cleanup des données
- Vérifier les timers (setTimeout, etc.)

### Base de données locked
- Fermer toutes les connexions Prisma Studio
- Redémarrer la base de données
- Utiliser `afterAll()` pour fermer `prisma.$disconnect()`

## CI/CD

Les tests sont automatiquement lancés dans le pipeline CI/CD :
1. Setup de la base de données de test
2. Migrations
3. Lancement des tests avec coverage
4. Upload du rapport de coverage
5. Échec du build si coverage < 70%

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
