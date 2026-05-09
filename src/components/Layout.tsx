import { Outlet, NavLink } from 'react-router-dom'
import styles from './Layout.module.css'

export default function Layout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <NavLink to="/" className={styles.logo}>
          <span className={styles.logoIcon}>▶</span>
          aTubeCatcher
        </NavLink>
        <nav className={styles.nav}>
          <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : ''}>
            Inicio
          </NavLink>
          <NavLink to="/download" className={({ isActive }) => isActive ? styles.active : ''}>
            Descargar
          </NavLink>
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <p>aTubeCatcher · Solo para uso personal</p>
      </footer>
    </div>
  )
}
