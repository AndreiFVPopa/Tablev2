import { DataTable } from "@table/index";

import styles from "./students-page.module.scss";
import { studentsDataset } from "./students.dataset";
import { studentSchema } from "./students.schema";

export function StudentsPage(): React.JSX.Element {
  return (
    <article className={styles.studentsPage}>
      <header className={styles.studentsPage__header}>
        <h2>Elevi</h2>
        <p>Tabel generat din schema Zod a elevilor.</p>
      </header>
      <DataTable schema={studentSchema} data={studentsDataset} />
    </article>
  );
}
