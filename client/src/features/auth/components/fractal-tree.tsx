"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Branch = {
  angle: number;
  len: number;
  phase: number;
  children: Branch[];
  blossoms: { at: number; r: number; color: number }[];
};

const MAX_DEPTH = 10;
const GROW_MS = 260; // per depth level
const TAU = Math.PI * 2;

const COLOR_VARS =
  "[--trunk:var(--color-brand-900)] [--twig:var(--color-brand-600)] [--bloom-0:var(--color-brand-200)] [--bloom-1:var(--color-brand-300)] [--bloom-2:var(--color-brand-400)]";

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const ease = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;

// Trunk-relative lengths
function growBranch(depth: number, angle: number, len: number): Branch {
  return {
    angle,
    len,
    phase: Math.random() * TAU,
    children:
      depth < MAX_DEPTH
        ? [-1, 1].map((side) =>
            growBranch(
              depth + 1,
              side * rand(0.25, 0.55),
              len * rand(0.7, 0.82)
            )
          )
        : [],
    blossoms:
      depth >= MAX_DEPTH - 3
        ? Array.from({ length: depth === MAX_DEPTH ? 3 : 1 }, () => ({
            at: rand(0.4, 1.1),
            r: rand(1.4, 3.2),
            color: Math.floor(Math.random() * 3),
          }))
        : [],
  };
}

export default function FractalTree({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const css = getComputedStyle(canvas);
    const [trunk, twig, ...bloomColors] = [
      "--trunk",
      "--twig",
      "--bloom-0",
      "--bloom-1",
      "--bloom-2",
    ].map((v) => css.getPropertyValue(v));
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tree = growBranch(0, 0, 1);
    const motes = Array.from({ length: 36 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: rand(0.5, 1.4),
      speed: rand(0.004, 0.012),
    }));
    let width = 0;
    let height = 0;
    let scale = 0;
    const start = performance.now();
    let frame = 0;

    const draw = (grown: number, time: number) => {
      const groundY = height * 0.9;
      // One path per depth and per blossom color keeps draw calls low
      const branchPaths = Array.from(
        { length: MAX_DEPTH + 1 },
        () => new Path2D()
      );
      const bloomPaths = bloomColors.map(() => new Path2D());
      const motePath = new Path2D();

      const walk = (
        b: Branch,
        depth: number,
        x: number,
        y: number,
        parent: number
      ) => {
        const p = ease(grown - depth);
        if (p <= 0) return;
        const a =
          parent +
          b.angle +
          Math.sin(time / 1400 + b.phase) * 0.012 * (depth + 1);
        const dx = Math.sin(a) * b.len * scale;
        const dy = -Math.cos(a) * b.len * scale;
        branchPaths[depth].moveTo(x, y);
        branchPaths[depth].lineTo(x + dx * p, y + dy * p);

        const bloom = ease((grown - depth - 1) / 1.5);
        for (const f of bloom > 0 ? b.blossoms : []) {
          const r = f.r * bloom;
          bloomPaths[f.color].moveTo(x + dx * f.at + r, y + dy * f.at);
          bloomPaths[f.color].arc(x + dx * f.at, y + dy * f.at, r, 0, TAU);
        }
        if (p === 1)
          for (const c of b.children) walk(c, depth + 1, x + dx, y + dy, a);
      };
      walk(tree, 0, width / 2, groundY, 0);

      for (const m of motes) {
        const my = ((((m.y - (time / 1000) * m.speed) % 1) + 1) % 1) * height;
        motePath.moveTo(m.x * width + m.r, my);
        motePath.arc(m.x * width, my, m.r, 0, TAU);
      }

      const cy = groundY - scale * 2.6;
      const glow = ctx.createRadialGradient(
        width / 2,
        cy,
        0,
        width / 2,
        cy,
        scale * 3
      );
      glow.addColorStop(0, twig);
      glow.addColorStop(1, "transparent");

      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = bloomColors[0];
      ctx.fill(motePath);

      // Horizon line so the trunk stands on something
      const horizon = ctx.createLinearGradient(0, 0, width, 0);
      horizon.addColorStop(0.1, "transparent");
      horizon.addColorStop(0.5, twig);
      horizon.addColorStop(0.9, "transparent");
      ctx.fillStyle = horizon;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(0, groundY, width, 1);

      ctx.globalAlpha = 0.9;
      ctx.lineCap = "round";
      branchPaths.forEach((path, d) => {
        ctx.lineWidth = Math.max(0.6, scale * 0.11 * 0.68 ** d);
        ctx.strokeStyle = d < MAX_DEPTH / 2 ? trunk : twig;
        ctx.stroke(path);
      });
      bloomPaths.forEach((path, i) => {
        ctx.fillStyle = bloomColors[i];
        ctx.fill(path);
      });
    };

    const resize = () => {
      const dpr = devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scale = Math.min(height * 0.17, width * 0.2);
      if (reduceMotion) draw(Infinity, 0);
    };

    const loop = (now: number) => {
      draw((now - start) / GROW_MS, now);
      frame = requestAnimationFrame(loop);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    if (!reduceMotion) frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [seed]);

  return (
    <button
      type="button"
      aria-label="Grow a new tree"
      onClick={() => setSeed((s) => s + 1)}
      className={cn(
        "focus-visible:ring-brand-400 block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
        COLOR_VARS,
        className
      )}
    >
      <canvas ref={canvasRef} aria-hidden className="size-full" />
    </button>
  );
}
