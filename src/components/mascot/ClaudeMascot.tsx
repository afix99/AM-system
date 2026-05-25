"use client";
import { useEffect, useRef, useState } from "react";

export type MascotEmotion = "idle" | "happy" | "excited" | "surprised" | "sleepy" | "love";
export type MascotPose = "stand" | "jump" | "run" | "spin" | "squish";

interface Props {
  emotion: MascotEmotion;
  pose: MascotPose;
  size?: number;
  facing?: "left" | "right";
  onTap?: () => void;
}

export function ClaudeMascot({ emotion, pose, size = 56, facing = "right", onTap }: Props) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 3200 + Math.random() * 2400);
    return () => clearInterval(id);
  }, []);

  const flipX = facing === "left" ? -1 : 1;

  return (
    <button
      onClick={onTap}
      aria-label="Claude mascot"
      className={`mascot-root pose-${pose}`}
      style={{ width: size, height: size, transform: `scaleX(${flipX})` }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="mascot-svg">
        <defs>
          <radialGradient id="mascotCore" cx="45%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#FFE4D2" />
            <stop offset="35%" stopColor="#F4A982" />
            <stop offset="75%" stopColor="#D97756" />
            <stop offset="100%" stopColor="#B85535" />
          </radialGradient>
          <radialGradient id="mascotHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D97756" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#D97756" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* glow halo */}
        <circle cx="50" cy="50" r="48" fill="url(#mascotHalo)" className="mascot-halo" />

        {/* body — 4-point sparkle */}
        <g className="mascot-body">
          <path
            d="M50 4 C 53 38, 56 41, 96 50 C 56 59, 53 62, 50 96 C 47 62, 44 59, 4 50 C 44 41, 47 38, 50 4 Z"
            fill="url(#mascotCore)"
          />
          <path
            d="M50 4 C 53 38, 56 41, 96 50 C 56 59, 53 62, 50 96 C 47 62, 44 59, 4 50 C 44 41, 47 38, 50 4 Z"
            fill="url(#mascotCore)"
            opacity="0.7"
            transform="rotate(45 50 50)"
          />
        </g>

        {/* face */}
        <g className="mascot-face">
          {/* shadow plate behind eyes for legibility */}
          <ellipse cx="50" cy="50" rx="20" ry="14" fill="rgba(28,25,23,0.35)" />

          {/* eyes */}
          <Eyes emotion={emotion} blink={blink} />

          {/* mouth */}
          <Mouth emotion={emotion} />

          {/* love/heart accents */}
          {emotion === "love" && (
            <g className="mascot-hearts" fill="#FF6F6F">
              <path d="M30 30 c -3 -4, -10 -4, -10 2 c 0 5, 10 11, 10 11 c 0 0, 10 -6, 10 -11 c 0 -6, -7 -6, -10 -2 Z" opacity="0.85" transform="scale(0.55) translate(20 -8)" />
              <path d="M30 30 c -3 -4, -10 -4, -10 2 c 0 5, 10 11, 10 11 c 0 0, 10 -6, 10 -11 c 0 -6, -7 -6, -10 -2 Z" opacity="0.85" transform="scale(0.55) translate(95 -8)" />
            </g>
          )}
        </g>
      </svg>
    </button>
  );
}

function Eyes({ emotion, blink }: { emotion: MascotEmotion; blink: boolean }) {
  if (blink || emotion === "sleepy") {
    return (
      <>
        <path d="M40 50 q 4 -3, 8 0" stroke="#1C1917" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M52 50 q 4 -3, 8 0" stroke="#1C1917" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (emotion === "happy") {
    return (
      <>
        <path d="M40 51 q 4 -5, 8 0" stroke="#1C1917" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M52 51 q 4 -5, 8 0" stroke="#1C1917" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (emotion === "surprised") {
    return (
      <>
        <ellipse cx="44" cy="49" rx="2.4" ry="3.2" fill="#1C1917" />
        <ellipse cx="56" cy="49" rx="2.4" ry="3.2" fill="#1C1917" />
      </>
    );
  }
  if (emotion === "excited") {
    return (
      <>
        <path d="M40 49 l 4 -4 l 4 4 l -4 4 Z" fill="#1C1917" />
        <path d="M52 49 l 4 -4 l 4 4 l -4 4 Z" fill="#1C1917" />
      </>
    );
  }
  if (emotion === "love") {
    return (
      <>
        <path d="M44 47 c -1 -2, -4 -2, -4 1 c 0 2, 4 5, 4 5 c 0 0, 4 -3, 4 -5 c 0 -3, -3 -3, -4 -1 Z" fill="#FF6F6F" />
        <path d="M56 47 c -1 -2, -4 -2, -4 1 c 0 2, 4 5, 4 5 c 0 0, 4 -3, 4 -5 c 0 -3, -3 -3, -4 -1 Z" fill="#FF6F6F" />
      </>
    );
  }
  // idle
  return (
    <>
      <circle cx="44" cy="49" r="2.2" fill="#1C1917" />
      <circle cx="56" cy="49" r="2.2" fill="#1C1917" />
      <circle cx="44.7" cy="48.3" r="0.7" fill="#FFF1E1" />
      <circle cx="56.7" cy="48.3" r="0.7" fill="#FFF1E1" />
    </>
  );
}

function Mouth({ emotion }: { emotion: MascotEmotion }) {
  switch (emotion) {
    case "happy":
    case "excited":
    case "love":
      return <path d="M44 58 q 6 5, 12 0" stroke="#1C1917" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
    case "surprised":
      return <circle cx="50" cy="59" r="2.4" fill="#1C1917" />;
    case "sleepy":
      return <path d="M46 60 h 8" stroke="#1C1917" strokeWidth="2" fill="none" strokeLinecap="round" />;
    default:
      return <path d="M46 58 q 4 3, 8 0" stroke="#1C1917" strokeWidth="2" fill="none" strokeLinecap="round" />;
  }
}

ClaudeMascot.useBlink = function useBlinkRef() {
  const ref = useRef<HTMLDivElement | null>(null);
  return ref;
};
