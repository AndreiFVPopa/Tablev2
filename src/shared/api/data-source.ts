export const DATA_SOURCES = {
  FIXTURE: "fixture",
  HTTP: "http",
} as const;

export type DataSourceKind = (typeof DATA_SOURCES)[keyof typeof DATA_SOURCES];

export function resolveDataSource(env: ImportMetaEnv = import.meta.env): DataSourceKind {
  return env.VITE_DATA_SOURCE === DATA_SOURCES.HTTP ? DATA_SOURCES.HTTP : DATA_SOURCES.FIXTURE;
}
