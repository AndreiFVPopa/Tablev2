export const DATA_MODES = {
  CLIENT: "client",
  SERVER: "server",
} as const;

export type DataMode = (typeof DATA_MODES)[keyof typeof DATA_MODES];
