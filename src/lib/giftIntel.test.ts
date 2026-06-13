import { describe, it, expect } from "vitest";
import { giftSuggestions, nextOccasion } from "./giftIntel";
import { defaultData } from "./migrations";
import type { AppData } from "../types";

const localIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysFromNow = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return localIso(d); }; // local, not UTC — daysUntil counts from local midnight

const richData = (over: Partial<AppData> = {}): AppData => ({
  ...defaultData(),
  partnerName: "Lindsay",
  preferences: { ...defaultData().preferences, flowers: ["Peonies"], foods: ["Capital Grille"], scents: ["Vanilla"], musicians: ["Taylor Swift"], hobbies: ["Pilates"], clothing: ["Size M"] },
  trackedBrands: [{ name: "Lululemon", domain: "lululemon.com", tags: [], addedAt: "2026-01-01T00:00:00.000Z", notify: true }],
  ...over,
});

describe("nextOccasion", () => {
  it("returns the closest date within the horizon with a headline", () => {
    const d = richData({ dates: [
      { id: "a", label: "Anniversary", emoji: "💍", date: daysFromNow(12) },
      { id: "b", label: "Birthday", emoji: "🎂", date: daysFromNow(30) },
    ] });
    const ctx = nextOccasion(d);
    expect(ctx.occasion?.label).toBe("Anniversary");
    expect(ctx.daysLeft).toBe(12);
    expect(ctx.headline).toBe("Anniversary in 12 days");
  });
  it("returns empty context when nothing is coming up", () => {
    const ctx = nextOccasion(richData({ dates: [{ id: "a", label: "Anniversary", emoji: "💍", date: daysFromNow(200) }] }));
    expect(ctx.occasion).toBeNull();
    expect(ctx.headline).toBeNull();
  });
});

describe("giftSuggestions", () => {
  it("combines preferences into concrete suggestions", () => {
    const { suggestions } = giftSuggestions(richData());
    const titles = suggestions.map(s => s.title).join(" | ");
    expect(titles).toContain("Bouquet of peonies");
    expect(titles).toContain("Capital Grille");
  });
  it("ties the dinner suggestion to an upcoming occasion", () => {
    const d = richData({ dates: [{ id: "a", label: "Anniversary", emoji: "💍", date: daysFromNow(12) }] });
    const { context, suggestions } = giftSuggestions(d);
    expect(context.headline).toBe("Anniversary in 12 days");
    const dinner = suggestions.find(s => s.title.includes("Capital Grille"));
    expect(dinner?.detail).toContain("anniversary");
  });
  it("filters by budget", () => {
    const { suggestions } = giftSuggestions(richData(), 60);
    expect(suggestions.every(s => s.estCost <= 60)).toBe(true);
    expect(suggestions.map(s => s.title).join(" ")).toContain("peonies");
  });
  it("ranks cheap-and-fast first when the date is close", () => {
    const d = richData({ dates: [{ id: "a", label: "Anniversary", emoji: "💍", date: daysFromNow(3) }] });
    const { suggestions } = giftSuggestions(d);
    const costs = suggestions.map(s => s.estCost);
    expect(costs).toEqual([...costs].sort((a, b) => a - b));
  });
  it("surfaces saved unpurchased ideas first when no date is near", () => {
    const d = richData({ giftIdeas: [
      { id: "g1", idea: "Cashmere wrap", category: "clothing", link: "", price: "90", purchased: false },
      { id: "g2", idea: "Already bought", category: "", link: "", price: "20", purchased: true },
    ] });
    const { suggestions } = giftSuggestions(d);
    expect(suggestions[0].title).toBe("Cashmere wrap");
    expect(suggestions.map(s => s.title)).not.toContain("Already bought");
  });
  it("uses the persisted giftBudget by default", () => {
    const { suggestions } = giftSuggestions(richData({ giftBudget: 60 }));
    expect(suggestions.every(s => s.estCost <= 60)).toBe(true);
  });
});
