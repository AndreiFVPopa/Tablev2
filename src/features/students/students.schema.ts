import { z } from "zod";

import { STUDENT_GRADES, STUDENT_TAGS } from "./students.constants";

const studentGradeSchema = z.enum([
  STUDENT_GRADES.V,
  STUDENT_GRADES.VI,
  STUDENT_GRADES.VII,
  STUDENT_GRADES.VIII,
  STUDENT_GRADES.IX,
  STUDENT_GRADES.X,
  STUDENT_GRADES.XI,
  STUDENT_GRADES.XII,
]);

const studentTagSchema = z.enum([
  STUDENT_TAGS.BURSA,
  STUDENT_TAGS.OLIMPIC,
  STUDENT_TAGS.TRANSFER,
  STUDENT_TAGS.REPETENT,
]);

export const studentSchema = z
  .object({
    id: z.string().min(1).meta({ title: "ID" }),
    name: z.string().min(2).max(80).meta({ title: "Nume" }),
    email: z.email().meta({ title: "Email" }),
    age: z.number().int().min(10).max(20).meta({ title: "Vârstă" }),
    grade: studentGradeSchema.meta({ title: "Clasă" }),
    active: z.boolean().meta({ title: "Activ" }),
    enrolledAt: z.coerce.date().meta({ title: "Înscris" }),
    gpa: z.number().min(1).max(10).nullable().optional().meta({ title: "Media" }),
    tags: z.array(studentTagSchema).meta({ title: "Etichete" }),
    address: z
      .object({
        city: z.string().min(2).meta({ title: "Oraș" }),
        county: z.string().min(2).meta({ title: "Județ" }),
      })
      .meta({ title: "Adresă" }),
    notes: z.string().max(200).nullable().optional().meta({ title: "Note" }),
  })
  .meta({ title: "Elev" });

export const studentsDatasetSchema = z.array(studentSchema);
