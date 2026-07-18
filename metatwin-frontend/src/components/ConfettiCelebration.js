/**
 * ConfettiCelebration.js
 * Green particle burst when health score improves by 10+ points.
 * Pure CSS + requestAnimationFrame — no deps.
 */
import React, { useEffect, useRef } from "react";

const COLORS = ["#10b981","#38bdf8","#a78bfa","#f59e0b","#06b6d4","#84cc16"];

function randomBetween(a, b) { return a + Math.random() * (b - a); }

function createParticle(canvas) {
  const { width: W, height: H } = canvas;
  return {
    x:    randomBetween(W * 0.2, W * 0.8),
    y:    H * 0.4,
    vx:   randomBetween(-6, 6),
    vy:   randomBetween(-14, -4),
    size: randomBetween(5, 12),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: randomBetween(0, 360),
    rotationSpeed: randomBetween(-8, 8),
    gravity: 0.4,
    opacity: 1,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  };
}

export default function ConfettiCelebration({ active, onDone }) {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    // Spawn 120 particles in bursts
    for (let i = 0; i < 120; i++) {
      setTimeout(() => particles.current.push(createParticle(canvas)), i * 8);
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter(p => p.opacity > 0.01);

      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.012;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (particles.current.length > 0) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onDone) onDone();
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      particles.current = [];
    };
  }, [active, onDone]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", top: 0, left: 0, zIndex: 99999,
        pointerEvents: "none", width: "100vw", height: "100vh",
      }}
    />
  );
}
