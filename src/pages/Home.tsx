import { Link } from 'react-router-dom'
import styles from './Home.module.css'

export default function Home() {
  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <span className={styles.heroIcon}>▶</span>
        <h1>aTubeCatcher</h1>
        <p>Descarga vídeos y audio de YouTube directamente en tu dispositivo.</p>
        <Link to="/download" className={styles.cta}>
          Empezar a descargar
        </Link>
      </div>

      <div className={styles.features}>
        <div className={styles.card}>
          <span>🎬</span>
          <h3>Vídeo MP4</h3>
          <p>Hasta 4K. Elige la resolución que necesitas.</p>
        </div>
        <div className={styles.card}>
          <span>🎵</span>
          <h3>Solo Audio MP3</h3>
          <p>Extrae el audio en máxima calidad.</p>
        </div>
        <div className={styles.card}>
          <span>⚡</span>
          <h3>Sin límites</h3>
          <p>Sin restricciones de tamaño ni timeout.</p>
        </div>
      </div>
    </div>
  )
}
