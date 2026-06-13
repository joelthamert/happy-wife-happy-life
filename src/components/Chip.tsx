import { ff } from "../theme";

const Chip = ({ text, onRemove }: { text: string; onRemove?: () => void }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 999, background: "rgba(255,122,156,0.08)", border: "1px solid rgba(255,122,156,0.20)", boxShadow: "inset 0 1px 0 var(--highlight)", color: "var(--rose-text)", fontSize: 13, fontWeight: 500, fontFamily: ff, animation: "pop .3s cubic-bezier(.2,1,.3,1)" }}>
    {text}{onRemove && <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--rose-text)", opacity: 0.5, padding: 0, fontSize: 15, lineHeight: 1 }}>×</button>}
  </span>
);
export default Chip;
