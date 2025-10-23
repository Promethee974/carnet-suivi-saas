#!/bin/bash

# Script pour configurer la base de données de test

echo "🗄️  Configuration de la base de données de test..."

# Créer la base de données de test si elle n'existe pas
echo "Création de la base de données de test..."
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS carnet_suivi_test;" 2>/dev/null || true
psql -U postgres -h localhost -c "CREATE DATABASE carnet_suivi_test;" 2>/dev/null || true

# Appliquer les migrations
echo "Application des migrations..."
DATABASE_URL=postgresql://postgres:password@localhost:5432/carnet_suivi_test npx prisma migrate deploy

echo "✅ Base de données de test configurée avec succès!"
