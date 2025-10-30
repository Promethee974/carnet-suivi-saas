# Carnet Suivi SaaS – Déploiement VPS

## 2025-10-27
- Audit initial du VPS (`docker ps`, structure dossiers) et identification de Traefik + stack V1.
- Arrêt et suppression du conteneur `carnet-suivi`, archivage du dossier (`carnet-suivi_v1` + `carnet-suivi_v1_20251027.tar.gz`).
- Transfert du monorepo V2 (`carnet-suivi-saas`) vers `/home/debian/carnet-suivi-v2`.
- Ajout des Dockerfiles backend/frontend, du `docker-compose.prod.yml` et du fichier `.env` (mots de passe générés).
- Corrections TypeScript frontend (StudentDetail, router, API client, backup service…) pour obtenir un `npm run build` propre.
- Dockerfiles versionnés (backend Node 20 bullseye + OpenSSL, frontend Vite+Nginx) et `docker-compose.prod.yml` mis à jour.
- Déploiement complet : `docker compose up --build`, exécution de `prisma migrate deploy`, conteneurs `carnet-v2-*` actifs.
- Ajustement Traefik (`traefik.docker.network=web`) + vérification `https://carnet.nava.re/health` OK.
- Ajout des icônes PWA manquantes (génération PNG 192/512 + copie explicite dans l'image Nginx) et correction de `VITE_API_URL` pour éviter `/api/api/...`.
- Update service worker (cache liste à jour) et relâche du rate limiting auth (`max`=15) + global limiter (`max`=500 avec skip des GET) pour éviter les 429 prématurés.
- État actuel : V1 archivée, V2 servie via Traefik (frontend, API, Postgres, Redis, MinIO). Suivi post-déploiement à poursuivre (tests fonctionnels, monitoring).
