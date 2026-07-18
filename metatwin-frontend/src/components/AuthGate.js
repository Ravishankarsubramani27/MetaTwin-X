/**
 * AuthGate.js
 * Simple PIN-based authentication gate.
 * No server required — PIN stored hashed in localStorage.
 * Default PIN: 1234 (user can change it in settings)
 */
import React, { useState, useEffect } from "react";

const SESSION_KEY  = "mt_auth_session";
const PIN_KEY      = "mt_auth_pin";
const DEFAULT_PIN  = "1234";
const SESSION_TTL  = 8 * 60 * 60 * 1000; // 8 hours

function hashPin(pin) {
  // Simple deterministic hash — not cryptographic, but sufficient for local app
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = (Math.imul(31, h) + pin.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

function isSessionValid() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
    return s.expires && Date.now() < s.expires;
  } catch { return false; }
}

function createSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    expires: Date.now() + SESSION_TTL,
    created: Date.now(),
  }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function useAuth() {
  const [authed, setAuthed] = useState(isSessionValid);

  const login  = () => { createSession(); setAuthed(true); };
  const logout = () => { clearSession();  setAuthed(false); };

  return { authed, login, logout };
}

export default function AuthGate({ children }) {
  const { authed, login } = useAuth();
  const [pin,     setPin]     = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [setup,   setSetup]   = useState(false); // first-time PIN setup mode
  const [newPin,  setNewPin]  = useState("");
  const [confirm, setConfirm] = useState("");
  const [shake,   setShake]   = useState(false);

  // Check if PIN has been set
  useEffect(() => {
    if (!localStorage.getItem(PIN_KEY)) setSetup(true);
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!pin) return;
    setLoading(true);
    setTimeout(() => {
      const stored = localStorage.getItem(PIN_KEY) || hashPin(DEFAULT_PIN);
      if (hashPin(pin) === stored) {
        login();
        setError("");
      } else {
        setError("Incorrect PIN. Try again.");
        setPin("");
        triggerShake();
      }
      setLoading(false);
    }, 400);
  };

  const handleSetup = (e) => {
    e.preventDefault();
    if (newPin.length < 4) { setError("PIN must be at least 4 digits."); return; }
    if (newPin !== confirm) { setError("PINs do not match."); triggerShake(); return; }
    localStorage.setItem(PIN_KEY, hashPin(newPin));
    setSetup(false);
    setError("");
    login();
  };

  if (authed) return children;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.08) 0%, #060b14 60%)",
    }}>
      <div style={{
        width: 360, padding: "40px 36px",
        background: "rgba(8,16,32,0.97)",
        border: "1px solid rgba(56,189,248,0.2)",
        borderRadius: 20,
        boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(56,189,248,0.08)",
        backdropFilter: "blur(20px)",
        animation: shake ? "shake 0.4s ease" : "fadeIn 0.4s ease",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, margin: "0 auto 16px",
            background: "linear-gradient(135deg,rgba(56,189,248,0.2),rgba(167,139,250,0.2))",
            border: "1px solid rgba(56,189,248,0.35)",
            borderRadius: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, boxShadow: "0 0 32px rgba(56,189,248,0.2)",
          }}>🩺</div>
          <div style={{
            fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em",
            background: "linear-gradient(90deg,#38bdf8,#a78bfa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>MetaTwin-X</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 4, letterSpacing: "0.1em" }}>
            {setup ? "CREATE ACCESS PIN" : "SECURE ACCESS"}
          </div>
        </div>

        {/* Setup mode */}
        {setup ? (
          <form onSubmit={handleSetup}>
            <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center",
                          marginBottom: 20, lineHeight: 1.6 }}>
              Set a PIN to protect patient data.<br/>
              <span style={{ color: "#475569", fontSize: 10 }}>Minimum 4 digits</span>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b",
                              textTransform: "uppercase", letterSpacing: "0.1em",
                              display: "block", marginBottom: 6 }}>New PIN</label>
              <input type="password" inputMode="numeric" maxLength={8}
                value={newPin} onChange={e => setNewPin(e.target.value)}
                placeholder="• • • •"
                className="neo-input"
                style={{ textAlign: "center", fontSize: 20, letterSpacing: "0.4em" }}
                autoFocus/>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b",
                              textTransform: "uppercase", letterSpacing: "0.1em",
                              display: "block", marginBottom: 6 }}>Confirm PIN</label>
              <input type="password" inputMode="numeric" maxLength={8}
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="• • • •"
                className="neo-input"
                style={{ textAlign: "center", fontSize: 20, letterSpacing: "0.4em" }}/>
            </div>
            {error && (
              <div style={{ color: "#ef4444", fontSize: 11, textAlign: "center",
                            marginBottom: 12 }}>{error}</div>
            )}
            <button type="submit" className="btn-neon-solid"
              style={{ width: "100%", padding: "12px", fontSize: 14 }}>
              🔒 Set PIN & Enter
            </button>
          </form>
        ) : (
          /* Login mode */
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#64748b",
                              textTransform: "uppercase", letterSpacing: "0.1em",
                              display: "block", marginBottom: 8, textAlign: "center" }}>
                Enter PIN
              </label>
              <input type="password" inputMode="numeric" maxLength={8}
                value={pin} onChange={e => setPin(e.target.value)}
                placeholder="• • • •"
                className="neo-input"
                style={{ textAlign: "center", fontSize: 24, letterSpacing: "0.5em",
                         padding: "14px" }}
                autoFocus/>
            </div>

            {/* PIN pad */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)",
                          gap: 8, marginBottom: 16 }}>
              {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k, i) => (
                <button key={i} type="button"
                  onClick={() => {
                    if (k === "⌫") setPin(p => p.slice(0,-1));
                    else if (k !== "") setPin(p => p.length < 8 ? p + k : p);
                  }}
                  style={{
                    height: 44, borderRadius: 10, fontSize: k === "⌫" ? 16 : 18,
                    fontWeight: 700, cursor: k === "" ? "default" : "pointer",
                    background: k === "" ? "transparent"
                      : "rgba(56,189,248,0.06)",
                    border: k === "" ? "none" : "1px solid rgba(56,100,160,0.2)",
                    color: k === "⌫" ? "#ef4444" : "#e2e8f0",
                    transition: "all 0.1s",
                    visibility: k === "" ? "hidden" : "visible",
                  }}
                  onMouseEnter={e => k !== "" && (e.currentTarget.style.background = "rgba(56,189,248,0.12)")}
                  onMouseLeave={e => k !== "" && (e.currentTarget.style.background = "rgba(56,189,248,0.06)")}>
                  {k}
                </button>
              ))}
            </div>

            {error && (
              <div style={{ color: "#ef4444", fontSize: 11, textAlign: "center",
                            marginBottom: 12 }}>{error}</div>
            )}
            <button type="submit" className="btn-neon-solid"
              disabled={!pin || loading}
              style={{ width: "100%", padding: "12px", fontSize: 14 }}>
              {loading ? "Verifying…" : "🔓 Access Dashboard"}
            </button>

            <div style={{ marginTop: 12, textAlign: "center", fontSize: 10,
                          color: "#475569" }}>
              Default PIN: <span style={{ color: "#64748b", fontFamily: "monospace" }}>1234</span>
              &nbsp;·&nbsp;
              <button type="button"
                onClick={() => { setSetup(true); setError(""); }}
                style={{ background:"none", border:"none", color:"#38bdf8",
                         cursor:"pointer", fontSize:10, padding:0 }}>
                Change PIN
              </button>
            </div>
          </form>
        )}
      </div>

      {/* shake keyframe */}
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
      `}</style>
    </div>
  );
}
