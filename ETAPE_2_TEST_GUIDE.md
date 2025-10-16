# ÉTAPE 2 - Guide de Test End-to-End de l'Authentification

## Statut des Services ✅

Tous les services sont opérationnels et prêts pour les tests:

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost:3002/ | ✅ Running |
| **Backend API** | http://localhost:3001 | ✅ Running |
| **PostgreSQL** | localhost:5432 | ✅ Healthy |
| **MinIO (S3)** | localhost:9000-9001 | ✅ Healthy |
| **Redis** | localhost:6379 | ✅ Healthy |

---

## 🎯 Objectif de l'Étape 2

Tester l'authentification complète via l'interface utilisateur:
1. ✅ Créer un nouveau compte (Registration)
2. ✅ Se connecter avec le compte créé (Login)
3. ✅ Vérifier que le JWT token est stocké
4. ✅ Tester la navigation entre les pages auth
5. ✅ Vérifier la redirection après login

---

## 📋 Tests à Effectuer

### Test 1: Page d'Inscription (Registration)

**URL**: http://localhost:3002/#/register

#### Actions:
1. Ouvrir le navigateur et aller sur http://localhost:3002/#/register
2. Vérifier que le formulaire s'affiche correctement avec:
   - Champ "Email"
   - Champ "Mot de passe"
   - Champ "Confirmer le mot de passe"
   - Champ "Prénom"
   - Champ "Nom"
   - Bouton "Créer un compte"
   - Lien "Déjà un compte? Se connecter"

#### Remplir le formulaire:
```
Email: test-ui@example.com
Mot de passe: password123
Confirmer: password123
Prénom: Jean
Nom: Martin
```

#### Résultats attendus:
- ✅ Message de succès après création du compte
- ✅ Redirection automatique vers la page d'accueil après 1.5s
- ✅ Token JWT stocké dans localStorage

#### Vérifier le token:
1. Ouvrir DevTools (F12)
2. Onglet **Application** > **Local Storage** > `http://localhost:3002`
3. Chercher la clé `auth_token`
4. Le token doit être présent (format: `eyJhbGci...`)

---

### Test 2: Navigation vers Login

**Depuis la page Register**

#### Actions:
1. Retourner sur http://localhost:3002/#/register
2. Cliquer sur le lien "Déjà un compte? **Se connecter**"

#### Résultats attendus:
- ✅ Redirection vers http://localhost:3002/#/login
- ✅ Formulaire de connexion affiché
- ✅ URL changée dans la barre d'adresse

---

### Test 3: Page de Connexion (Login)

**URL**: http://localhost:3002/#/login

#### Actions:
1. Vérifier que le formulaire s'affiche avec:
   - Champ "Email"
   - Champ "Mot de passe"
   - Case "Se souvenir de moi"
   - Bouton "Se connecter"
   - Lien "Pas encore de compte? Créer un compte"

#### Remplir le formulaire avec le compte créé:
```
Email: test-ui@example.com
Mot de passe: password123
```

#### Résultats attendus:
- ✅ Connexion réussie
- ✅ Redirection vers la page d'accueil (home)
- ✅ Nouveau token JWT stocké dans localStorage

---

### Test 4: Navigation vers Register

**Depuis la page Login**

#### Actions:
1. Aller sur http://localhost:3002/#/login
2. Cliquer sur "Pas encore de compte? **Créer un compte**"

#### Résultats attendus:
- ✅ Redirection vers http://localhost:3002/#/register
- ✅ Formulaire d'inscription affiché
- ✅ URL changée dans la barre d'adresse

---

### Test 5: Gestion des Erreurs

#### Test 5.1: Mots de passe non identiques
**Sur la page Register:**
1. Remplir le formulaire avec des mots de passe différents
2. Cliquer sur "Créer un compte"

**Attendu**: Message d'erreur "Les mots de passe ne correspondent pas"

#### Test 5.2: Email déjà utilisé
**Sur la page Register:**
1. Essayer de créer un compte avec `test-ui@example.com`
2. Cliquer sur "Créer un compte"

**Attendu**: Message d'erreur du backend (email déjà utilisé)

#### Test 5.3: Mauvais mot de passe
**Sur la page Login:**
1. Email: `test-ui@example.com`
2. Mot de passe: `wrongpassword`
3. Cliquer sur "Se connecter"

**Attendu**: Message d'erreur "Invalid credentials"

#### Test 5.4: Email inexistant
**Sur la page Login:**
1. Email: `nonexistent@example.com`
2. Mot de passe: `password123`
3. Cliquer sur "Se connecter"

**Attendu**: Message d'erreur "Invalid credentials"

---

## 🔍 Vérifications Techniques

### 1. Vérifier les Requêtes API dans DevTools

**Ouvrir DevTools (F12) > Onglet Network:**

#### Pour Register:
- Méthode: `POST`
- URL: `http://localhost:3001/api/auth/register`
- Status: `200 OK`
- Response: Objet avec `user` et `token`

#### Pour Login:
- Méthode: `POST`
- URL: `http://localhost:3001/api/auth/login`
- Status: `200 OK`
- Response: Objet avec `user` et `token`

