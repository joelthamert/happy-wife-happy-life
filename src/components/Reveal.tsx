import type { ReactNode } from "react";

const Reveal = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => <div style={{ animation: `rise .7s cubic-bezier(.2,1,.3,1) ${delay}s both` }}>{children}</div>;
export default Reveal;
