#!/bin/bash
# Script de instalación inicial en Oracle Ubuntu 24.04
# Ejecutar una sola vez: bash setup.sh

set -e
echo "=== aTubeCatcher - Setup Oracle Server ==="

# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Node.js 20 via nvm
if ! command -v nvm &> /dev/null; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  source "$NVM_DIR/nvm.sh"
fi
nvm install 20
nvm use 20
nvm alias default 20

# 3. yt-dlp
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
yt-dlp --version

# 4. ffmpeg
sudo apt install -y ffmpeg
ffmpeg -version | head -1

# 5. PM2
npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# 6. Nginx
sudo apt install -y nginx

echo ""
echo "=== Setup completado ==="
echo "Siguiente paso: ejecutar deploy.sh"
