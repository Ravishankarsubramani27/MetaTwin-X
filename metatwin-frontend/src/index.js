import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./print.css";

/* Global font */
const style = document.createElement("style");
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, sans-serif; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
  input[type=range] { height: 4px; }
`;
document.head.appendChild(style);

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e, info) { console.error("[MetaTwin-X] Crash:", e, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight:"100vh", background:"#060b14", color:"#e2e8f0",
          display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", fontFamily:"Inter,sans-serif", padding:32,
        }}>
          <div style={{ fontSize:32, marginBottom:16 }}>⚠️</div>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:8, color:"#ef4444" }}>
            MetaTwin-X — Runtime Error
          </div>
          <div style={{
            background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)",
            borderRadius:8, padding:"12px 20px", maxWidth:600,
            fontSize:12, color:"#fca5a5", fontFamily:"monospace", lineHeight:1.6,
          }}>
            {this.state.error?.message || String(this.state.error)}
          </div>
          <button onClick={()=>window.location.reload()} style={{
            marginTop:20, background:"#2563eb", color:"#fff",
            border:"none", borderRadius:8, padding:"10px 24px",
            fontSize:14, fontWeight:700, cursor:"pointer",
          }}>Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<ErrorBoundary><App /></ErrorBoundary>);
