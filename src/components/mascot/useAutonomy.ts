"use client";
import { useEffect, useRef } from "react";

export interface AutonomyState {
  x: number;
  y: number;
  speed: number;
  facingLeft: boolean;
  isMouseNear: boolean;
  isSleepy: boolean;
  isAwake: boolean;
}

interface Options {
  /** Element ref the autonomy writes transforms into directly (no React re-renders) */
  elementRef: React.RefObject<HTMLElement | null>;
  /** Called when discrete state flips occur (sleepy, near, facing). Throttled in here. */
  onStateChange: (s: Pick<AutonomyState, "speed" | "facingLeft" | "isMouseNear" | "isSleepy">) => void;
  /** Bottom inset to keep the mascot above (mobile nav, etc.). */
  bottomInset?: number;
  /** Top inset to keep the mascot below. */
  topInset?: number;
  /** Right inset to avoid (e.g., logout button). */
  rightInset?: number;
}

const PADDING = 28;
const MAX_SPEED_PX_PER_SEC = 90;

export function useAutonomy({
  elementRef,
  onStateChange,
  bottomInset = 120,
  topInset = 80,
  rightInset = 60,
}: Options) {
  const raf = useRef(0);
  const lastTime = useRef(0);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const idleUntil = useRef(0);
  const lastEmit = useRef<AutonomyState>({
    x: 0,
    y: 0,
    speed: 0,
    facingLeft: false,
    isMouseNear: false,
    isSleepy: false,
    isAwake: true,
  });
  const mouse = useRef({ x: -9999, y: -9999, lastMoveAt: 0 });

  useEffect(() => {
    function getBounds() {
      return {
        left: PADDING,
        top: topInset,
        right: window.innerWidth - PADDING - rightInset,
        bottom: window.innerHeight - bottomInset,
      };
    }

    function pickTarget(now: number) {
      const b = getBounds();
      const margin = 60;
      const width = Math.max(margin, b.right - b.left);
      const height = Math.max(margin, b.bottom - b.top);
      target.current = {
        x: b.left + Math.random() * width,
        y: b.top + Math.random() * height,
      };
      idleUntil.current = now + 2500 + Math.random() * 5500;
    }

    // initial position: bottom-right safe area
    const b0 = getBounds();
    pos.current = { x: b0.right - 24, y: b0.bottom - 24 };
    pickTarget(performance.now());

    function onMouse(e: MouseEvent) {
      mouse.current = { x: e.clientX, y: e.clientY, lastMoveAt: performance.now() };
    }
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchstart", () => {
      mouse.current.lastMoveAt = performance.now();
    });

    function tick(now: number) {
      const dt = Math.min((now - lastTime.current) / 1000, 0.05);
      lastTime.current = now;

      const dx = target.current.x - pos.current.x;
      const dy = target.current.y - pos.current.y;
      const dist = Math.hypot(dx, dy);
      const arrived = dist < 6;

      let speed = 0;
      let facingLeft = lastEmit.current.facingLeft;

      if (arrived) {
        if (now > idleUntil.current) pickTarget(now);
      } else {
        const desired = MAX_SPEED_PX_PER_SEC * 0.6;
        const step = Math.min(desired * dt, dist);
        pos.current.x += (dx / dist) * step;
        pos.current.y += (dy / dist) * step;
        speed = desired;
        if (Math.abs(dx) > 2) facingLeft = dx < 0;
      }

      // Mouse proximity (desktop only — touch lastMoveAt expires quickly)
      const mouseFresh = now - mouse.current.lastMoveAt < 1500;
      const mdx = mouse.current.x - pos.current.x;
      const mdy = mouse.current.y - pos.current.y;
      const isMouseNear = mouseFresh && Math.hypot(mdx, mdy) < 160;

      // Sleepiness — no mouse activity, mascot has been idle for a while
      const noActivity = now - mouse.current.lastMoveAt > 18000;
      const isSleepy = arrived && noActivity;

      // Apply transform directly (no React re-render)
      const el = elementRef.current;
      if (el) {
        el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }

      // Emit state only when something meaningful changes
      const prev = lastEmit.current;
      if (
        Math.abs(prev.speed - speed) > 1 ||
        prev.facingLeft !== facingLeft ||
        prev.isMouseNear !== isMouseNear ||
        prev.isSleepy !== isSleepy
      ) {
        lastEmit.current = { ...prev, speed, facingLeft, isMouseNear, isSleepy };
        onStateChange({ speed, facingLeft, isMouseNear, isSleepy });
      }

      raf.current = requestAnimationFrame(tick);
    }

    lastTime.current = performance.now();
    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove", onMouse);
    };
  }, [elementRef, onStateChange, bottomInset, topInset, rightInset]);
}
