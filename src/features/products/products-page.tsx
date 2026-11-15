import { useQuery } from "@tanstack/react-query";

import { DataTable } from "@table/index";

import { productsQueryOptions } from "./api/products.queries";
import styles from "./products-page.module.scss";
import { productSchema } from "./products.schema";

export function ProductsPage(): React.JSX.Element {
  const query = useQuery(productsQueryOptions());

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <h2>Produse</h2>
        <p>Tabel generat din schema Zod a produselor.</p>
      </header>
      {query.isPending ? <p className={styles.status}>Se încarcă produsele…</p> : null}
      {query.isError ? (
        <p className={styles.error} role="alert">
          {query.error.message}
        </p>
      ) : null}
      {query.isSuccess ? <DataTable schema={productSchema} data={query.data} /> : null}
    </article>
  );
}
