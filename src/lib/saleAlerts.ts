/**
 * Brand sale alerts — client interface, server to follow.
 *
 * The client only ever talks to `SaleAlertProvider`, so it ships
 * independently of any backend. Today there are two implementations:
 *
 * - `StubSaleAlertProvider` — deterministic seasonal heuristics, no network.
 * - `HttpSaleAlertProvider` — the future server/edge-function contract:
 *     POST {VITE_SALE_ALERTS_URL}/alerts
 *     body:    { brands: [{ name, domain }] }
 *     returns: SaleAlert[] (JSON, same shape as below)
 *   The server is expected to watch sale RSS/newsletter feeds or a deals
 *   API on a schedule and push via Web Push; this endpoint is the pull side.
 *
 * `getSaleAlertProvider()` picks HTTP when VITE_SALE_ALERTS_URL is set,
 * otherwise the stub — so wiring the real server is a config change.
 */
import type { TrackedBrand } from "../types";

export interface SaleAlert {
  brand: string;        // tracked brand name
  title: string;        // human-readable alert ("Up to 40% off…")
  url: string | null;   // deep link to the sale, when known
  source: "stub" | "server";
}

export interface SaleAlertProvider {
  readonly name: string;
  fetchAlerts(brands: TrackedBrand[]): Promise<SaleAlert[]>;
}

/* Months with predictable retail sale events (0-indexed) */
const SALE_SEASONS: Record<number, string> = {
  0: "New year sales",
  4: "Memorial Day sales",
  5: "Summer sales",
  6: "Summer sales",
  10: "Black Friday season",
  11: "Holiday sales",
};

export class StubSaleAlertProvider implements SaleAlertProvider {
  readonly name = "stub";
  constructor(private clock: () => Date = () => new Date()) {}
  async fetchAlerts(brands: TrackedBrand[]): Promise<SaleAlert[]> {
    const season = SALE_SEASONS[this.clock().getMonth()];
    if (!season) return [];
    return brands
      .filter(b => b.notify)
      .map(b => ({ brand: b.name, title: `${season} — check ${b.name}`, url: b.domain ? `https://${b.domain}` : null, source: "stub" as const }));
  }
}

export class HttpSaleAlertProvider implements SaleAlertProvider {
  readonly name = "server";
  constructor(private baseUrl: string) {}
  async fetchAlerts(brands: TrackedBrand[]): Promise<SaleAlert[]> {
    const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brands: brands.filter(b => b.notify).map(b => ({ name: b.name, domain: b.domain })) }),
    });
    if (!res.ok) throw new Error(`Sale alert server responded ${res.status}`);
    return (await res.json()) as SaleAlert[];
  }
}

export const getSaleAlertProvider = (): SaleAlertProvider => {
  const url = import.meta.env?.VITE_SALE_ALERTS_URL as string | undefined;
  return url ? new HttpSaleAlertProvider(url) : new StubSaleAlertProvider();
};

/* ── live deal links ──
 * Coupon APIs are affiliate-gated (publisher approval, no instant keys), so
 * the always-works path is deep links into the big aggregators' per-store
 * pages — real, current deals for that exact brand. Domain-based patterns
 * verified against couponfollow.com/site/{domain} and
 * retailmenot.com/view/{domain}; Slickdeals searches by name. */
export interface DealLink {
  name: string;
  url: string;
  note: string;
}

export const dealLinks = (brand: Pick<TrackedBrand, "name" | "domain">): DealLink[] => {
  const links: DealLink[] = [];
  if (brand.domain) {
    links.push(
      { name: "CouponFollow", url: `https://couponfollow.com/site/${brand.domain}`, note: "verified promo codes" },
      { name: "RetailMeNot", url: `https://www.retailmenot.com/view/${brand.domain}`, note: "codes & cash back" },
    );
  }
  links.push({ name: "Slickdeals", url: `https://slickdeals.net/newsearch.php?q=${encodeURIComponent(brand.name)}&searcharea=deals&searchin=first`, note: "community-found deals" });
  links.push({ name: "Sale section", url: `https://www.google.com/search?q=${encodeURIComponent(`${brand.name} sale`)}&btnI=1`, note: "the brand's own sale page" });
  return links;
};
