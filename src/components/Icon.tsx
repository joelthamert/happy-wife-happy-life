/* Minimal line icons for chrome (dock, trays) — 24px grid, stroke-based,
 * currentColor so active/inactive states are pure CSS color. Content areas
 * keep their emoji warmth; these are for navigation only. */
import type { ReactNode } from "react";

const P: Record<string, ReactNode> = {
  home: (
    <path d="M4 10.5 12 4l8 6.5V19a1.2 1.2 0 0 1-1.2 1.2h-4.3v-5.7h-5v5.7H5.2A1.2 1.2 0 0 1 4 19z" />
  ),
  plus: (
    <><path d="M12 5.5v13" /><path d="M5.5 12h13" /></>
  ),
  cards: (
    <><rect x="5" y="3.8" width="11.5" height="16.4" rx="2.2" /><path d="M19.8 7.2v9.6" /></>
  ),
  tag: (
    <><path d="M20.2 3.8h-7.4l-9 9 7.4 7.4 9-9z" /><circle cx="16.2" cy="7.8" r="1.2" /></>
  ),
  calendar: (
    <><rect x="4" y="5.6" width="16" height="14.6" rx="2.2" /><path d="M4 10h16" /><path d="M8.3 3.4v3.6" /><path d="M15.7 3.4v3.6" /></>
  ),
  wine: (
    <><path d="M7.2 3.8h9.6l-1.1 5.6a3.8 3.8 0 0 1-7.4 0z" /><path d="M12 13.6v6" /><path d="M8.6 20.4h6.8" /></>
  ),
  ticket: (
    <><path d="M3.8 9.6a2.4 2.4 0 0 0 0 4.8v3.4c0 .8.6 1.4 1.4 1.4h13.6c.8 0 1.4-.6 1.4-1.4v-3.4a2.4 2.4 0 0 1 0-4.8V6.2c0-.8-.6-1.4-1.4-1.4H5.2c-.8 0-1.4.6-1.4 1.4z" /><path d="M14.6 4.8v14.4" strokeDasharray="2.5 2.8" /></>
  ),
  gift: (
    <><path d="M4.6 11.8h14.8v7.6a1.2 1.2 0 0 1-1.2 1.2H5.8a1.2 1.2 0 0 1-1.2-1.2z" /><path d="M3.6 7.6h16.8v4.2H3.6z" /><path d="M12 7.6v13" /><path d="M12 7.4C9.2 7.4 7.6 4 12 4c4.4 0 2.8 3.4 0 3.4z" /></>
  ),
  heart: (
    <path d="M12 19.8s-7-4.4-8.5-8.4a4.5 4.5 0 0 1 8.5-2.1 4.5 4.5 0 0 1 8.5 2.1c-1.5 4-8.5 8.4-8.5 8.4z" />
  ),
  bell: (
    <><path d="M6.4 9.8a5.6 5.6 0 0 1 11.2 0c0 4.6 1.8 5.6 1.8 5.6H4.6s1.8-1 1.8-5.6" /><path d="M10.2 18.8a1.9 1.9 0 0 0 3.6 0" /></>
  ),
  pin: (
    <><path d="M12 20.6s-6.2-5.2-6.2-9.8a6.2 6.2 0 0 1 12.4 0c0 4.6-6.2 9.8-6.2 9.8z" /><circle cx="12" cy="10.6" r="2.1" /></>
  ),
  chevron: (
    <path d="M6.5 9.5 12 15l5.5-5.5" />
  ),
  shuffle: (
    <><path d="M3 17.5h3c5.5 0 6.5-11 12-11h2.5" /><path d="M3 6.5h3c2.4 0 4 2 5.2 4.6" /><path d="M12.4 13.2c1.3 2.4 2.9 4.3 5.6 4.3h2.5" /><path d="m18.2 3.8 2.8 2.7-2.8 2.7" /><path d="m18.2 14.8 2.8 2.7-2.8 2.7" /></>
  ),
};

export type IconName = keyof typeof P;

const Icon = ({ name, size = 20, strokeWidth = 1.7, style }: { name: IconName; size?: number; strokeWidth?: number; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
    {P[name]}
  </svg>
);
export default Icon;
