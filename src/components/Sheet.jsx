import { glass } from "../theme";

const Sheet = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--scrim)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ ...glass({ borderRadius: "30px 30px 0 0" }), background: "var(--sheet-bg)", borderBottom: "none", padding: "18px 22px calc(52px + env(safe-area-inset-bottom))", width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", animation: "sheetUp .5s cubic-bezier(.16,1,.3,1)" }}>
        <div style={{ width: 40, height: 5, borderRadius: 3, background: "var(--ghost)", margin: "0 auto 22px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)" }} />
        {children}
      </div>
    </div>
  );
};
export default Sheet;
