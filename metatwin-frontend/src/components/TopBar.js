import React, { useRef, useState, useEffect } from "react";

const NAV = [
  { key:"input",       icon:"✏",  label:"Health Input"  },
  { key:"dashboard",   icon:"⊞",  label:"Dashboard"     },
  { key:"advanced",    icon:"🧠", label:"Advanced AI"   },
  { key:"progression", icon:"🌍", label:"Progression"   },
  { key:"assistant",   icon:"🤖", label:"AI Assistant"  },
  { key:"clinical",    icon:"🏥", label:"Clinical"      },
  { key:"doctor",      icon:"👨‍⚕️",label:"Doctor View"   },
  { key:"meds",        icon:"💊", label:"Medications"   },
  { key:"graph",       icon:"🫀", label:"Organ Graph"   },
  { key:"heatmap",     icon:"📅", label:"Heatmap"       },
  { key:"sleep",       icon:"😴", label:"Sleep"         },
  { key:"upload",      icon:"📄", label:"Report Upload" },
  { key:"report",      icon:"📋", label:"AI Report"     },
  { key:"settings",    icon:"⚙️", label:"Settings"      },
];

const NEEDS_DATA = ["dashboard","advanced","progression","assistant","clinical","graph","heatmap"];

export default function TopBar({ patientId, risk, view, setView, onClear, loading, onLogout }) {
  const navRef  = useRef(null);
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll state whenever it might change
  const checkScroll = () => {
    const el = navRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = navRef.current;
    if (el) el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      if (el) el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (dir) => {
    const el = navRef.current;
    if (el) el.scrollBy({ left: dir * 160, behavior: "smooth" });
  };

  const ArrowBtn = ({ dir }) => (
    <button onClick={() => scroll(dir)} style={{
      flexShrink: 0,
      width: 26, height: 56,
      background: "linear-gradient(" + (dir === -1 ? "90deg" : "270deg") + ",rgba(4,8,18,0.98),transparent)",
      border: "none", cursor: "pointer",
      color: "#38bdf8", fontSize: 14,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "opacity 0.2s",
      zIndex: 2,
    }}>
      {dir === -1 ? "‹" : "›"}
    </button>
  );

  return (
    <header style={{
      height: 56,
      background: "rgba(4,8,18,0.98)",
      borderBottom: "1px solid rgba(56,189,248,0.1)",
      display: "flex", alignItems: "center",
      padding: "0 12px 0 20px", gap: 10,
      position: "sticky", top: 0, zIndex: 500,
      backdropFilter: "blur(20px)",
      boxShadow: "0 1px 0 rgba(56,189,248,0.05), 0 4px 24px rgba(0,0,0,0.4)",
    }}>

      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <div style={{
          width:34, height:34,
          background:"linear-gradient(135deg,rgba(56,189,248,0.25),rgba(167,139,250,0.2))",
          border:"1px solid rgba(56,189,248,0.4)",
          borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18, boxShadow:"0 0 16px rgba(56,189,248,0.15)",
        }}>🩺</div>
        <div>
          <div style={{
            fontSize:15, fontWeight:900, letterSpacing:"-0.03em",
            background:"linear-gradient(90deg,#38bdf8,#a78bfa)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          }}>MetaTwin-X</div>
          <div style={{ fontSize:8, color:"#475569", letterSpacing:"0.14em", textTransform:"uppercase" }}>
            Digital Health Twin
          </div>
        </div>
      </div>

      {/* Nav scroll container */}
      <div style={{ flex:1, display:"flex", alignItems:"center",
                    minWidth:0, position:"relative" }}>

        {/* Left arrow */}
        {canScrollLeft && <ArrowBtn dir={-1}/>}

        {/* Scrollable nav */}
        <nav
          ref={navRef}
          onScroll={checkScroll}
          style={{
            display:"flex", gap:1, flex:1,
            overflowX:"auto", overflowY:"hidden",
            scrollbarWidth:"thin",
            scrollbarColor:"rgba(56,189,248,0.35) transparent",
            /* Webkit scrollbar */
            WebkitOverflowScrolling:"touch",
          }}>
          {NAV.map(({ key, icon, label }) => {
            const disabled = NEEDS_DATA.includes(key) && !risk;
            const active   = view === key;
            return (
              <button key={key} disabled={disabled}
                onClick={() => !disabled && setView(key)}
                style={{
                  background: active ? "rgba(56,189,248,0.1)" : "transparent",
                  border: "none",
                  borderBottom: active ? "2px solid #38bdf8" : "2px solid transparent",
                  color: active   ? "#38bdf8"
                       : disabled ? "rgba(71,85,105,0.4)" : "#64748b",
                  padding: "0 12px", height: 56,
                  cursor: disabled ? "not-allowed" : "pointer",
                  fontFamily: "var(--font)", fontWeight: active ? 700 : 500, fontSize: 12,
                  display:"flex", alignItems:"center", gap:5,
                  transition:"all 0.15s", flexShrink:0,
                  whiteSpace:"nowrap",
                }}>
                <span style={{ fontSize:13 }}>{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right arrow */}
        {canScrollRight && <ArrowBtn dir={1}/>}
      </div>

      {/* Right side */}
      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        {loading && (
          <div style={{
            width:14, height:14, border:"2px solid rgba(56,189,248,0.2)",
            borderTop:"2px solid #38bdf8", borderRadius:"50%",
            animation:"spin 0.8s linear infinite",
          }}/>
        )}
        {risk && (
          <span className="badge badge-green" style={{ fontSize:9 }}>
            <span className="status-dot live"/>LIVE
          </span>
        )}
        <div style={{
          background:"rgba(10,22,44,0.8)", border:"1px solid rgba(56,189,248,0.15)",
          borderRadius:6, padding:"3px 10px",
          fontSize:10, color:"#475569", fontFamily:"var(--font-mono)",
        }}>{patientId}</div>
        {risk && (
          <button onClick={onClear} className="btn-primary" style={{
            background:"rgba(239,68,68,0.08)", borderColor:"rgba(239,68,68,0.25)", color:"#ef4444",
          }}>✕ Clear</button>
        )}
        <div style={{
          width:30, height:30, borderRadius:"50%",
          background:"linear-gradient(135deg,rgba(56,189,248,0.3),rgba(167,139,250,0.3))",
          border:"1px solid rgba(56,189,248,0.3)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:11, fontWeight:800, color:"#38bdf8", fontFamily:"var(--font-mono)",
        }}>MT</div>
        {onLogout && (
          <button onClick={onLogout} title="Lock / Sign out" style={{
            background:"rgba(71,85,105,0.1)", border:"1px solid rgba(71,85,105,0.25)",
            color:"#64748b", borderRadius:7, padding:"4px 10px",
            cursor:"pointer", fontSize:11, fontWeight:600,
          }}>🔒</button>
        )}
      </div>
    </header>
  );
}
