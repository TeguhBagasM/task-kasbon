import { describe, expect, it } from "vitest";
import { escapeLikePattern } from "./search";

describe("escapeLikePattern", () => {
  it("membiarkan teks biasa dan string kosong", () => {
    expect(escapeLikePattern("budi")).toBe("budi");
    expect(escapeLikePattern("")).toBe("");
  });

  it("meng-escape %, _, dan backslash", () => {
    expect(escapeLikePattern("100%")).toBe("100\\%");
    expect(escapeLikePattern("a_b")).toBe("a\\_b");
    expect(escapeLikePattern("a\\b")).toBe("a\\\\b");
  });

  it("menangani kombinasi sekaligus", () => {
    expect(escapeLikePattern("%_\\")).toBe("\\%\\_\\\\");
  });
});
