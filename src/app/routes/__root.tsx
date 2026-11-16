import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

import styles from "../app.module.scss";

function RootLayout(): React.JSX.Element {
  return (
    <div className={styles.appShell}>
      <header className={styles.appShell__header}>
        <h1>Schema-Driven Data Table</h1>
        <p>Tabel schema-driven pentru elevi, cu stare în URL.</p>
        <nav className={styles.appShell__nav} aria-label="Secțiuni">
          <Link to="/elevi" className={styles.appShell__navLink}>
            Elevi
          </Link>
        </nav>
      </header>
      <main className={styles.appShell__main}>
        <Outlet />
      </main>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
