import { describe, it, expect } from "vitest";
import { makeInviteCode, richness, hasSupabase } from "./couple";
import { defaultData } from "./migrations";
import { shuffled } from "./utils";

describe("makeInviteCode", () => {
  it("makes 6-char codes from the unambiguous alphabet", () => {
    const code = makeInviteCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
    expect(code).not.toMatch(/[0O1IL]/);
  });
  it("is deterministic under an injected rng", () => {
    expect(makeInviteCode(() => 0)).toBe("AAAAAA");
    expect(makeInviteCode(() => 0.999)).toBe("999999");
  });
});

describe("richness", () => {
  it("ranks a lived-in profile above a fresh one", () => {
    const fresh = defaultData();
    const lived = defaultData();
    lived.partnerName = "Lindsay";
    lived.preferences.musicians = ["gorillaz"];
    lived.trackedBrands = [{ name: "HOKA", domain: "hoka.com", tags: [], addedAt: "", notify: true }];
    lived.discoveredAnswers = { fav_artist: "gorillaz" };
    expect(richness(lived)).toBeGreaterThan(richness(fresh));
    expect(richness(fresh)).toBe(0);
    expect(richness(null)).toBe(0);
  });
});

describe("hasSupabase", () => {
  it("reflects whether env keys are configured", () => {
    expect(typeof hasSupabase()).toBe("boolean");
  });
});

describe("shuffled", () => {
  it("permutes without mutating and keeps every element", () => {
    const src = Array.from({ length: 50 }, (_, i) => i);
    const out = shuffled(src);
    expect(out).toHaveLength(50);
    expect([...out].sort((a, b) => a - b)).toEqual(src);
    expect(src[0]).toBe(0); // untouched
  });
});
