import { describe, it, expect } from "vitest";
import { isConfidentMatch, pickArtistMatch, pendingMusicians } from "./artistSync";
import { defaultData } from "./migrations";
import type { AppData, FollowedArtist } from "../types";

const artist = (id: string, name: string): FollowedArtist => ({ id, name, imageUrl: null, genre: "" });

describe("pickArtistMatch", () => {
  it("prefers the exact case-insensitive match over the first result", () => {
    const results = [artist("sg:1", "Gorillaz Tribute Band"), artist("sg:2", "Gorillaz")];
    expect(pickArtistMatch("gorillaz", results)?.id).toBe("sg:2");
  });
  it("accepts a confident first result (name containment)", () => {
    expect(pickArtistMatch("morgan wallen", [artist("sg:3", "Morgan Wallen")])?.id).toBe("sg:3");
    expect(pickArtistMatch("Taylor Swift", [artist("sg:4", "Taylor Swift | The Eras Tour")])?.id).toBe("sg:4");
  });
  it("rejects unrelated first results instead of mis-following", () => {
    expect(pickArtistMatch("country music", [artist("sg:5", "Luke Bryan")])).toBeNull();
    expect(pickArtistMatch("anything upbeat", [])).toBeNull();
  });
});

describe("isConfidentMatch", () => {
  it("matches both containment directions, case-insensitive", () => {
    expect(isConfidentMatch("gorillaz", artist("x", "GORILLAZ"))).toBe(true);
    expect(isConfidentMatch("the gorillaz band", artist("x", "Gorillaz"))).toBe(true);
    expect(isConfidentMatch("jazz", artist("x", "Hiromi"))).toBe(false);
  });
});

describe("pendingMusicians", () => {
  const dataWith = (musicians: string[], followed: FollowedArtist[] = []): AppData => ({
    ...defaultData(),
    preferences: { ...defaultData().preferences, musicians },
    followedArtists: followed,
  });

  it("returns musicians not yet followed and never attempted", () => {
    expect(pendingMusicians(dataWith(["gorillaz", "Hozier"]), {})).toEqual(["gorillaz", "Hozier"]);
  });
  it("skips already-followed names case-insensitively", () => {
    const d = dataWith(["gorillaz"], [artist("sg:2", "Gorillaz")]);
    expect(pendingMusicians(d, {})).toEqual([]);
  });
  it("skips logged attempts — null no-matches and deliberate unfollows alike", () => {
    const d = dataWith(["country music", "gorillaz"]);
    expect(pendingMusicians(d, { "country music": null, gorillaz: "sg:2" })).toEqual([]);
  });
});
