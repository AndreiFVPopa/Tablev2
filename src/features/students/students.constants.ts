export const STUDENT_GRADES = {
  V: "V",
  VI: "VI",
  VII: "VII",
  VIII: "VIII",
  IX: "IX",
  X: "X",
  XI: "XI",
  XII: "XII",
} as const;

export const STUDENT_GENDER = {
  MALE: "male",
  FEMALE: "female",
} as const;

export const STUDENT_GENDER_LABELS = {
  [STUDENT_GENDER.MALE]: "Masculin",
  [STUDENT_GENDER.FEMALE]: "Feminin",
} as const;

export const STUDENT_TAGS = {
  BURSA: "bursă",
  OLIMPIC: "olimpic",
  TRANSFER: "transfer",
  REPETENT: "repetent",
} as const;