### 2. Vérifier le Token JWT

**Dans DevTools > Application > Local Storage:**

Le token doit avoir la structure:
```
Key: auth_token
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Décoder le token** (sur https://jwt.io):
```json
{
  "userId": "cmgqbocew...",
  "email": "test-ui@example.com",
  "role": "TEACHER",
  "iat": 1760431876,
  "exp": 1761036676
}
```

### 3. Vérifier les Logs Backend

**Dans le terminal où tourne le backend**, vous devriez voir:

```
POST /api/auth/register
prisma:query INSERT INTO "public"."users" ...
POST /api/auth/login
prisma:query SELECT ... FROM "public"."users" WHERE ...
```

### 4. Vérifier la Base de Données

**Option A: Prisma Studio**
```bash
npm run prisma:studio
```
Ouvrir http://localhost:5555 et vérifier:
- Table `users` contient le nouvel utilisateur
- `email`: test-ui@example.com
- `role`: TEACHER
- `subscription_tier`: FREE
- `last_login_at`: timestamp mis à jour après login

**Option B: Requête SQL directe**
```bash
docker exec -it carnet-postgres psql -U postgres -d carnet_suivi -c "SELECT id, email, first_name, last_name, role FROM users;"
```

---

## 🐛 Problèmes Potentiels et Solutions

### Problème 1: CORS Error
**Symptôme**: Erreur dans la console "Access-Control-Allow-Origin"

**Solution**:
- Vérifier que `FRONTEND_URL=http://localhost:3002` dans `backend/.env`
- Redémarrer le backend

### Problème 2: Network Error / Connection Refused
**Symptôme**: Impossible de joindre l'API

**Solution**:
```bash
# Vérifier que le backend tourne
curl http://localhost:3001/health

# Si non, redémarrer
cd backend && npm run dev
```

### Problème 3: Token non stocké
**Symptôme**: Pas de `auth_token` dans localStorage

**Solution**:
- Vérifier la console du navigateur pour les erreurs
- Vérifier que la requête API retourne bien un token
- Vérifier le code dans `authService.login()` / `authService.register()`

### Problème 4: Page blanche après login
**Symptôme**: Redirection mais rien ne s'affiche

**Solution**:
- C'est normal! La page "home" n'a pas encore de contenu
- Vérifier dans DevTools que la route a changé
- Le token doit être présent dans localStorage

---

## ✅ Checklist de Validation Complète

- [ ] Frontend accessible sur http://localhost:3002
- [ ] Backend accessible sur http://localhost:3001
- [ ] Page Register affiche le formulaire correctement
- [ ] Création de compte fonctionne
- [ ] Message de succès après inscription
- [ ] Token JWT stocké dans localStorage après inscription
- [ ] Redirection vers home après inscription
- [ ] Navigation Register → Login fonctionne
- [ ] Page Login affiche le formulaire correctement
- [ ] Connexion avec le compte créé fonctionne
- [ ] Token JWT mis à jour après login
- [ ] Redirection vers home après login
- [ ] Navigation Login → Register fonctionne
- [ ] Gestion d'erreur: mots de passe différents
- [ ] Gestion d'erreur: email déjà utilisé
- [ ] Gestion d'erreur: mauvais mot de passe
- [ ] Gestion d'erreur: email inexistant
- [ ] Logs backend montrent les requêtes
- [ ] Base de données contient le nouvel utilisateur

---

## 📊 Résumé de l'État Actuel

### ✅ Ce qui fonctionne

- Backend API complet avec 36 endpoints
- Authentification JWT complète
- Hashage bcrypt des mots de passe
- Validation Zod sur tous les endpoints
- CORS configuré correctement
- Frontend avec routes login/register
- Composants auth-login et auth-register
- Services API (authService, studentsApi, etc.)
- Navigation hash-based fonctionnelle
- Stockage du token dans localStorage

### 🚧 Ce qui reste à faire (Phase 3)

- Migration du composant students-list vers API
- Protection des routes (auth guard)
- Affichage conditionnel selon l'état d'authentification
- Bouton de déconnexion
- Gestion de l'expiration du token
- Mode offline avec sync queue
- Migration des autres composants (carnets, photos, etc.)

---

## 🎬 Prochaine Étape Suggérée

Une fois l'ÉTAPE 2 validée avec succès, deux options s'offrent à vous:

### Option A: MVP Rapide (Recommandé - 1-2 jours)
1. Ajouter une protection des routes (auth guard)
2. Migrer le composant `students-list` pour utiliser l'API
3. Ajouter un bouton de déconnexion
4. Test complet du CRUD élèves via l'interface

### Option B: MVP Complet (5-6 jours)
1. Tout ce qui est dans l'Option A
2. Migration de tous les composants
3. Gestion complète des photos
4. Système de backup/restore
5. Interface de gestion des carnets

---

**Bon test!** 🚀

Si vous rencontrez des problèmes, consultez les logs du backend et du frontend, et vérifiez les messages d'erreur dans la console du navigateur.
