import { Component } from "react";
import { T, ff, ffd, glass, btnPrimary } from "../theme";

/* Glass-styled error boundary — keeps a crash from taking the whole app dark */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("HWHL crashed:", error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 18, fontFamily: ff }}>
        <div style={{ ...glass({ borderRadius: 28 }), padding: "36px 28px", maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>💔</div>
          <h1 style={{ fontFamily: ffd, fontStyle: "italic", fontWeight: 400, fontSize: 26, color: T.ink, margin: "0 0 10px" }}>Something went wrong</h1>
          <div style={{ fontSize: 13.5, color: T.body, lineHeight: 1.6, marginBottom: 8 }}>Your data is safe — it lives on this device.</div>
          {this.state.error?.message && (
            <div style={{ fontSize: 11.5, color: T.faint, fontFamily: "monospace", margin: "0 0 20px", wordBreak: "break-word" }}>{String(this.state.error.message).slice(0, 200)}</div>
          )}
          <button onClick={() => { this.setState({ error: null }); }} style={{ ...btnPrimary(), marginRight: 10 }}>Try again</button>
          <button onClick={() => location.reload()} style={{ ...btnPrimary(T.gradCool), boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 28px rgba(176,124,255,0.30)" }}>Reload</button>
        </div>
      </div>
    );
  }
}
