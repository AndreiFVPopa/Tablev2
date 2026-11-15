import { describe, expect, it } from "vitest";

import { ariaSortFor } from "./aria-sort";

describe("ariaSortFor", () => {
  it("maps asc and desc to ARIA ascending / descending", () => {
    expect(ariaSortFor("asc", true)).toBe("ascending");
    expect(ariaSortFor("desc", true)).toBe("descending");
  });

  it("returns none for unsorted sortable columns", () => {
    expect(ariaSortFor(false, true)).toBe("none");
  });

  it("omits aria-sort for non-sortable columns", () => {
    expect(ariaSortFor(false, false)).toBeUndefined();
  });
});
