import { useQuery } from "@tanstack/react-query";

import { DataTable } from "@table/index";

import { studentsQueryOptions } from "./api/students.queries";
import styles from "./students-page.module.scss";
import { studentSchema } from "./students.schema";

export function StudentsPage(): React.JSX.Element {
  const query = useQuery(studentsQueryOptions());

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <h2>Elevi</h2>
        <p>Tabel generat din schema Zod a elevilor.</p>
      </header>
      {query.isPending ? <p className={styles.status}>Se încarcă elevii…</p> : null}
      {query.isError ? (
        <p className={styles.error} role="alert">
          {query.error.message}
        </p>
      ) : null}
      {query.isSuccess ? <DataTable schema={studentSchema} data={query.data} /> : null}
    </article>
  );
}
