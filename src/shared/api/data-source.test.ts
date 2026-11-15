import { describe, expect, it } from "vitest";

import { DATA_SOURCES, resolveDataSource } from "./data-source";

describe("resolveDataSource", () => {
  it("defaults to fixture", () => {
    expect(resolveDataSource({} as ImportMetaEnv)).toBe(DATA_SOURCES.FIXTURE);
  });

  it("selects http when VITE_DATA_SOURCE is http", () => {
    expect(resolveDataSource({ VITE_DATA_SOURCE: "http" } as ImportMetaEnv)).toBe(
      DATA_SOURCES.HTTP,
    );
  });

  it("treats unknown values as fixture", () => {
    expect(resolveDataSource({ VITE_DATA_SOURCE: "fixture" } as ImportMetaEnv)).toBe(
      DATA_SOURCES.FIXTURE,
    );
  });
});
