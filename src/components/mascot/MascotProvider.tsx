"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ClaudeMascot, type MascotEmotion, type MascotPose } from "./ClaudeMascot";

const EMOTIONS_CYCLE: MascotEmotion[] = ["happy", "excited", "love", "surprised", "sleepy"];

export function MascotMount() {
  const pathname = usePathname();
  const [emotion, setEmotion] = useState<MascotEmotion>("idle");
  const [pose, setPose] = useState<MascotPose>("stand");
  const [running, setRunning] = useState(false);
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const cycleRef = useRef(0);
  const timeoutsRef = useRef<number[]>([]);
  const lastPathRef = useRef(pathname);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const reactTo = useCallback(
    (e: MascotEmotion, p: MascotPose, durationMs: number) => {
      clearTimers();
      setEmotion(e);
      setPose(p);
      timeoutsRef.current.push(
        window.setTimeout(() => {
          setEmotion("idle");
          setPose("stand");
        }, durationMs)
      );
    },
    [clearTimers]
  );

  // Route change → run across screen
  useEffect(() => {
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;
    clearTimers();
    setRunning(true);
    setEmotion("excited");
    setPose("run");
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setRunning(false);
        setEmotion("happy");
        setPose("stand");
      }, 900)
    );
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setEmotion("idle");
        setPose("stand");
      }, 1700)
    );
  }, [pathname, clearTimers]);

  // Global click → quick squish + sparkle trail
  useEffect(() => {
    function onClick(ev: MouseEvent) {
      const t = ev.target as HTMLElement | null;
      if (t?.closest("[data-mascot]")) return;
      const id = Date.now() + Math.random();
      setTrail((prev) => [...prev.slice(-4), { x: ev.clientX, y: ev.clientY, id }]);
      window.setTimeout(() => setTrail((prev) => prev.filter((p) => p.id !== id)), 700);

      if (!running) {
        setPose("squish");
        clearTimers();
        timeoutsRef.current.push(window.setTimeout(() => setPose("stand"), 220));
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [running, clearTimers]);

  // Global form submit → celebrate
  useEffect(() => {
    function onSubmit() {
      reactTo("love", "spin", 1300);
    }
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, [reactTo]);

  const handleTap = useCallback(() => {
    const next = EMOTIONS_CYCLE[cycleRef.current % EMOTIONS_CYCLE.length];
    cycleRef.current += 1;
    reactTo(next, "spin", 1400);
  }, [reactTo]);

  return (
    <>
      {trail.map((t) => (
        <span
          key={t.id}
          aria-hidden
          className="mascot-trail-dot"
          style={{ left: t.x, top: t.y }}
        />
      ))}
      <div data-mascot className={`mascot-container ${running ? "mascot-running" : ""}`}>
        <ClaudeMascot emotion={emotion} pose={pose} facing="left" size={56} onTap={handleTap} />
      </div>
    </>
  );
}
