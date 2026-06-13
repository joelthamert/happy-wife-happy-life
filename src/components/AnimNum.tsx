import { useEffect, useState } from "react";
import { T, ff } from "../theme";

const AnimNum = ({ value, color = T.rose }: { value: number; color?: string }) => {
  const [v, setV] = useState(0);
  useEffect(() => { const t0 = performance.now(); const tick = (n: number) => { const p = Math.min((n - t0) / 700, 1); setV(Math.round((1 - Math.pow(1 - p, 3)) * value)); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }, [value]);
  return <span style={{ fontFamily: ff, fontWeight: 700, fontSize: 27, color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{v}</span>;
};
export default AnimNum;
