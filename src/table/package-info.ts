export const TABLE_PACKAGE_VERSION = "0.1.0" as const;
export const TABLE_PEER_DEPENDENCIES = [
  "react",
  "@tanstack/react-table",
  "@tanstack/react-router",
  "zod",
] as const;
export type TablePeerDependency = (typeof TABLE_PEER_DEPENDENCIES)[number];
