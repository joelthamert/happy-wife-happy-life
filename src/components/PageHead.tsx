import type { ReactNode } from "react";
import { T, ffd, eyebrow } from "../theme";
import Reveal from "./Reveal";

/* ──── PAGE HEADER (hoisted — stable identity) ──── */
const PageHead = ({ kicker, title, action }: { kicker: string; title: string; action?: ReactNode }) => (
  <Reveal>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
      <div>
        <div style={{ ...eyebrow, marginBottom: 7 }}>{kicker}</div>
        <h2 style={{ fontSize: 30, fontFamily: ffd, fontWeight: 400, fontStyle: "italic", color: T.ink, margin: 0, letterSpacing: "0.01em", lineHeight: 1 }}>{title}</h2>
      </div>
      {action}
    </div>
  </Reveal>
);
export default PageHead;
