"use client";

import { useEffect, useRef, useState } from "react";
import { DEPTH_SRC, PHOTO_SRC, hexToRgb, inkAmount, isDark, loadImage, loadLuma, themeColors } from "@/lib/portrait";

type Mode = "sensor" | "depth";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Calls `draw` every frame while the element is on screen; once when motion is reduced.
function useFrameLoop(ref: React.RefObject<HTMLElement | null>, draw: (t: number) => void, deps: unknown[]) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let visible = false;
    const tick = (t: number) => {
      draw(t);
      if (visible && !prefersReducedMotion()) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Pointer position over the frame in CSS pixels, or null when the pointer is elsewhere
function usePointer(ref: React.RefObject<HTMLElement | null>) {
  const pos = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pos.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const leave = () => (pos.current = null);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [ref]);
  return pos;
}

function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/* Option 1: halftone sensor feed. Dots get bigger where the photo is darker; a scan line
   sweeps down, and dots near the pointer turn signal orange and lean away from it. */
function SensorFeed({ frame }: { frame: React.RefObject<HTMLDivElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { w, h } = useSize(frame);
  const pointer = usePointer(frame);
  const grid = useRef<{ tone: Float32Array; mask: Float32Array; cols: number; rows: number; cell: number } | null>(null);
  const [ready, setReady] = useState(0);

  useEffect(() => {
    if (!w || !h) return;
    const cell = 5;
    const cols = Math.floor(w / cell);
    const rows = Math.floor(h / cell);
    let alive = true;
    loadLuma(cols, rows).then(({ tone, mask }) => {
      if (!alive) return;
      grid.current = { tone, mask, cols, rows, cell };
      setReady((n) => n + 1);
    });
    return () => {
      alive = false;
    };
  }, [w, h]);

  useFrameLoop(
    frame,
    (t) => {
      const c = canvas.current;
      const g = grid.current;
      if (!c || !g || !w) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (c.width !== w * dpr) {
        c.width = w * dpr;
        c.height = h * dpr;
      }
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const { ink, panel, signal } = themeColors();
      // The feed is always a light screen with dark dots, like the console it sits beside
      const [dotColor, screen] = isDark(panel) ? [panel, ink] : [ink, panel];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = screen;
      ctx.fillRect(0, 0, w, h);

      const still = prefersReducedMotion();
      const cycle = 4200;
      const phase = (t % cycle) / cycle;
      const scanY = still || phase > 0.78 ? -100 : (phase / 0.78) * h;
      const p = pointer.current;
      const R = 64;

      for (let y = 0; y < g.rows; y++) {
        for (let x = 0; x < g.cols; x++) {
          const i = y * g.cols + x;
          let r = inkAmount(g.tone[i], g.mask[i], false) * g.cell * 0.62;
          if (r < 0.55) continue;
          let cx = x * g.cell + g.cell / 2;
          let cy = y * g.cell + g.cell / 2;
          let hot = Math.abs(cy - scanY) < g.cell * 1.1;
          if (p) {
            const dx = cx - p.x;
            const dy = cy - p.y;
            const d = Math.hypot(dx, dy);
            if (d < R) {
              const k = 1 - d / R;
              cx += (dx / (d || 1)) * k * 4;
              cy += (dy / (d || 1)) * k * 4;
              r *= 1 + k * 0.35;
              hot = true;
            }
          }
          ctx.fillStyle = hot ? signal : dotColor;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (scanY > 0) {
        ctx.fillStyle = signal;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(0, scanY, w, 1);
        ctx.globalAlpha = 1;
      }
    },
    [w, h, ready],
  );

  return <canvas ref={canvas} className="feed-canvas" style={{ width: w, height: h }} aria-hidden="true" />;
}

const VERT = `attribute vec2 p; varying vec2 uv;
void main(){ uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;

// Shifts each pixel by its depth so near parts (face) move more than far parts (wall).
const FRAG = `precision mediump float;
varying vec2 uv;
uniform sampler2D img; uniform sampler2D depth;
uniform vec2 tilt; uniform vec3 ink; uniform vec3 paper; uniform vec3 signal; uniform float res;
void main(){
  vec2 base = (uv - 0.5) * 0.94 + 0.5;
  float d = texture2D(depth, base).r;
  vec2 st = base + tilt * (d - 0.45) * 0.045;
  float l = dot(texture2D(img, st).rgb, vec3(0.299, 0.587, 0.114));
  vec3 col = mix(ink, paper, smoothstep(0.06, 0.9, l));
  col = mix(col, signal, 0.22 * smoothstep(0.55, 0.95, d) * (1.0 - smoothstep(0.35, 0.8, l)));
  col *= 0.95 + 0.05 * sin(uv.y * res * 3.14159);
  gl_FragColor = vec4(col, 1.0);
}`;

/* Option 2: 2.5D depth portrait. A depth map made from the photo drives a parallax shift,
   so the head tilts against the background as the pointer moves. */
function DepthFeed({ frame }: { frame: React.RefObject<HTMLDivElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { w, h } = useSize(frame);
  const pointer = usePointer(frame);
  const gl = useRef<{ ctx: WebGLRenderingContext; prog: WebGLProgram } | null>(null);
  const tilt = useRef({ x: 0, y: 0 });
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!ctx) {
      queueMicrotask(() => setFailed(true));
      return;
    }
    const compile = (type: number, src: string) => {
      const s = ctx.createShader(type)!;
      ctx.shaderSource(s, src);
      ctx.compileShader(s);
      return s;
    };
    const prog = ctx.createProgram()!;
    ctx.attachShader(prog, compile(ctx.VERTEX_SHADER, VERT));
    ctx.attachShader(prog, compile(ctx.FRAGMENT_SHADER, FRAG));
    ctx.linkProgram(prog);
    if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) {
      queueMicrotask(() => setFailed(true));
      return;
    }
    ctx.useProgram(prog);
    const buf = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), ctx.STATIC_DRAW);
    const loc = ctx.getAttribLocation(prog, "p");
    ctx.enableVertexAttribArray(loc);
    ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);

    const texture = (unit: number, image: HTMLImageElement, name: string) => {
      const tex = ctx.createTexture();
      ctx.activeTexture(ctx.TEXTURE0 + unit);
      ctx.bindTexture(ctx.TEXTURE_2D, tex);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
      ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
      ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, image);
      ctx.uniform1i(ctx.getUniformLocation(prog, name), unit);
    };
    let alive = true;
    Promise.all([loadImage(PHOTO_SRC), loadImage(DEPTH_SRC)])
      .then(([photo, depth]) => {
        if (!alive) return;
        texture(0, photo, "img");
        texture(1, depth, "depth");
        gl.current = { ctx, prog };
        setReady(true);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
      gl.current = null;
    };
  }, []);

  useFrameLoop(
    frame,
    (t) => {
      const c = canvas.current;
      const g = gl.current;
      if (!c || !g || !w) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (c.width !== w * dpr) {
        c.width = w * dpr;
        c.height = h * dpr;
      }
      const { ctx, prog } = g;
      ctx.viewport(0, 0, c.width, c.height);
      const p = pointer.current;
      const still = prefersReducedMotion();
      const target = p
        ? { x: (p.x / w) * 2 - 1, y: (p.y / h) * 2 - 1 }
        : still
          ? { x: 0, y: 0 }
          : { x: Math.sin(t / 1700) * 0.6, y: Math.cos(t / 2300) * 0.35 };
      tilt.current.x += (target.x - tilt.current.x) * (still ? 1 : 0.08);
      tilt.current.y += (target.y - tilt.current.y) * (still ? 1 : 0.08);
      const { ink, panel, signal } = themeColors();
      const u = (n: string) => ctx.getUniformLocation(prog, n);
      ctx.uniform2f(u("tilt"), tilt.current.x, tilt.current.y);
      // Shadows always take the darker colour, highlights the lighter one
      const [lo, hi] = isDark(panel) ? [panel, ink] : [ink, panel];
      ctx.uniform3fv(u("ink"), hexToRgb(lo));
      ctx.uniform3fv(u("paper"), hexToRgb(hi));
      ctx.uniform3fv(u("signal"), hexToRgb(signal));
      ctx.uniform1f(u("res"), h / 2);
      ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);
    },
    [w, h, ready],
  );

  if (failed) return <p className="feed-note">Depth view needs WebGL. Switch to Sensor.</p>;
  return <canvas ref={canvas} className="feed-canvas" style={{ width: w, height: h }} aria-hidden="true" />;
}

export function Portrait() {
  const [mode, setMode] = useState<Mode>("sensor");
  const [hasDepth, setHasDepth] = useState(false);
  const frame = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    loadImage(DEPTH_SRC).then(
      () => alive && setHasDepth(true),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, []);

  return (
    <figure className="feed">
      <div className="feed-head">
        <span>CAM-01</span>
        {hasDepth ? (
          <span className="feed-modes" role="group" aria-label="Portrait view">
            {(["sensor", "depth"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
                {m}
              </button>
            ))}
          </span>
        ) : null}
      </div>
      <div className="feed-frame" ref={frame} role="img" aria-label="Portrait of Vishal Vana">
        {mode === "sensor" ? <SensorFeed frame={frame} /> : <DepthFeed frame={frame} />}
        <span className="feed-live" aria-hidden="true">
          <span className="dot" />
          live
        </span>
      </div>
    </figure>
  );
}
