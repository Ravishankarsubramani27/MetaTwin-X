/**
 * ECGWaveform.js
 * Animated Canvas ECG / heartbeat line that scrolls continuously.
 * No extra dependencies — pure requestAnimationFrame.
 */
import React, { useEffect, useRef } from "react";

/* One PQRST complex — normalised [0–1 x, -1 to +1 y] */
const PQRST = [
  [0.00,  0.00], [0.06,  0.00],
  [0.10,  0.08], [0.14,  0.00],   // P wave
  [0.20,  0.00], [0.24, -0.10],   // Q dip
  [0.27,  1.00], [0.30, -0.40],   // R peak
  [0.34,  0.00], [0.38,  0.12],   // S-T segment
  [0.45,  0.12], [0.55,  0.00],   // T wave
  [1.00,  0.00],
];

export default function ECGWaveform({ heartRate = 72, color = "#10b981", width = 260, height = 60 }) {
  const canvasRef = useRef(null);
  const offsetRef = useRef(0);
  const rafRef    = useRef(null);
  const speedRef  = useRef((heartRate / 60) * 1.8);

  // Keep speed in sync with heartRate without restarting the animation loop
  useEffect(() => {
    speedRef.current = (heartRate / 60) * 1.8;
  }, [heartRate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = width * 2;    // 2× for device pixel ratio sharpness
    const H = height * 2;
    canvas.width  = W;
    canvas.height = H;

    const CYCLES = 4;
    const cw  = W / CYCLES;
    const mid = H / 2;
    const ch  = H - 16;

    function drawFrame() {
      ctx.clearRect(0, 0, W, H);

      // Background grid
      ctx.strokeStyle = "rgba(16,185,129,0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // ECG line
      ctx.shadowColor = color;
      ctx.shadowBlur  = 6;
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2.5;
      ctx.lineJoin    = "round";
      ctx.lineCap     = "round";
      ctx.beginPath();

      let isFirst = true;
      for (let c = -1; c < CYCLES + 1; c++) {
        for (const [px, py] of PQRST) {
          const rawX = c * cw + px * cw - offsetRef.current;
          const x    = ((rawX % W) + W) % W;
          const y    = mid - py * (ch * 0.42);
          if (isFirst) { ctx.moveTo(x, y); isFirst = false; }
          else          { ctx.lineTo(x, y); }
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Right-edge fade
      const grad = ctx.createLinearGradient(W - 40, 0, W, 0);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, "#060b14");
      ctx.fillStyle = grad;
      ctx.fillRect(W - 40, 0, 40, H);

      offsetRef.current = (offsetRef.current + speedRef.current) % W;
      rafRef.current = requestAnimationFrame(drawFrame);
    }

    rafRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [color, width, height]); // speed handled via ref — no restart needed

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: "block", imageRendering: "pixelated" }}
    />
  );
}
