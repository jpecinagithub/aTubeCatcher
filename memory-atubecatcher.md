---
name: aTubeCatcher - Requerimientos del proyecto
description: Stack, arquitectura, rutas API, estructura de archivos y plan de despliegue en Oracle del proyecto aTubeCatcher
type: project
originSessionId: 99675bfc-d3a6-4e0a-be36-6f8c7a255cb5
---
# aTubeCatcher — Requerimientos completos

## Objetivo
Aplicación web de descarga de vídeos y audio de YouTube. Corre completamente en el servidor Oracle propio (Ubuntu 24.04), sin Vercel ni servicios externos de backend.

**Why:** Vercel bloquea yt-dlp por IP y limita las funciones serverless a 10s, lo que hace imposible descargar vídeos largos. Oracle Always Free no tiene estas restricciones y es igualmente gratuito.

**How to apply:** Todas las decisiones de arquitectura deben favorecer el autoalojamiento en Oracle. No sugerir Vercel, Netlify ni similares para este proyecto.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite 5 |
| Estilos | CSS Modules (dark theme, variables CSS) |
| Routing | React Router v6 |
| Backend | Node.js 20 + Express 4 (ES Modules) |
| YouTube | yt-dlp + ffmpeg |
| Proceso | PM2 |
| Servidor web | Nginx (proxy + static) |
| SSL | Certbot / Let's Encrypt |

---

## Estructura de archivos

```
aTubeCatcher/
├── src/
│   ├── components/Layout.tsx + Layout.module.css
│   ├── pages/Home.tsx + Home.module.css
│   ├── pages/Downloader.tsx + Downloader.module.css
│   ├── App.tsx          ← Router (/ y /download)
│   ├── main.tsx
│   └── index.css        ← Design tokens (dark theme)
├── server/
│   ├── index.js         ← Express server (ES Modules)
│   └── package.json     ← type: "module", deps: express cors dotenv
├── deploy/
│   ├── nginx.conf        ← Virtual host con streaming y SSL
│   ├── ecosystem.config.cjs  ← PM2 config
│   ├── setup.sh          ← Instalación inicial en Oracle
│   └── deploy.sh         ← Script de actualización (git pull → build → pm2 restart)
├── vite.config.ts        ← Proxy /api/* → localhost:3000
└── .gitignore
```

---

## Rutas API (Express en puerto 3000)

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/yt-info` | GET | `?url=` → JSON con id, title, thumbnail, duration, uploader, formats[] |
| `/api/yt-download` | GET | `?url=&format_id=&filename=` → stream MP4 directo (pipe de yt-dlp stdout) |
| `/api/yt-audio` | GET | `?url=&filename=` → stream MP3 (yt-dlp --extract-audio --audio-format mp3) |

**Detalles técnicos importantes:**
- Las descargas usan `spawn('yt-dlp', [..., '-o', '-'])` y hacen pipe del stdout a la respuesta Express
- `proxy_buffering off` en Nginx es obligatorio para que el streaming funcione
- `proxy_read_timeout 600s` para vídeos largos
- `client_max_body_size 0` para no limitar tamaño
- Al cancelar la petición (`req.on('close')`) se mata el proceso yt-dlp con `SIGTERM`
- El formato de descarga usa `format_id+bestaudio/best` para mezclar vídeo+audio automáticamente con ffmpeg

---

## Frontend — Páginas

### Home (`/`)
- Hero con icono ▶ rojo, título, descripción y CTA → `/download`
- Grid de 3 cards: Vídeo MP4, Solo Audio MP3, Sin límites

### Downloader (`/download`)
- Input URL + botón "Analizar"
- Estados: idle → loading-info → ready → downloading → error
- Al obtener info muestra: thumbnail 16:9, título, uploader, duración formateada
- Select de formatos filtrado (solo los que tienen vcodec o acodec)
- Botones: "Descargar MP4", "Solo Audio MP3", "Nueva búsqueda"
- Descarga via `window.location.href` al endpoint `/api/yt-*`

---

## Design system

- Fondo: `#0f0f0f`, surface: `#1a1a1a`, accent: `#ff0000` (rojo YouTube)
- Border radius: `10px`, border color: `#2e2e2e`
- Tipografía: Segoe UI / system-ui
- CSS Modules para todos los componentes

---

## Despliegue en Oracle

**Servidor:** Ubuntu 24.04.4 LTS en Oracle Always Free (IP: 143.47.63.169)
**Ruta del proyecto:** `/home/ubuntu/PROYECTOS/aTubeCatcher`
**PM2 app name:** `atubecatcher`
**Puerto Express:** 3000 (solo interno, Nginx hace el proxy)

### Flujo de despliegue
1. `bash deploy/setup.sh` — solo la primera vez (instala nvm, Node 20, yt-dlp, ffmpeg, PM2, Nginx)
2. Copiar `deploy/nginx.conf` a `/etc/nginx/sites-enabled/atubecatcher` y reemplazar `TU_DOMINIO_O_IP`
3. `bash deploy/deploy.sh` — en cada actualización (git pull → npm install → build → pm2 restart)

### Nginx — puntos críticos
- `proxy_buffering off` → imprescindible para streaming
- `proxy_read_timeout 600s` → para vídeos largos
- `try_files $uri $uri/ /index.html` → SPA fallback

---

## Estado del proyecto (2026-05-09)

- Proyecto creado desde cero (directorio estaba vacío)
- Probado localmente: backend responde correctamente a `/api/yt-info` con datos reales de YouTube
- Frontend corriendo en `localhost:5173`, backend en `localhost:3000`
- Pendiente: subir a GitHub + desplegar en Oracle + configurar dominio/SSL
