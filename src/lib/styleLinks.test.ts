import { describe, it, expect } from "vitest";
import { styleQuery, styleLinks, styleReminders } from "./styleLinks";

describe("styleQuery", () => {
  it("is just the brand name with no colours", () => {
    expect(styleQuery("Lululemon")).toBe("Lululemon");
  });
  it("appends the first non-empty colour", () => {
    expect(styleQuery("Lululemon", ["", "  ", "sage green", "blush"])).toBe("Lululemon sage green");
  });
});

describe("styleLinks", () => {
  it("leads with LTK and includes Pinterest + Google Shopping", () => {
    const links = styleLinks({ name: "Madewell" });
    expect(links.map(l => l.name)).toEqual(["LTK", "Pinterest", "Google Shopping"]);
    expect(links[0].hero).toBe(true);
    expect(links[0].url).toBe("https://www.shopltk.com/search?q=Madewell");
    expect(links[1].url).toContain("pinterest.com/search/pins");
    expect(links[1].url).toContain("outfit");
    expect(links[2].url).toContain("tbm=shop");
  });
  it("biases every link toward the partner's top colour", () => {
    const links = styleLinks({ name: "Reformation" }, { colors: ["emerald"] });
    expect(links[0].url).toBe("https://www.shopltk.com/search?q=Reformation%20emerald");
    expect(links[1].url).toContain("Reformation%20emerald%20outfit");
    expect(links[2].url).toContain("Reformation%20emerald");
  });
});

describe("styleReminders", () => {
  it("surfaces sizes plus colours beyond the one steering the search", () => {
    const r = styleReminders({ clothing: ["M top", "size 8 dress"], colors: ["emerald", "blush", "cream"] });
    expect(r).toEqual(["M top", "size 8 dress", "blush", "cream"]);
  });
  it("is empty with nothing on file", () => {
    expect(styleReminders()).toEqual([]);
  });
});
