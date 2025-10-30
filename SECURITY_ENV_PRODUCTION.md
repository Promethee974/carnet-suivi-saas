# Guide de Sécurité - Variables d'Environnement (.env) en Production

**Date** : 2025-10-30
**Statut Actuel** : ✅ Configuration sécurisée (aucun .env commité)
**Niveau de Risque** : 🟢 FAIBLE

---

## 📋 Table des Matières

1. [État Actuel de la Sécurité](#état-actuel-de-la-sécurité)
2. [Variables Sensibles Identifiées](#variables-sensibles-identifiées)
3. [Bonnes Pratiques Appliquées](#bonnes-pratiques-appliquées)
4. [Checklist de Sécurité Production](#checklist-de-sécurité-production)
5. [Procédure de Déploiement Sécurisé](#procédure-de-déploiement-sécurisé)
6. [Génération de Secrets Forts](#génération-de-secrets-forts)
7. [Rotation des Secrets](#rotation-des-secrets)
8. [Audit et Monitoring](#audit-et-monitoring)

---

## 🔒 État Actuel de la Sécurité

### ✅ Points Positifs

1. **`.env` dans `.gitignore`**
   - Ligne 8 du `.gitignore` : `.env` est exclu
   - Lignes 9-10 : `.env.local` et `.env.*.local` aussi exclus
   - ✅ **Vérifié** : Aucun fichier `.env` dans l'historique git

2. **Fichier `.env.example` présent**
   - [backend/.env.example](backend/.env.example) existe
   - Contient des valeurs par défaut non sensibles
   - Sert de template pour la configuration

3. **Docker Compose utilise des variables**
   - [docker-compose.prod.yml](docker-compose.prod.yml) utilise `${VARIABLE}`
   - Les secrets ne sont PAS hardcodés dans le fichier
   - Variables injectées depuis `.env` au moment du déploiement

### ⚠️ Points d'Attention

1. **Fichier `.env` local**
   - [backend/.env](backend/.env) existe en local avec des valeurs de développement
   - Contient `JWT_SECRET=super-secret-jwt-key-change-this-in-production-min-32-chars-long`
   - ⚠️ Ce secret est générique et doit être changé en production

2. **Pas de fichier `.env.production` tracké**
   - ✅ Bon : Les secrets de production ne sont pas dans le repo
   - ℹ️ Les secrets de production doivent être gérés sur le serveur VPS

---

## 🔐 Variables Sensibles Identifiées

### Niveau Critique 🔴 (Accès Complet au Système)

| Variable | Usage | Risque si Exposé |
|----------|-------|------------------|
| `JWT_SECRET` | Signature des tokens d'authentification | Usurpation d'identité, accès total aux comptes utilisateurs |
| `DATABASE_URL` | Connexion PostgreSQL (inclut mot de passe) | Accès complet à toutes les données (élèves, carnets, utilisateurs) |
| `POSTGRES_PASSWORD` | Mot de passe super-utilisateur PostgreSQL | Accès complet à la base de données |

### Niveau Élevé 🟠 (Accès aux Données)

| Variable | Usage | Risque si Exposé |
|----------|-------|------------------|
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Authentification MinIO/S3 | Accès aux photos et backups, suppression possible |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | Admin MinIO | Accès root au stockage d'objets |

### Niveau Moyen 🟡 (Impact Limité)

| Variable | Usage | Risque si Exposé |
|----------|-------|------------------|
| `REDIS_URL` | Connexion Redis (si avec mot de passe) | Accès aux sessions, cache, possibilité de corruption |
| `STRIPE_SECRET_KEY` | Paiements Stripe | Transactions frauduleuses, remboursements non autorisés |
| `SMTP_PASS` | Envoi d'emails | Spam, phishing via votre domaine |

### Niveau Faible 🟢 (Configuration Publique)

| Variable | Usage | Sensibilité |
|----------|-------|-------------|
| `PORT`, `API_URL`, `FRONTEND_URL` | Configuration réseau | Publique, pas de risque |
| `NODE_ENV`, `S3_REGION` | Configuration applicative | Publique |
| `MAX_STUDENTS_*` | Limites métier | Publique |

---

## ✅ Bonnes Pratiques Appliquées

### 1. Séparation des Environnements

```
📁 carnet-suivi-saas/
├── backend/
│   ├── .env           ← 🔴 Local dev (ne PAS commiter)
│   ├── .env.example   ← ✅ Template (committé)
│   └── .env.test      ← ✅ Tests (committé, sans secrets)
├── .gitignore         ← ✅ Exclut .env
└── docker-compose.prod.yml ← ✅ Utilise ${VARIABLES}
```

### 2. Vérifications Git

```bash
# ✅ Vérifier que .env n'est pas tracké
git ls-files | grep .env
# Résultat attendu : Seulement .env.example et .env.test

# ✅ Vérifier .gitignore
cat .gitignore | grep .env
# Résultat : .env est bien présent
```

### 3. Docker Compose Production

Le fichier [docker-compose.prod.yml](docker-compose.prod.yml:90-108) injecte correctement les variables :

```yaml
environment:
  NODE_ENV: production
  DATABASE_URL: ${DATABASE_URL}        # ✅ Variable, pas de hardcode
  JWT_SECRET: ${JWT_SECRET}            # ✅ Variable
  S3_ACCESS_KEY: ${S3_ACCESS_KEY}      # ✅ Variable
  S3_SECRET_KEY: ${S3_SECRET_KEY}      # ✅ Variable
```

---

## 📋 Checklist de Sécurité Production

### Avant le Déploiement

- [x] ✅ `.env` est dans `.gitignore`
- [x] ✅ Aucun `.env` commité dans l'historique git
- [x] ✅ `.env.example` existe avec des valeurs par défaut
- [x] ✅ `docker-compose.prod.yml` utilise des variables `${}`
- [ ] ⚠️ Générer de nouveaux secrets forts pour production
- [ ] ⚠️ Créer `.env` sur le serveur VPS (pas dans le repo)
- [ ] ⚠️ Vérifier les permissions du fichier `.env` sur le serveur

### Sur le Serveur VPS

```bash
# 1. Se connecter au VPS
ssh debian@votre-serveur.com

# 2. Naviguer vers le répertoire de production
cd /home/debian/carnet-suivi-v2

# 3. Créer le fichier .env de production (s'il n'existe pas)
nano .env

# 4. Vérifier les permissions (lecture propriétaire uniquement)
chmod 600 .env
ls -la .env
# Résultat attendu : -rw------- (600)

# 5. Vérifier le propriétaire
ls -l .env
# Résultat attendu : debian debian (ou utilisateur du service)

# 6. Vérifier que .env n'est PAS dans git
git status .env
# Résultat attendu : .env n'apparaît pas (car dans .gitignore)
```

### Après le Déploiement

- [ ] ⚠️ Tester l'application avec les nouveaux secrets
- [ ] ⚠️ Vérifier les logs pour détecter les erreurs d'authentification
- [ ] ⚠️ Sauvegarder les secrets dans un gestionnaire sécurisé (1Password, Bitwarden)
- [ ] ⚠️ Documenter où sont stockés les secrets de production
- [ ] ⚠️ Configurer des alertes de sécurité (connexions suspectes)

---

## 🔧 Procédure de Déploiement Sécurisé

### Option A : Création Manuelle sur le Serveur (Recommandée)

```bash
# 1. Sur le serveur VPS, créer le fichier .env
cd /home/debian/carnet-suivi-v2
nano .env

# 2. Copier le contenu de .env.example et modifier les valeurs
# NE PAS copier depuis votre machine locale !

# 3. Générer des secrets forts (voir section suivante)

# 4. Sauvegarder les secrets dans un gestionnaire de mots de passe

# 5. Déployer avec Docker Compose
docker compose -f docker-compose.prod.yml up -d --build
```

### Option B : Transfert Sécurisé via SCP (Alternative)

```bash
# ⚠️ À utiliser UNIQUEMENT si vous avez un .env.production local sécurisé

# 1. Sur votre machine locale, créer .env.production (pas .env !)
cp backend/.env.example .env.production
nano .env.production  # Modifier avec les vrais secrets

# 2. Transférer via SCP avec permissions restrictives
scp -P 22 .env.production debian@votre-serveur.com:/home/debian/carnet-suivi-v2/.env

# 3. Sur le serveur, vérifier les permissions
ssh debian@votre-serveur.com
chmod 600 /home/debian/carnet-suivi-v2/.env

# 4. Supprimer le fichier local immédiatement
rm .env.production

# 5. Ne PAS commiter .env.production !
```

### Option C : Variables d'Environnement Système (Plus Sécurisé)

```bash
# Sur le serveur VPS, utiliser systemd environment files

# 1. Créer un fichier d'environnement système
sudo nano /etc/carnet-suivi/production.env

# 2. Définir les permissions ultra-restrictives
sudo chmod 600 /etc/carnet-suivi/production.env
sudo chown root:root /etc/carnet-suivi/production.env

# 3. Modifier docker-compose.prod.yml pour utiliser env_file
# services:
#   backend:
#     env_file:
#       - /etc/carnet-suivi/production.env

# ✅ Avantage : Séparation totale entre code et configuration
```

---

## 🔑 Génération de Secrets Forts

### JWT_SECRET (Minimum 32 caractères)

```bash
# Méthode 1 : OpenSSL (Recommandée)
openssl rand -base64 48
# Exemple : Km3p8qR7vN2xW9jF5tH1bY6cZ4sA0lD8eG3kM7nP2qT5uV1wX

# Méthode 2 : Node.js
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# ⚠️ IMPORTANT : Générer un nouveau secret, ne PAS réutiliser l'exemple !
```

### Mots de Passe PostgreSQL

```bash
# Générer un mot de passe de 32 caractères alphanumérique
openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32

# Exemple : kF8mN2pQ7rS3tV9wX1yZ4aB6cD8eG2hJ
```

### MinIO Access/Secret Keys

```bash
# Access Key (20 caractères)
openssl rand -base64 15 | tr -dc 'A-Z0-9' | head -c 20

# Secret Key (40 caractères)
openssl rand -base64 30 | tr -dc 'a-zA-Z0-9' | head -c 40
```

### Exemple de .env Production Sécurisé

```bash
# ⚠️ Ce fichier doit être créé SUR LE SERVEUR et NE JAMAIS être commité

# Application
NODE_ENV=production
PORT=3001
API_URL=https://carnet.nava.re
FRONTEND_URL=https://carnet.nava.re

# Database (Générer un nouveau mot de passe !)
POSTGRES_USER=carnet_admin
POSTGRES_PASSWORD=kF8mN2pQ7rS3tV9wX1yZ4aB6cD8eG2hJ
POSTGRES_DB=carnet_suivi_prod
DATABASE_URL=postgresql://carnet_admin:kF8mN2pQ7rS3tV9wX1yZ4aB6cD8eG2hJ@postgres:5432/carnet_suivi_prod

# JWT Authentication (Générer un nouveau secret !)
JWT_SECRET=Km3p8qR7vN2xW9jF5tH1bY6cZ4sA0lD8eG3kM7nP2qT5uV1wX9aB2cD4eF
JWT_EXPIRES_IN=7d

# S3/MinIO Storage (Générer de nouvelles clés !)
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET_PHOTOS=carnet-suivi-photos
S3_BUCKET_BACKUPS=carnet-suivi-backups
S3_ACCESS_KEY=AKPRODCARNETSUIVI001
S3_SECRET_KEY=mF9nQ2pR7sT3vW9xY1zZ4aB6cD8eG2hJ3kL
S3_PUBLIC_URL=https://carnet.nava.re/storage
S3_FORCE_PATH_STYLE=true

# MinIO Root (Générer de nouvelles clés !)
MINIO_ROOT_USER=carnet-admin-prod
MINIO_ROOT_PASSWORD=tG8hJ2kL7mN3pQ9rS1tV5wX9yZ2aB4cD6eF

# Redis
REDIS_URL=redis://redis:6379

# Application Settings
MAX_STUDENTS_FREE=5
MAX_STUDENTS_PRO=30
MAX_STUDENTS_SCHOOL=999
MAX_UPLOAD_SIZE_MB=10
```

---

## 🔄 Rotation des Secrets

### Quand Faire une Rotation ?

- 🔴 **IMMÉDIAT** : Si un secret a été exposé (commit accidentel, leak)
- 🟠 **Urgent** : Si un employé avec accès quitte l'entreprise
- 🟡 **Planifié** : Tous les 90 jours (bonne pratique)
- 🟢 **Optionnel** : Tous les 180 jours (minimum acceptable)

### Procédure de Rotation JWT_SECRET

```bash
# ⚠️ Rotation de JWT_SECRET invalide TOUS les tokens existants !
# Les utilisateurs devront se reconnecter.

# 1. Générer un nouveau secret
NEW_JWT_SECRET=$(openssl rand -base64 48)

# 2. Sur le serveur VPS
ssh debian@votre-serveur.com
cd /home/debian/carnet-suivi-v2
nano .env
# Remplacer JWT_SECRET=ancien_secret par JWT_SECRET=nouveau_secret

# 3. Redémarrer le backend
docker compose -f docker-compose.prod.yml restart backend

# 4. Informer les utilisateurs actifs (email/notification)
# "Pour des raisons de sécurité, veuillez vous reconnecter"

# 5. Sauvegarder le nouveau secret dans votre gestionnaire
```

### Procédure de Rotation DATABASE_PASSWORD

```bash
# ⚠️ Plus complexe, nécessite coordination backend + database

# 1. Se connecter à PostgreSQL
docker exec -it carnet-v2-postgres psql -U postgres -d carnet_suivi_prod

# 2. Créer un nouvel utilisateur temporaire
CREATE USER carnet_admin_new WITH PASSWORD 'nouveau_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE carnet_suivi_prod TO carnet_admin_new;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO carnet_admin_new;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO carnet_admin_new;

# 3. Tester la connexion avec le nouveau user
docker exec -it carnet-v2-backend psql "postgresql://carnet_admin_new:nouveau_mdp@postgres:5432/carnet_suivi_prod" -c "SELECT 1"

# 4. Si OK, mettre à jour .env
DATABASE_URL=postgresql://carnet_admin_new:nouveau_mdp@postgres:5432/carnet_suivi_prod

# 5. Redémarrer le backend
docker compose -f docker-compose.prod.yml restart backend

# 6. Vérifier les logs
docker logs carnet-v2-backend --tail 100

# 7. Si tout fonctionne, supprimer l'ancien user
DROP USER carnet_admin;
ALTER USER carnet_admin_new RENAME TO carnet_admin;
```

---

## 🔍 Audit et Monitoring

### Vérifications Régulières (Mensuelles)

```bash
# 1. Vérifier que .env n'est pas dans git
git ls-files | grep -E "\.env$"
# Résultat attendu : vide (sauf .env.example)

# 2. Vérifier les permissions sur le serveur
ssh debian@votre-serveur.com "ls -la /home/debian/carnet-suivi-v2/.env"
# Résultat attendu : -rw------- (600)

# 3. Vérifier l'historique git pour des leaks
git log --all --full-history --source -- "*/.env" "**/.env"
# Résultat attendu : vide

# 4. Scanner le repo pour des secrets hardcodés
grep -r "JWT_SECRET\s*=\s*['\"]" --include="*.ts" --include="*.js"
grep -r "password\s*=\s*['\"]" --include="*.ts" --include="*.js"
# Résultat attendu : Aucune correspondance dans le code source
```

### Outils de Sécurité Automatisés

#### git-secrets (Prévention des Commits de Secrets)

```bash
# Installation
brew install git-secrets  # macOS
sudo apt install git-secrets  # Linux

# Configuration dans le projet
cd /Users/Promethee/CascadeProjects/carnet-suivi-saas
git secrets --install
git secrets --register-aws  # Détecte les clés AWS/S3

# Ajouter des patterns personnalisés
git secrets --add 'JWT_SECRET\s*=\s*[^\s]+'
git secrets --add 'DATABASE_URL\s*=\s*[^\s]+'
git secrets --add 'password\s*=\s*[^\s]+'

# Scanner l'historique existant
git secrets --scan-history
```

#### gitleaks (Scanner de Secrets)

```bash
# Installation
brew install gitleaks  # macOS

# Scanner le repo complet
cd /Users/Promethee/CascadeProjects/carnet-suivi-saas
gitleaks detect --verbose

# Scanner avant chaque commit (pre-commit hook)
gitleaks protect --staged
```

### Monitoring en Production

#### 1. Logs d'Authentification Suspects

```bash
# Sur le serveur VPS
docker logs carnet-v2-backend --tail 1000 | grep -i "authentication failed"
docker logs carnet-v2-backend --tail 1000 | grep -i "jwt"
```

#### 2. Alertes de Connexion Database

```sql
-- Surveiller les connexions échouées
SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction';

-- Surveiller les utilisateurs connectés
SELECT usename, client_addr, state FROM pg_stat_activity;
```

#### 3. Audit MinIO

```bash
# Vérifier les accès récents
docker exec carnet-v2-minio mc admin trace myminio
```

---

## 📚 Ressources et Références

### Documentation Officielle

- [OWASP - Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12 Factor App - Config](https://12factor.net/config)
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)

### Outils Recommandés

| Outil | Usage | Lien |
|-------|-------|------|
| **1Password** | Gestionnaire de mots de passe | [1password.com](https://1password.com) |
| **Bitwarden** | Gestionnaire open-source | [bitwarden.com](https://bitwarden.com) |
| **git-secrets** | Prévention commits secrets | [GitHub](https://github.com/awslabs/git-secrets) |
| **gitleaks** | Scanner de secrets | [GitHub](https://github.com/gitleaks/gitleaks) |
| **Vault** | Gestion secrets entreprise | [vaultproject.io](https://www.vaultproject.io) |

### Checklist Finale

#### Configuration Actuelle ✅

- [x] `.env` dans `.gitignore`
- [x] Aucun secret commité dans git
- [x] `.env.example` présent
- [x] `docker-compose.prod.yml` utilise des variables
- [x] Historique git propre

#### Actions Recommandées ⚠️

- [ ] Générer de nouveaux secrets forts pour production (voir [Génération de Secrets Forts](#génération-de-secrets-forts))
- [ ] Créer `.env` sur le serveur VPS avec `chmod 600`
- [ ] Sauvegarder les secrets dans un gestionnaire (1Password/Bitwarden)
- [ ] Installer `git-secrets` en pre-commit hook
- [ ] Planifier rotation des secrets (tous les 90 jours)
- [ ] Documenter où sont stockés les secrets de production
- [ ] Configurer des alertes de sécurité (Sentry, Datadog)

#### Maintenance Continue 🔄

- [ ] Audit mensuel des permissions `.env`
- [ ] Scan mensuel avec `gitleaks`
- [ ] Rotation trimestrielle du `JWT_SECRET`
- [ ] Rotation semestrielle des mots de passe database
- [ ] Revue annuelle de la politique de sécurité

---

## 🚨 En Cas de Leak de Secrets

### Procédure d'Urgence (Exécuter IMMÉDIATEMENT)

```bash
# 1. ROTATION IMMÉDIATE de TOUS les secrets
# Voir section "Rotation des Secrets" ci-dessus

# 2. Révoquer tous les tokens JWT actifs
# (La rotation JWT_SECRET suffit)

# 3. Vérifier les logs pour détecter des accès suspects
docker logs carnet-v2-backend --since 24h | grep -i "authentication"
docker logs carnet-v2-postgres --since 24h

# 4. Si commit Git avec secrets : Supprimer de l'historique
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/.env' \
  --prune-empty --tag-name-filter cat -- --all

# ⚠️ ATTENTION : Cela réécrit l'historique Git !
# Tous les collaborateurs devront re-cloner le repo

# 5. Force push (coordination avec l'équipe)
git push origin --force --all

# 6. Notifier GitHub pour scanner les secrets exposés
# GitHub Advanced Security détectera automatiquement les secrets
```

---

**Dernière mise à jour** : 2025-10-30
**Auteur** : Claude Code
**Version** : 1.0

**Statut de Sécurité** : 🟢 **SÉCURISÉ**

✅ Configuration actuelle conforme aux bonnes pratiques
⚠️ Actions recommandées à planifier pour renforcer la sécurité
