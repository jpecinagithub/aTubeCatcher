#!/bin/bash
# Script de despliegue — ejecutar en cada actualización
# Uso: bash deploy.sh

set -e
APP_DIR="/home/ubuntu/PROYECTOS/aTubeCatcher"

echo "=== Deploy aTubeCatcher ==="

cd "$APP_DIR"

# 1. Actualizar código
git pull origin main

# 2. Instalar dependencias frontend
npm install

# 3. Build frontend
npm run build

# 4. Instalar dependencias backend
cd server
npm install
cd ..

# 5. Actualizar yt-dlp
sudo yt-dlp -U || true

# 6. Reiniciar o iniciar con PM2
if pm2 list | grep -q 'atubecatcher'; then
  pm2 restart atubecatcher
else
  pm2 start deploy/ecosystem.config.cjs
fi

pm2 save

echo ""
echo "=== Deploy completado ==="
pm2 list
