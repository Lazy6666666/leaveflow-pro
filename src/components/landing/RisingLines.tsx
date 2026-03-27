"use client";
import React, { useEffect, useRef } from "react";

interface RisingLinesProps {
  riseSpeed?: number;
  horizonHeight?: number;
  linesColor?: string;
  linesWidth?: number;
  linesLength?: number;
  particlesSpeed?: number;
  particlesColor?: string;
  particlesOpacity?: number;
  lineCount?: number;
  particleCount?: number;
  backgroundColor?: string;
}

export const RisingLines: React.FC<RisingLinesProps> = ({
  riseSpeed = 2.5,
  horizonHeight = 0.05,
  linesColor = "#e879f9",
  linesWidth = 2.5,
  linesLength = 0.9,
  particlesSpeed = 1.5,
  particlesColor = "#e879f9",
  particlesOpacity = 0.95,
  lineCount = 100,
  particleCount = 150,
  backgroundColor = "#09090b",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.navigator.userAgent.includes("jsdom")) return;

    const _ctx = canvas.getContext("2d", { alpha: false });
    if (!_ctx) return;

    let W: number, H: number;
    let horizonY: number;

    interface Line {
      x: number;
      y: number;
      h: number;
      speed: number;
      opacity: number;
      width: number;
    }
    interface Particle {
      x: number;
      y: number;
      r: number;
      speed: number;
      opacity: number;
      pulse: number;
    }
    let lines: Line[] = [];
    let particles: Particle[] = [];
    let raf: number;

    const bgCanvas = document.createElement("canvas");
    const bgCtx = bgCanvas.getContext("2d");

    const rand = (min: number, max: number) => Math.random() * (max - min) + min;

    const mkLine = () => {
      const x = rand(0, W);
      const h = rand(H * linesLength * 0.4, H * linesLength);
      const y = H + rand(10, H * 0.3);
      return {
        x,
        y,
        h,
        speed: rand(riseSpeed * 0.6, riseSpeed * 1.4),
        opacity: rand(0.16, 0.42),
        width: rand(linesWidth * 0.5, linesWidth * 1.2),
      };
    };

    const mkParticle = () => ({
      x: rand(0, W),
      y: H + rand(0, H * 0.5),
      r: rand(1.25, 3),
      speed: rand(particlesSpeed * 0.5, particlesSpeed * 1.6),
      opacity: rand(0.14, particlesOpacity * 0.38),
      pulse: rand(0, Math.PI * 2),
    });

    const hexToRgb = (hex: string) => {
      let r = 0;
      let g = 0;
      let b = 0;
      if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
      }
      return `${r},${g},${b}`;
    };

    const lc = hexToRgb(linesColor);
    const pc = hexToRgb(particlesColor);

    const renderStaticBackground = () => {
      if (!bgCtx) return;
      bgCanvas.width = W;
      bgCanvas.height = H;
      horizonY = H * (1 - horizonHeight);

      bgCtx.fillStyle = backgroundColor;
      bgCtx.fillRect(0, 0, W, H);

      bgCtx.globalCompositeOperation = "source-over";

      const ambient = bgCtx.createLinearGradient(0, 0, 0, H);
      ambient.addColorStop(0, "rgba(255,255,255,0.22)");
      ambient.addColorStop(0.58, `rgba(${lc},0.05)`);
      ambient.addColorStop(1, `rgba(${lc},0.12)`);
      bgCtx.fillStyle = ambient;
      bgCtx.fillRect(0, 0, W, H);

      bgCtx.save();
      bgCtx.translate(W / 2, H * 0.42);
      bgCtx.scale(0.08, 1);
      const flare = bgCtx.createRadialGradient(0, 0, 0, 0, 0, H);
      flare.addColorStop(0, `rgba(${lc},0.2)`);
      flare.addColorStop(0.28, `rgba(${lc},0.12)`);
      flare.addColorStop(1, `rgba(${lc},0)`);
      bgCtx.fillStyle = flare;
      bgCtx.fillRect(-H * 2, -H * 2, H * 4, H * 4);
      bgCtx.restore();

      const hg = bgCtx.createLinearGradient(0, horizonY - H * 0.4, 0, H);
      hg.addColorStop(0, `rgba(${lc},0)`);
      hg.addColorStop(0.35, `rgba(${lc},0.04)`);
      hg.addColorStop(1, `rgba(${lc},0.18)`);
      bgCtx.fillStyle = hg;
      bgCtx.fillRect(0, 0, W, H);

      bgCtx.save();
      bgCtx.translate(W / 2, H);
      bgCtx.scale(1, 0.18);
      const core = bgCtx.createRadialGradient(0, 0, 0, 0, 0, W * 0.78);
      core.addColorStop(0, `rgba(${lc},0.16)`);
      core.addColorStop(0.2, `rgba(${pc},0.14)`);
      core.addColorStop(1, `rgba(${lc},0)`);
      bgCtx.fillStyle = core;
      bgCtx.fillRect(-W, -W, W * 2, W * 2);
      bgCtx.restore();
    };

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      horizonY = H * (1 - horizonHeight);
      renderStaticBackground();
    };

    const init = () => {
      lines = Array.from({ length: lineCount }, mkLine);
      particles = Array.from({ length: particleCount }, mkParticle);
    };

    const draw = () => {
      if (bgCanvas.width > 0) {
        _ctx.globalCompositeOperation = "source-over";
        _ctx.drawImage(bgCanvas, 0, 0);
      }

      _ctx.globalCompositeOperation = "multiply";
      _ctx.beginPath();
      lines.forEach((l) => {
        l.y -= l.speed;
        const top = l.y - l.h;
        if (top < horizonY - l.h * 0.5) {
          Object.assign(l, mkLine());
          l.y = H + l.h;
        }

        const dist = l.y - horizonY;
        const fade = Math.min(1, Math.max(0, dist / (H * 0.25)));
        const alpha = l.opacity * fade;
        if (alpha < 0.01) return;

        const perspScale = Math.min(1, dist / (H * horizonHeight));

        _ctx.moveTo(l.x, l.y);
        _ctx.lineTo(l.x, l.y - l.h);
        _ctx.strokeStyle = `rgba(${lc},${alpha})`;
        _ctx.lineWidth = l.width * perspScale;
        _ctx.stroke();
        _ctx.beginPath();
      });

      _ctx.globalCompositeOperation = "source-over";
      particles.forEach((p) => {
        p.y -= p.speed;
        p.pulse += 0.04;
        if (p.y < horizonY - 20) {
          Object.assign(p, mkParticle());
          p.y = H + rand(0, 50);
        }

        const dist = p.y - horizonY;
        const fade = Math.min(1, Math.max(0, dist / (H * 0.3)));
        const alpha = p.opacity * fade * (0.7 + 0.3 * Math.sin(p.pulse));
        if (alpha < 0.01) return;

        _ctx.beginPath();
        _ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        _ctx.fillStyle = `rgba(${pc},${alpha})`;
        _ctx.fill();

        _ctx.beginPath();
        _ctx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        _ctx.fillStyle = `rgba(${pc},${alpha * 0.12})`;
        _ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [
    backgroundColor,
    riseSpeed,
    horizonHeight,
    linesColor,
    linesWidth,
    linesLength,
    particlesSpeed,
    particlesColor,
    particlesOpacity,
    lineCount,
    particleCount,
  ]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0 h-full w-full" />;
};
