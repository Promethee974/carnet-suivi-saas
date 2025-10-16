# Carnet de Suivi SaaS - Version 2.0

Application SaaS complète pour le suivi des apprentissages en Grande Section de maternelle, conforme aux programmes officiels 2025.

## 🏗️ Architecture Monorepo

Ce projet utilise une architecture monorepo avec 3 packages principaux :

```
carnet-suivi-saas/
├── frontend/          # Application web (Vite + TypeScript)
├── backend/           # API REST (Node.js + Express + Prisma)
├── shared/            # Types TypeScript partagés
└── docker-compose.yml # Services de développement
```

## 🚀 Installation et Démarrage

### Prérequis

- Node.js >= 18.0.0
- Docker et Docker Compose
- npm ou pnpm

### Installation

```bash
# 1. Cloner le projet et installer les dépendances
npm install

# 2. Démarrer les services Docker (PostgreSQL, MinIO, Redis)
npm run docker:up

# 3. Configurer le backend
cd backend
cp .env.example .env
# Éditer .env avec vos valeurs

# 4. Générer le client Prisma et créer la base de données
npm run prisma:generate
npm run prisma:migrate

# 5. Retourner à la racine et démarrer tous les services
cd ..
npm run dev
```

L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3001
- **MinIO Console** : http://localhost:9001 (minioadmin / minioadmin)
- **Prisma Studio** : `npm run prisma:studio` (depuis /backend)

## 📦 Structure Détaillée

### Frontend (`/frontend`)
Application web Progressive (PWA) :
- **Framework** : Vite + TypeScript + Web Components
- **Styling** : Tailwind CSS
- **Storage local** : IndexedDB (via idb)
- **Mode** : Offline-first avec synchronisation cloud

### Backend (`/backend`)
API REST Node.js :
- **Framework** : Express.js + TypeScript
- **ORM** : Prisma
- **Base de données** : PostgreSQL
- **Storage** : S3/MinIO
- **Auth** : JWT
- **Validation** : Zod

Structure :
```
backend/
├── src/
│   ├── config/           # Configuration (env, database, storage)
│   ├── middleware/       # Auth, erreurs, validation
│   ├── modules/          # Modules métier
│   │   ├── auth/
│   │   ├── students/
│   │   ├── carnets/
│   │   ├── photos/
│   │   └── backups/
│   ├── shared/           # Utilitaires
│   ├── app.ts            # Configuration Express
│   └── index.ts          # Point d'entrée
└── prisma/
    └── schema.prisma     # Schéma de base de données
```

### Shared (`/shared`)
Types TypeScript partagés entre frontend et backend pour assurer la cohérence des données.

## 🗄️ Base de Données

Le schéma Prisma inclut :
- **Users** : Utilisateurs et authentification
- **Organizations** : Gestion multi-établissements
- **Subscriptions** : Plans et abonnements (FREE, PRO, SCHOOL)
- **Students** : Élèves
- **Carnets** : Carnets de suivi des compétences
- **Photos** : Photos liées aux compétences
- **ActivityLogs** : Journal des actions
- **Backups** : Sauvegardes complètes

## 🐳 Services Docker

Le `docker-compose.yml` lance :
- **PostgreSQL** (port 5432) : Base de données principale
- **MinIO** (ports 9000/9001) : Stockage S3-compatible
- **Redis** (port 6379) : Cache et sessions

Commandes utiles :
```bash
npm run docker:up      # Démarrer les services
npm run docker:down    # Arrêter les services
npm run docker:logs    # Voir les logs
```

## 📝 Scripts Disponibles

### Racine
```bash
npm run dev              # Démarrer frontend + backend
npm run build            # Build tous les packages
npm run docker:up        # Démarrer Docker
npm run prisma:studio    # Ouvrir Prisma Studio
```

### Frontend
```bash
cd frontend
npm run dev              # Serveur de dev
npm run build            # Build production
npm run preview          # Prévisualiser le build
```

### Backend
```bash
cd backend
npm run dev              # Serveur de dev avec hot-reload
npm run build            # Build TypeScript
npm run start            # Démarrer en production
npm run prisma:generate  # Générer le client Prisma
npm run prisma:migrate   # Créer une migration
npm run prisma:studio    # Interface DB graphique
```

## 🔑 Variables d'Environnement

Voir `backend/.env.example` pour la liste complète.

Principales variables :
- `DATABASE_URL` : URL PostgreSQL
- `JWT_SECRET` : Secret pour les tokens JWT (min 32 caractères)
- `S3_*` : Configuration MinIO/S3
- `STRIPE_*` : Clés Stripe (pour abonnements)

## 🚧 État d'Avancement - Phase 1

### ✅ Complété
- [x] Structure monorepo
- [x] Configuration backend (Express, TypeScript)
- [x] Schéma Prisma complet
- [x] Docker Compose (PostgreSQL, MinIO, Redis)
- [x] Middleware (auth, erreurs)
- [x] Configuration S3/MinIO
- [x] Types partagés

### 🔜 À venir (Phase 2)
- [ ] Module d'authentification (register, login, JWT)
- [ ] CRUD Élèves
- [ ] CRUD Carnets
- [ ] Upload photos vers S3
- [ ] Gestion des sauvegardes
- [ ] Migration des données IndexedDB → PostgreSQL
- [ ] Synchronisation offline-first

## 📚 Documentation

- **Prisma** : https://www.prisma.io/docs
- **Express** : https://expressjs.com
- **Vite** : https://vitejs.dev
- **MinIO** : https://min.io/docs

## 🤝 Contribution

Pour contribuer :
1. Créer une branche feature
2. Développer et tester localement
3. Créer une Pull Request

## 📄 Licence

Propriétaire - Tous droits réservés

---

**Version** : 2.0.0
**Dernière mise à jour** : Octobre 2025
