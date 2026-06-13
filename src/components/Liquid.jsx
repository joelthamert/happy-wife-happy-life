import { useRef, useState } from "react";
import { T, glass } from "../theme";

/* ═══════════════════ LIQUID — glass card with cursor sheen ═══════════════════ */
const Liquid = ({ children, style: s = {}, onClick, glow = T.rose, lift = true }) => {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hov, setHov] = useState(false);
  const move = (e) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };
  return (
    <div ref={ref} onClick={onClick} onMouseMove={move} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        ...glass(), ...s,
        cursor: onClick ? "pointer" : "default",
        transform: hov && lift ? "translateY(-2px) scale(1.008)" : "translateY(0) scale(1)",
        transition: "transform .45s cubic-bezier(.2,1,.3,1), box-shadow .45s",
        boxShadow: hov
          ? `inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 var(--wash-1), 0 18px 50px rgba(0,0,0,0.45), 0 0 0 1px var(--wash-1), 0 4px 30px ${glow}1f`
          : glass().boxShadow,
      }}>
      {/* refraction sheen following cursor */}
      <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", opacity: hov ? 1 : 0, transition: "opacity .5s", background: `radial-gradient(280px circle at ${pos.x}% ${pos.y}%, rgba(255,255,255,0.09), transparent 65%)` }} />
      {/* top specular streak */}
      <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, borderRadius: 1, pointerEvents: "none", background: "linear-gradient(90deg, transparent, var(--specular), transparent)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
};
export default Liquid;
