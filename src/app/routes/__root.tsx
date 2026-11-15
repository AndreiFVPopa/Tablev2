import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

import styles from "../app.module.scss";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayout(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <h1>Schema-Driven Data Table</h1>
          <p>Tabele schema-driven pentru elevi și produse, cu stare în URL.</p>
          <nav className={styles.nav} aria-label="Secțiuni">
            <Link to="/elevi" className={styles.navLink}>
              Elevi
            </Link>
            <Link to="/produse" className={styles.navLink}>
              Produse
            </Link>
          </nav>
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
