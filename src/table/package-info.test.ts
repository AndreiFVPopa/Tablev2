import { describe, it, expect } from "vitest";

import { TABLE_PACKAGE_VERSION, TABLE_PEER_DEPENDENCIES, type TablePeerDependency } from "./index";
describe("table package-info", () => {
  it("exposes a stable, non-empty version marker", () => {
    expect(TABLE_PACKAGE_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
  it("documents the accepted peer dependencies", () => {
    expect([...TABLE_PEER_DEPENDENCIES].toSorted((a, b) => a.localeCompare(b))).toEqual([
      "@tanstack/react-router",
      "@tanstack/react-table",
      "react",
      "zod",
    ]);
  });
  it("does not list router-adjacent libraries we explicitly reject", () => {
    const rejected: TablePeerDependency[] = [];
    for (const dep of TABLE_PEER_DEPENDENCIES) {
      if (dep === ("@tanstack/react-query" as TablePeerDependency)) {
        rejected.push(dep);
      }
    }
    expect(rejected).toEqual([]);
  });
});
