"use client";
import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 4500);
    const hideTimer = setTimeout(() => setVisible(false), 5000);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#050505",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28,
      opacity: fading ? 0 : 1,
      transition: "opacity 0.5s ease",
      pointerEvents: fading ? "none" : "all",
    }}>
      {/* ECG heartbeat — sweeps 3 times over 4.5s */}
      <svg width="320" height="70" viewBox="0 0 320 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polyline
          points="0,35 50,35 65,35 75,10 85,60 95,5 107,55 117,35 165,35 185,35 200,35 250,35 320,35"
          stroke="#dc2626" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.15}
          style={{ strokeDasharray: 520, strokeDashoffset: 520, animation: "ecgDraw 1.5s cubic-bezier(0.4,0,0.2,1) 3 forwards" }}
        />
        <polyline
          points="0,35 50,35 65,35 75,10 85,60 95,5 107,55 117,35 165,35 185,35 200,35 250,35 320,35"
          stroke="#dc2626" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"
          style={{ strokeDasharray: 520, strokeDashoffset: 520, animation: "ecgDraw 1.5s cubic-bezier(0.4,0,0.2,1) 3 forwards" }}
        />
      </svg>

      {/* Logo appears after first beat at 1.5s */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <img src="/logo.png" alt="CardPulse" style={{
          height: 52, objectFit: "contain",
          filter: "drop-shadow(0 0 14px rgba(220,38,38,0.6))",
          animation: "logoPulse 0.6s ease-out 1.5s both",
          opacity: 0,
        }} />
        <span style={{
          fontFamily: "Oswald, sans-serif", fontSize: "0.6rem", letterSpacing: "0.22em",
          textTransform: "uppercase", color: "#444",
          animation: "fadeInSub 0.5s ease 2s both",
          opacity: 0,
        }}>Real-Time Card Intelligence</span>
      </div>

      <style>{`
        @keyframes ecgDraw {
          0%   { stroke-dashoffset: 520; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes logoPulse {
          0%   { opacity: 0; transform: scale(0.85); }
          60%  { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeInSub {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
