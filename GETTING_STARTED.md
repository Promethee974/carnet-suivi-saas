# 🚀 Guide de Démarrage Rapide - Carnet de Suivi SaaS

Ce guide vous permettra de démarrer le projet en moins de 5 minutes.

## ⚡ Installation Express

### 1️⃣ Installer les dépendances

```bash
cd /Users/Promethee/CascadeProjects/carnet-suivi-saas
npm install
```

### 2️⃣ Démarrer Docker

```bash
# Démarrer PostgreSQL, MinIO et Redis
npm run docker:up

# Vérifier que les services sont démarrés
docker ps
```

Vous devriez voir 3 conteneurs actifs :
- `carnet-postgres` (PostgreSQL)
- `carnet-minio` (MinIO)
- `carnet-redis` (Redis)

### 3️⃣ Configurer la base de données

```bash
cd backend

# Le fichier .env est déjà créé avec les bonnes valeurs par défaut

# Générer le client Prisma
npm run prisma:generate

# Créer la base de données et exécuter les migrations
npm run prisma:migrate
# Quand demandé, entrez un nom pour la migration : "init"
```

### 4️⃣ Démarrer l'application

```bash
# Retourner à la racine
cd ..

# Démarrer le frontend ET le backend
npm run dev
```

## 🎉 Félicitations !

Votre application est maintenant opérationnelle :

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3001
- **API Health Check** : http://localhost:3001/health
- **MinIO Console** : http://localhost:9001
  - Username : `minioadmin`
  - Password : `minioadmin`

## 🔍 Vérifications

### Tester l'API Backend

```bash
# Health check
curl http://localhost:3001/health

# Informations API
curl http://localhost:3001/api
```

### Ouvrir Prisma Studio (interface DB)

```bash
cd backend
npm run prisma:studio
```

Puis ouvrir : http://localhost:5555

## 📝 Commandes Utiles

### Développement

```bash
# Démarrer frontend + backend
npm run dev

# Démarrer uniquement le frontend
npm run dev:frontend

# Démarrer uniquement le backend
npm run dev:backend
```

### Docker

```bash
# Démarrer les services
npm run docker:up

# Arrêter les services
npm run docker:down

# Voir les logs
npm run docker:logs

# Voir les logs d'un service spécifique
docker logs -f carnet-postgres
docker logs -f carnet-minio
```

### Base de données

```bash
cd backend

# Générer le client Prisma après modification du schéma
npm run prisma:generate

# Créer une nouvelle migration
npm run prisma:migrate

# Ouvrir Prisma Studio
npm run prisma:studio

# Réinitialiser complètement la DB (DANGER !)
npx prisma migrate reset
```

### Build Production

```bash
# Build tous les packages
npm run build

# Build frontend uniquement
npm run build:frontend

# Build backend uniquement
npm run build:backend
```

## 🐛 Résolution de Problèmes

### Erreur : "Port already in use"

```bash
# Trouver le processus utilisant le port
lsof -i :3001  # Backend
lsof -i :5173  # Frontend

# Tuer le processus
kill -9 <PID>
```

### Erreur : "Cannot connect to database"

```bash
# Vérifier que PostgreSQL est démarré
docker ps | grep postgres

# Redémarrer Docker
npm run docker:down
npm run docker:up
```

### Erreur : "Prisma Client not generated"

```bash
cd backend
npm run prisma:generate
```

### Reset complet

```bash
# Arrêter tous les services
npm run docker:down

# Supprimer les volumes Docker (ATTENTION : perte de données)
docker volume rm carnet-suivi-saas_postgres_data
docker volume rm carnet-suivi-saas_minio_data
docker volume rm carnet-suivi-saas_redis_data

# Redémarrer
npm run docker:up
cd backend
npm run prisma:migrate
cd ..
npm run dev
```

## 📚 Prochaines Étapes

1. **Phase 2** : Implémenter l'authentification (register, login)
2. **Phase 3** : Créer les routes CRUD pour les élèves
3. **Phase 4** : Migrer le frontend vers l'API
4. **Phase 5** : Système de synchronisation offline-first

## 🆘 Besoin d'Aide ?

- Documentation complète : `README-SAAS.md`
- Schéma de la base : `backend/prisma/schema.prisma`
- Variables d'environnement : `backend/.env.example`

---

**Bon développement ! 🚀**
