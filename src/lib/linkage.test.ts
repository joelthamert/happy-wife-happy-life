/**
 * Linkage coverage — the product guarantee that answering ANY flashcard
 * does something useful downstream. Every card must be consumed by at
 * least one feature pipeline; add a consumer before adding a card.
 */
import { describe, it, expect } from "vitest";
import { FLASHCARDS } from "../data/flashcards";
import { DATE_IDEA_CARD_IDS, dateIdeas, DATE_IDEA_RULES } from "./dateIdeas";
import { GIFT_INTEL_CARD_IDS, giftSuggestions } from "./giftIntel";
import { defaultData } from "./migrations";
import type { AppData } from "../types";

/* preference buckets with dedicated pipelines:
 * musicians → artistSync auto-follow → Events tour dates → concert gift
 * brands    → trackedBrands → Deals sheet + sale alerts + gift card gift
 * foods     → dinner gift + Dine tab favorites
 * flowers   → bouquet gift + flower tips on reservations/home
 * scents    → candle/perfume gift
 * clothing  → sized-piece gift (personalized by colors)
 * hobbies   → hobby gift + lessons gift
 * colors    → colors the clothing gift; never-wear guardrail */
const PIPELINE_MAPTO = new Set(["musicians", "brands", "foods", "flowers", "scents", "clothing", "hobbies", "colors"]);

describe("every flashcard answer leads somewhere", () => {
  it("each of the 152 cards is consumed by a pipeline, date ideas, or gift intel", () => {
    const orphans = FLASHCARDS.filter(c =>
      !PIPELINE_MAPTO.has(c.mapTo) &&
      !DATE_IDEA_CARD_IDS.has(c.id) &&
      !GIFT_INTEL_CARD_IDS.has(c.id)
    ).map(c => c.id);
    expect(orphans).toEqual([]);
  });

  it("date-idea rules reference only real card ids", () => {
    const known = new Set(FLASHCARDS.map(c => c.id));
    const ghost = [...DATE_IDEA_CARD_IDS].filter(id => !known.has(id));
    expect(ghost).toEqual([]);
  });
});

describe("dateIdeas", () => {
  const withAnswers = (answers: Record<string, string>): AppData => ({ ...defaultData(), discoveredAnswers: answers });

  it("turns answers into personalized plans", () => {
    const ideas = dateIdeas(withAnswers({
      x_karaoke: "Dancing Queen",
      x_show_rewatch: "New Girl",
      x_competitive: "Mario Kart",
      x_tradition: "Sunday pancakes",
    }), 10);
    expect(ideas.find(i => i.title === "Karaoke night")?.detail).toContain("Dancing Queen");
    expect(ideas.find(i => i.title.includes("Cozy night"))?.detail).toContain("New Girl");
    expect(ideas.find(i => i.title.includes("Game night"))?.detail).toContain("Mario Kart");
    expect(ideas.find(i => i.title === "Start the tradition")?.detail).toBe("Sunday pancakes");
  });

  it("returns nothing without answers and respects the limit", () => {
    expect(dateIdeas(defaultData())).toEqual([]);
    const many = withAnswers(Object.fromEntries(DATE_IDEA_RULES.flatMap(r => r.ids.map(id => [id, "x"]))));
    expect(dateIdeas(many, 3)).toHaveLength(3);
  });

  it("prefers live music via followed artists", () => {
    const d = withAnswers({ x_live_vibe: "Small venue" });
    d.followedArtists = [{ id: "sg:1", name: "Gorillaz", imageUrl: null }];
    const idea = dateIdeas(d, 10).find(i => i.title.includes("Gorillaz"));
    expect(idea?.detail).toContain("small venue");
  });
});

describe("giftIntel consumes the deep answers", () => {
  it("colors personalize the clothing gift and never-wear is a guardrail", () => {
    const d = defaultData();
    d.preferences.clothing = ["M / 8 / 8.5"];
    d.preferences.colors = ["Sage green"];
    d.discoveredAnswers = { x_color_nope: "Orange" };
    const { suggestions } = giftSuggestions(d);
    const piece = suggestions.find(s => s.kind === "clothing");
    expect(piece?.title).toContain("sage green");
    expect(piece?.detail).toContain("never orange");
  });

  it("growth answers become a lessons gift; spa answers a booking", () => {
    const d = defaultData();
    d.discoveredAnswers = { x_grow: "pottery", x_spa: "yes please" };
    const { suggestions } = giftSuggestions(d);
    expect(suggestions.find(s => s.title.includes("pottery"))).toBeDefined();
    expect(suggestions.find(s => s.title.includes("Spa day"))).toBeDefined();
  });
});
