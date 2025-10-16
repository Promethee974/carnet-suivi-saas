# 🧪 Tests API - Carnet de Suivi SaaS

Ce fichier contient des exemples de requêtes pour tester l'API backend.

## 🔧 Prérequis

- Backend démarré sur `http://localhost:3001`
- Base de données PostgreSQL opérationnelle
- `curl` ou un outil comme Postman/Insomnia installé

## ✅ Health Check

```bash
curl http://localhost:3001/health
```

**Réponse attendue:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-13T...",
  "uptime": 123.456,
  "environment": "development"
}
```

## 🔐 Authentification

### 1. Inscription (Register)

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123",
    "firstName": "Marie",
    "lastName": "Dupont"
  }'
```

**Réponse attendue:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "clxxx...",
      "email": "teacher@example.com",
      "firstName": "Marie",
      "lastName": "Dupont",
      "role": "TEACHER",
      "subscriptionTier": "FREE",
      "emailVerified": false,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### 2. Connexion (Login)

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123"
  }'
```

**Réponse attendue:**
```json
{
  "status": "success",
  "data": {
    "user": { /* ... */ },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### 3. Obtenir le profil (Protected Route)

**Important:** Remplacer `YOUR_TOKEN` par le token reçu lors du login/register

```bash
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue:**
```json
{
  "status": "success",
  "data": {
    "id": "clxxx...",
    "email": "teacher@example.com",
    "firstName": "Marie",
    "lastName": "Dupont",
    "role": "TEACHER",
    "subscriptionTier": "FREE",
    "emailVerified": false,
    "createdAt": "...",
    "updatedAt": "...",
    "lastLoginAt": "..."
  }
}
```

### 4. Déconnexion (Logout)

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue:**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

## ❌ Erreurs Courantes

### Email déjà utilisé (409)

```bash
# Essayer de créer un compte avec un email existant
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123"
  }'
```

**Réponse:**
```json
{
  "status": "error",
  "message": "Email already registered"
}
```

### Identifiants invalides (401)

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "wrongpassword"
  }'
```

**Réponse:**
```json
{
  "status": "error",
  "message": "Invalid credentials"
}
```

### Token manquant ou invalide (401)

```bash
curl http://localhost:3001/api/auth/me
# Sans le header Authorization
```

**Réponse:**
```json
{
  "status": "error",
  "message": "No token provided"
}
```

### Validation échouée (400)

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123"
  }'
```

**Réponse:**
```json
{
  "status": "error",
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

## 🔄 Workflow Complet

### Scénario 1: Nouvel utilisateur

```bash
# 1. Inscription
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"password123"}' \
  | jq -r '.data.token')

# 2. Utiliser le token pour accéder au profil
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Scénario 2: Utilisateur existant

```bash
# 1. Connexion
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"password123"}' \
  | jq -r '.data.token')

# 2. Utiliser le token
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 3. Déconnexion
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

## 🛠️ Outils Recommandés

### Postman Collection

Importez cette collection dans Postman :

```json
{
  "info": {
    "name": "Carnet de Suivi API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
            }
          }
        }
      ]
    }
  ]
}
```

### HTTPie (alternative à curl)

```bash
# Installation
brew install httpie  # macOS
# ou
pip install httpie

# Utilisation
http POST localhost:3001/api/auth/register \
  email=teacher@example.com \
  password=password123
```

## 📊 Vérification Base de Données

### Avec Prisma Studio

```bash
cd backend
npm run prisma:studio
```

Puis ouvrir http://localhost:5555 pour visualiser les utilisateurs créés.

### Avec psql

```bash
docker exec -it carnet-postgres psql -U postgres -d carnet_suivi

# Lister les utilisateurs
SELECT id, email, role, "subscription_tier" FROM users;

# Quitter
\q
```

## ✅ Checklist de Tests

- [ ] Health check répond correctement
- [ ] Register crée un nouvel utilisateur
- [ ] Register retourne un token JWT valide
- [ ] Register échoue si email déjà utilisé
- [ ] Login fonctionne avec les bons credentials
- [ ] Login échoue avec mauvais password
- [ ] Route /me retourne le profil avec token valide
- [ ] Route /me échoue sans token
- [ ] Token expire après 7 jours (tester avec un vieux token)

---

**Prochaines étapes**: Implémenter les routes pour Students, Carnets, Photos
