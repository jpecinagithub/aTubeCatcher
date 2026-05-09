import { useState, useRef } from 'react'
import styles from './Downloader.module.css'

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

type Format = {
  format_id: string
  ext: string
  quality: string
  filesize: number | null
  vcodec: string
  acodec: string
  height: number | null
  fps: number | null
}

type VideoInfo = {
  id: string
  title: string
  thumbnail: string
  duration: number
  uploader: string
  formats: Format[]
}

type Mode = 'idle' | 'loading-info' | 'ready' | 'downloading' | 'error'

function formatBytes(bytes: number | null): string {
  if (!bytes) return '?'
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} KB`
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

export default function Downloader() {
  const [url, setUrl] = useState('')
  const [mode, setMode] = useState<Mode>('idle')
  const [info, setInfo] = useState<VideoInfo | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<string>('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function fetchInfo() {
    const trimmed = url.trim()
    if (!trimmed) return
    setMode('loading-info')
    setError('')
    setInfo(null)
    try {
      const res = await fetch(`${API_BASE}/api/yt-info?url=${encodeURIComponent(trimmed)}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Error ${res.status}`)
      }
      const data: VideoInfo = await res.json()
      setInfo(data)
      const best = data.formats.find((f) => f.height && f.acodec !== 'none') || data.formats[0]
      setSelectedFormat(best?.format_id ?? '')
      setMode('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setMode('error')
    }
  }

  function downloadVideo() {
    if (!info || !url) return
    const params = new URLSearchParams({
      url: url.trim(),
      format_id: selectedFormat,
      filename: info.title,
    })
    window.location.href = `${API_BASE}/api/yt-download?${params}`
    setMode('downloading')
    setTimeout(() => setMode('ready'), 3000)
  }

  function downloadAudio() {
    if (!info || !url) return
    const params = new URLSearchParams({ url: url.trim(), filename: info.title })
    window.location.href = `${API_BASE}/api/yt-audio?${params}`
    setMode('downloading')
    setTimeout(() => setMode('ready'), 3000)
  }

  function reset() {
    setUrl('')
    setInfo(null)
    setMode('idle')
    setError('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const videoFormats = info?.formats.filter((f) => f.vcodec !== 'none' && f.height) ?? []

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Descarga YouTube</h2>

      {/* URL input */}
      <div className={styles.inputRow}>
        <input
          ref={inputRef}
          className={styles.urlInput}
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
          disabled={mode === 'loading-info' || mode === 'downloading'}
          autoFocus
        />
        <button
          className={styles.searchBtn}
          onClick={fetchInfo}
          disabled={!url.trim() || mode === 'loading-info' || mode === 'downloading'}
        >
          {mode === 'loading-info' ? <span className={styles.spinner} /> : 'Analizar'}
        </button>
      </div>

      {/* Error */}
      {mode === 'error' && (
        <div className={styles.error}>
          <span>⚠ {error}</span>
          <button onClick={reset}>Reintentar</button>
        </div>
      )}

      {/* Video info */}
      {info && mode !== 'error' && (
        <div className={styles.card}>
          <img className={styles.thumb} src={info.thumbnail} alt={info.title} />
          <div className={styles.meta}>
            <p className={styles.videoTitle}>{info.title}</p>
            <p className={styles.videoBadges}>
              <span>{info.uploader}</span>
              <span>·</span>
              <span>{formatDuration(info.duration)}</span>
            </p>

            {/* Format selector */}
            {videoFormats.length > 0 && (
              <div className={styles.formatRow}>
                <label htmlFor="fmt">Calidad:</label>
                <select
                  id="fmt"
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className={styles.select}
                >
                  {videoFormats.map((f) => (
                    <option key={f.format_id} value={f.format_id}>
                      {f.height}p {f.fps && f.fps > 30 ? `${f.fps}fps` : ''} · {f.ext.toUpperCase()} · {formatBytes(f.filesize)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.actions}>
              <button
                className={styles.btnPrimary}
                onClick={downloadVideo}
                disabled={mode === 'downloading'}
              >
                {mode === 'downloading' ? 'Iniciando…' : '⬇ Descargar MP4'}
              </button>
              <button
                className={styles.btnSecondary}
                onClick={downloadAudio}
                disabled={mode === 'downloading'}
              >
                🎵 Solo Audio MP3
              </button>
              <button className={styles.btnGhost} onClick={reset}>
                Nueva búsqueda
              </button>
            </div>

            {mode === 'downloading' && (
              <p className={styles.hint}>
                La descarga comenzará en tu navegador. Los vídeos grandes pueden tardar unos segundos en prepararse.
              </p>
            )}
          </div>
        </div>
      )}

      {mode === 'idle' && (
        <div className={styles.placeholder}>
          <span>▶</span>
          <p>Pega una URL de YouTube y pulsa <strong>Analizar</strong></p>
        </div>
      )}
    </div>
  )
}
