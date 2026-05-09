import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3013;
const YT_DLP_FLAGS = [
  '--js-runtimes', 'node:/usr/bin/node',
  '--extractor-args', 'youtube:player_client=tv_embedded,web',
];
const DIST = path.join(__dirname, '..', 'dist');

app.use(cors());
app.use(express.json());

// ─── YouTube: obtener info del vídeo ──────────────────────────────────────────
app.get('/api/yt-info', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url requerida' });

  const ytdlp = spawn('yt-dlp', [
    '--dump-json',
    '--no-playlist',
    ...YT_DLP_FLAGS,
    url,
  ]);

  let raw = '';
  let err = '';

  ytdlp.stdout.on('data', (d) => { raw += d.toString(); });
  ytdlp.stderr.on('data', (d) => { err += d.toString(); });

  ytdlp.on('close', (code) => {
    if (code !== 0) {
      console.error('[yt-info] error:', err);
      return res.status(500).json({ error: 'No se pudo obtener info del vídeo', detail: err });
    }
    try {
      const info = JSON.parse(raw);
      res.json({
        id: info.id,
        title: info.title,
        thumbnail: info.thumbnail,
        duration: info.duration,
        uploader: info.uploader,
        formats: (info.formats || [])
          .filter((f) => f.vcodec !== 'none' || f.acodec !== 'none')
          .map((f) => ({
            format_id: f.format_id,
            ext: f.ext,
            quality: f.format_note || f.quality,
            filesize: f.filesize,
            vcodec: f.vcodec,
            acodec: f.acodec,
            height: f.height,
            fps: f.fps,
          })),
      });
    } catch {
      res.status(500).json({ error: 'Respuesta inválida de yt-dlp' });
    }
  });
});

// ─── YouTube: stream de descarga ─────────────────────────────────────────────
app.get('/api/yt-download', (req, res) => {
  const { url, format_id, filename } = req.query;
  if (!url) return res.status(400).json({ error: 'url requerida' });

  const safeFilename = (filename || 'video').replace(/[^\w\s.-]/g, '_');
  const args = [
    '--no-playlist',
    '-o', '-',
  ];

  if (format_id) {
    // si el format_id es solo audio o solo video, mezclar con el mejor del otro tipo
    args.push('-f', `${format_id}+bestaudio/best`);
  } else {
    args.push('-f', 'bestvideo+bestaudio/best');
  }

  args.push('--merge-output-format', 'mp4');
  args.push(url);

  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.mp4"`);
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Transfer-Encoding', 'chunked');

  args.unshift(...YT_DLP_FLAGS);
  const ytdlp = spawn('yt-dlp', args);

  ytdlp.stdout.pipe(res);

  let errLog = '';
  ytdlp.stderr.on('data', (d) => { errLog += d.toString(); });

  ytdlp.on('close', (code) => {
    if (code !== 0) console.error('[yt-download] error:', errLog);
  });

  req.on('close', () => { ytdlp.kill('SIGTERM'); });
});

// ─── YouTube: solo audio MP3 ─────────────────────────────────────────────────
app.get('/api/yt-audio', (req, res) => {
  const { url, filename } = req.query;
  if (!url) return res.status(400).json({ error: 'url requerida' });

  const safeFilename = (filename || 'audio').replace(/[^\w\s.-]/g, '_');

  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.mp3"`);
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Transfer-Encoding', 'chunked');

  const ytdlp = spawn('yt-dlp', [
    '--no-playlist',
    ...YT_DLP_FLAGS,
    '-f', 'bestaudio',
    '--extract-audio',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '-o', '-',
    url,
  ]);

  ytdlp.stdout.pipe(res);

  let errLog = '';
  ytdlp.stderr.on('data', (d) => { errLog += d.toString(); });
  ytdlp.on('close', (code) => {
    if (code !== 0) console.error('[yt-audio] error:', errLog);
  });

  req.on('close', () => { ytdlp.kill('SIGTERM'); });
});

// ─── Servir frontend (producción) ────────────────────────────────────────────
app.use(express.static(DIST));
app.get('*', (_req, res) => {
  res.sendFile(path.join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`aTubeCatcher server running on port ${PORT}`);
});
