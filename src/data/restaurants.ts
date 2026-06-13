/**
 * Curated MICHELIN Guide picks for date nights — a static snapshot of
 * Guide-recognized restaurants (stars, Bib Gourmand), Florida-weighted with
 * destination icons for trips. Not a live feed: verify current status on
 * guide.michelin.com (the "Guide" button on each card searches it).
 */
export type Distinction = "3 stars" | "2 stars" | "1 star" | "Bib Gourmand";

export interface Restaurant {
  name: string;
  city: string;
  state: string;
  cuisine: string;
  distinction: Distinction;
  price: 1 | 2 | 3 | 4; // $ … $$$$
  lat: number;
  lng: number;
  rating: number; // Google rating out of 5 — curated snapshot, not a live feed
}

export const RESTAURANT_DB: Restaurant[] = [
  /* ── Orlando & Central Florida ── */
  { name: "Victoria & Albert's", city: "Orlando", state: "FL", cuisine: "Contemporary", distinction: "1 star", price: 4, lat: 28.4111, lng: -81.5872, rating: 4.9 },
  { name: "Capa", city: "Orlando", state: "FL", cuisine: "Steakhouse", distinction: "1 star", price: 4, lat: 28.3852, lng: -81.5499, rating: 4.6 },
  { name: "Knife & Spoon", city: "Orlando", state: "FL", cuisine: "Steakhouse", distinction: "1 star", price: 4, lat: 28.3870, lng: -81.4260, rating: 4.6 },
  { name: "Soseki", city: "Winter Park", state: "FL", cuisine: "Japanese", distinction: "1 star", price: 4, lat: 28.5912, lng: -81.3640, rating: 4.9 },
  { name: "Kadence", city: "Orlando", state: "FL", cuisine: "Sushi", distinction: "1 star", price: 4, lat: 28.5702, lng: -81.3510, rating: 4.9 },
  { name: "Camille", city: "Orlando", state: "FL", cuisine: "Contemporary", distinction: "1 star", price: 3, lat: 28.5530, lng: -81.3650, rating: 4.8 },
  { name: "Sorekara", city: "Orlando", state: "FL", cuisine: "Japanese", distinction: "1 star", price: 4, lat: 28.5527, lng: -81.3892, rating: 4.9 },
  { name: "Ômo by Jônt", city: "Winter Park", state: "FL", cuisine: "Contemporary", distinction: "2 stars", price: 4, lat: 28.5963, lng: -81.3512, rating: 4.8 },
  { name: "The Ravenous Pig", city: "Winter Park", state: "FL", cuisine: "Gastropub", distinction: "Bib Gourmand", price: 2, lat: 28.5921, lng: -81.3530, rating: 4.6 },
  { name: "Kaya", city: "Orlando", state: "FL", cuisine: "Filipino", distinction: "Bib Gourmand", price: 2, lat: 28.5701, lng: -81.3528, rating: 4.7 },
  { name: "Domu", city: "Orlando", state: "FL", cuisine: "Ramen", distinction: "Bib Gourmand", price: 2, lat: 28.5697, lng: -81.3502, rating: 4.5 },
  { name: "Z Asian", city: "Orlando", state: "FL", cuisine: "Vietnamese", distinction: "Bib Gourmand", price: 1, lat: 28.5524, lng: -81.3438, rating: 4.7 },
  { name: "Papa Llama", city: "Orlando", state: "FL", cuisine: "Peruvian", distinction: "Bib Gourmand", price: 2, lat: 28.5118, lng: -81.3437, rating: 4.8 },

  /* ── Tampa Bay ── */
  { name: "Lilac", city: "Tampa", state: "FL", cuisine: "Contemporary", distinction: "1 star", price: 4, lat: 27.9420, lng: -82.4520, rating: 4.7 },
  { name: "Rocca", city: "Tampa", state: "FL", cuisine: "Italian", distinction: "1 star", price: 3, lat: 27.9655, lng: -82.4600, rating: 4.7 },
  { name: "Kōya", city: "Tampa", state: "FL", cuisine: "Japanese", distinction: "1 star", price: 4, lat: 27.9658, lng: -82.4604, rating: 4.9 },
  { name: "Ebbe", city: "Tampa", state: "FL", cuisine: "Contemporary", distinction: "1 star", price: 4, lat: 27.9466, lng: -82.4585, rating: 4.8 },
  { name: "Rooster & the Till", city: "Tampa", state: "FL", cuisine: "Contemporary", distinction: "Bib Gourmand", price: 2, lat: 28.0040, lng: -82.4630, rating: 4.7 },

  /* ── Miami ── */
  { name: "L'Atelier de Joël Robuchon", city: "Miami", state: "FL", cuisine: "French", distinction: "2 stars", price: 4, lat: 25.8133, lng: -80.1930, rating: 4.7 },
  { name: "Le Jardinier", city: "Miami", state: "FL", cuisine: "French", distinction: "1 star", price: 3, lat: 25.8131, lng: -80.1925, rating: 4.6 },
  { name: "Ariete", city: "Coconut Grove", state: "FL", cuisine: "Contemporary", distinction: "1 star", price: 3, lat: 25.7270, lng: -80.2430, rating: 4.5 },
  { name: "Boia De", city: "Miami", state: "FL", cuisine: "Italian", distinction: "1 star", price: 3, lat: 25.8380, lng: -80.2000, rating: 4.6 },
  { name: "Stubborn Seed", city: "Miami Beach", state: "FL", cuisine: "Contemporary", distinction: "1 star", price: 4, lat: 25.7700, lng: -80.1320, rating: 4.6 },
  { name: "COTE Miami", city: "Miami", state: "FL", cuisine: "Korean Steakhouse", distinction: "1 star", price: 4, lat: 25.8132, lng: -80.1933, rating: 4.6 },
  { name: "The Surf Club Restaurant", city: "Surfside", state: "FL", cuisine: "American", distinction: "1 star", price: 4, lat: 25.8780, lng: -80.1210, rating: 4.6 },
  { name: "Tambourine Room", city: "Surfside", state: "FL", cuisine: "French", distinction: "1 star", price: 4, lat: 25.8786, lng: -80.1222, rating: 4.8 },
  { name: "Shingo", city: "Coral Gables", state: "FL", cuisine: "Sushi", distinction: "1 star", price: 4, lat: 25.7500, lng: -80.2630, rating: 4.9 },
  { name: "EntreNos", city: "Miami Shores", state: "FL", cuisine: "Contemporary", distinction: "1 star", price: 3, lat: 25.8620, lng: -80.1840, rating: 4.8 },
  { name: "Ogawa", city: "Miami", state: "FL", cuisine: "Sushi", distinction: "1 star", price: 4, lat: 25.8460, lng: -80.1920, rating: 4.9 },
  { name: "Lung Yai Thai Tapas", city: "Miami", state: "FL", cuisine: "Thai", distinction: "Bib Gourmand", price: 1, lat: 25.7657, lng: -80.2100, rating: 4.5 },
  { name: "Zitz Sum", city: "Coral Gables", state: "FL", cuisine: "Asian", distinction: "Bib Gourmand", price: 2, lat: 25.7510, lng: -80.2570, rating: 4.6 },
  { name: "Sanguich de Miami", city: "Miami", state: "FL", cuisine: "Cuban", distinction: "Bib Gourmand", price: 1, lat: 25.7656, lng: -80.2190, rating: 4.8 },

  /* ── Destination icons (trip-worthy) ── */
  { name: "Le Bernardin", city: "New York", state: "NY", cuisine: "Seafood", distinction: "3 stars", price: 4, lat: 40.7615, lng: -73.9819, rating: 4.8 },
  { name: "Eleven Madison Park", city: "New York", state: "NY", cuisine: "Contemporary", distinction: "3 stars", price: 4, lat: 40.7416, lng: -73.9872, rating: 4.6 },
  { name: "Per Se", city: "New York", state: "NY", cuisine: "Contemporary", distinction: "3 stars", price: 4, lat: 40.7683, lng: -73.9830, rating: 4.5 },
  { name: "Atomix", city: "New York", state: "NY", cuisine: "Korean", distinction: "2 stars", price: 4, lat: 40.7446, lng: -73.9849, rating: 4.8 },
  { name: "Alinea", city: "Chicago", state: "IL", cuisine: "Contemporary", distinction: "3 stars", price: 4, lat: 41.9134, lng: -87.6483, rating: 4.8 },
  { name: "Smyth", city: "Chicago", state: "IL", cuisine: "Contemporary", distinction: "3 stars", price: 4, lat: 41.8838, lng: -87.6486, rating: 4.8 },
  { name: "The French Laundry", city: "Yountville", state: "CA", cuisine: "French", distinction: "3 stars", price: 4, lat: 38.4044, lng: -122.3648, rating: 4.7 },
  { name: "SingleThread", city: "Healdsburg", state: "CA", cuisine: "Contemporary", distinction: "3 stars", price: 4, lat: 38.6111, lng: -122.8700, rating: 4.8 },
  { name: "Atelier Crenn", city: "San Francisco", state: "CA", cuisine: "French", distinction: "3 stars", price: 4, lat: 37.7982, lng: -122.4365, rating: 4.7 },
  { name: "Quince", city: "San Francisco", state: "CA", cuisine: "Contemporary", distinction: "3 stars", price: 4, lat: 37.7973, lng: -122.4034, rating: 4.7 },
  { name: "Providence", city: "Los Angeles", state: "CA", cuisine: "Seafood", distinction: "2 stars", price: 4, lat: 34.0837, lng: -118.3088, rating: 4.8 },
  { name: "n/naka", city: "Los Angeles", state: "CA", cuisine: "Japanese", distinction: "2 stars", price: 4, lat: 34.0227, lng: -118.4106, rating: 4.8 },
  { name: "Joël Robuchon", city: "Las Vegas", state: "NV", cuisine: "French", distinction: "3 stars", price: 4, lat: 36.1025, lng: -115.1700, rating: 4.8 },
  { name: "The Inn at Little Washington", city: "Washington", state: "VA", cuisine: "Contemporary", distinction: "3 stars", price: 4, lat: 38.7132, lng: -78.1594, rating: 4.8 },
];

export const DISTINCTION_BADGE: Record<Distinction, string> = {
  "3 stars": "✦✦✦",
  "2 stars": "✦✦",
  "1 star": "✦",
  "Bib Gourmand": "ʙɪʙ",
};
