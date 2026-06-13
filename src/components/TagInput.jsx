import { useState } from "react";
import { glassInput, btnPrimary } from "../theme";
import Chip from "./Chip";

const TagInput = ({ items, onAdd, onRemove, placeholder }) => {
  const [v, setV] = useState("");
  const add = () => { if (v.trim()) { onAdd(v.trim()); setV(""); } };
  return (
    <div>
      {items.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>{items.map((t, i) => <Chip key={i} text={t} onRemove={() => onRemove(i)} />)}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} placeholder={placeholder} style={glassInput}
          onFocus={e => { e.target.style.borderColor = "rgba(255,122,156,0.45)"; e.target.style.boxShadow = "inset 0 1px 0 var(--highlight), 0 0 0 3px rgba(255,122,156,0.10)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--line-strong)"; e.target.style.boxShadow = "inset 0 1px 0 var(--highlight)"; }} />
        <button onClick={add} style={{ ...btnPrimary(), padding: "14px 20px", whiteSpace: "nowrap" }}>Add</button>
      </div>
    </div>
  );
};
export default TagInput;
