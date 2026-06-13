import { describe, it, expect } from "vitest";
import { StubSaleAlertProvider, dealLinks } from "./saleAlerts";
import type { TrackedBrand } from "../types";

const brand = (over: Partial<TrackedBrand> = {}): TrackedBrand => ({
  name: "Lululemon", domain: "lululemon.com", tags: ["athletic"], addedAt: "2026-01-01T00:00:00.000Z", notify: true, ...over,
});

describe("StubSaleAlertProvider", () => {
  it("returns alerts for notify-enabled brands during sale season", async () => {
    const nov = new StubSaleAlertProvider(() => new Date(2026, 10, 20));
    const alerts = await nov.fetchAlerts([brand()]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].brand).toBe("Lululemon");
    expect(alerts[0].title).toContain("Black Friday");
    expect(alerts[0].url).toBe("https://lululemon.com");
    expect(alerts[0].source).toBe("stub");
  });
  it("skips brands with alerts muted", async () => {
    const nov = new StubSaleAlertProvider(() => new Date(2026, 10, 20));
    expect(await nov.fetchAlerts([brand({ notify: false })])).toHaveLength(0);
  });
  it("returns nothing outside sale seasons", async () => {
    const march = new StubSaleAlertProvider(() => new Date(2026, 2, 10));
    expect(await march.fetchAlerts([brand()])).toHaveLength(0);
  });
  it("handles custom brands without a domain", async () => {
    const dec = new StubSaleAlertProvider(() => new Date(2026, 11, 5));
    const alerts = await dec.fetchAlerts([brand({ name: "Local Boutique", domain: null })]);
    expect(alerts[0].url).toBeNull();
  });
});

describe("dealLinks", () => {
  it("builds domain-based aggregator links plus name-based search links", () => {
    const links = dealLinks({ name: "HOKA", domain: "hoka.com" });
    expect(links.map(l => l.name)).toEqual(["CouponFollow", "RetailMeNot", "Slickdeals", "Sale section"]);
    expect(links[0].url).toBe("https://couponfollow.com/site/hoka.com");
    expect(links[1].url).toBe("https://www.retailmenot.com/view/hoka.com");
    expect(links[2].url).toContain("slickdeals.net");
    expect(links[2].url).toContain("HOKA");
  });
  it("skips domain-based sources for custom brands without a domain", () => {
    const links = dealLinks({ name: "Local Boutique", domain: null });
    expect(links.map(l => l.name)).toEqual(["Slickdeals", "Sale section"]);
    expect(links[0].url).toContain("Local%20Boutique");
  });
});
