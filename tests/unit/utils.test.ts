import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils/cn";
import { slugify, initials, truncate } from "@/lib/utils/strings";

describe("cn", () => {
  it("merges class names and resolves Tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe("text-sm font-bold");
  });
});

describe("slugify", () => {
  it("converts a string into a URL-safe slug", () => {
    expect(slugify("GrowPilot Demo Agency")).toBe("growpilot-demo-agency");
    expect(slugify("  Multiple   Spaces  ")).toBe("multiple-spaces");
  });
});

describe("initials", () => {
  it("extracts up to two initials from a full name", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("Madonna")).toBe("M");
  });
});

describe("truncate", () => {
  it("truncates long strings with an ellipsis", () => {
    expect(truncate("Hello World", 5)).toBe("Hell…");
    expect(truncate("Hi", 5)).toBe("Hi");
  });
});
