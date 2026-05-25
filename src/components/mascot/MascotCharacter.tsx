"use client";
import { useEffect, useState } from "react";

export type MascotMood = "idle" | "walking" | "curious" | "sleeping" | "celebrating";

interface Props {
  mood: MascotMood;
  facingLeft: boolean;
  size?: number;
}

export function MascotCharacter({ mood, facingLeft, size = 52 }: Props) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (mood === "sleeping" || mood === "celebrating") return;
    const tick = () => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 130);
    };
    const id = window.setInterval(tick, 3200 + Math.random() * 2400);
    return () => window.clearInterval(id);
  }, [mood]);

  const eyesClosed = mood === "sleeping" || blink;

  // The character body is the Claude sparkle. Face is anchored to the centre and
  // never inherits the body's wobble, so eyes stay legible during motion.
  return (
    <span
      className={`mascot-char mascot-mood-${mood}`}
      style={{ width: size, height: size, transform: facingLeft ? "scaleX(-1)" : undefined }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="mascot-svg">
        <defs>
          <radialGradient id="mascotCharCore" cx="48%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#FFE4D2" />
            <stop offset="35%" stopColor="#F4A982" />
            <stop offset="78%" stopColor="#D97756" />
            <stop offset="100%" stopColor="#A8552F" />
          </radialGradient>
          <radialGradient id="mascotCharHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D97756" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#D97756" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* halo */}
        <circle cx="50" cy="50" r="46" fill="url(#mascotCharHalo)" className="mascot-halo" />

        {/* sparkle body — does NOT spin during normal play */}
        <g className="mascot-body">
          <path
            d="M50 6 C 53 38, 56 41, 94 50 C 56 59, 53 62, 50 94 C 47 62, 44 59, 6 50 C 44 41, 47 38, 50 6 Z"
            fill="url(#mascotCharCore)"
          />
          <path
            d="M50 6 C 53 38, 56 41, 94 50 C 56 59, 53 62, 50 94 C 47 62, 44 59, 6 50 C 44 41, 47 38, 50 6 Z"
            fill="url(#mascotCharCore)"
            opacity="0.55"
            transform="rotate(45 50 50)"
          />
        </g>

        {/* face — small, subtle, centered, locked steady */}
        <g className="mascot-face">
          {eyesClosed ? (
            <>
              <path d="M42 49 q 3 -2.5, 6 0" stroke="#1C1917" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              <path d="M52 49 q 3 -2.5, 6 0" stroke="#1C1917" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </>
          ) : mood === "curious" ? (
            <>
              <ellipse cx="45" cy="49" rx="1.7" ry="2.2" fill="#1C1917" />
              <ellipse cx="55" cy="49" rx="1.7" ry="2.2" fill="#1C1917" />
            </>
          ) : (
            <>
              <circle cx="45" cy="49" r="1.6" fill="#1C1917" />
              <circle cx="55" cy="49" r="1.6" fill="#1C1917" />
            </>
          )}

          {/* mouth */}
          {mood === "sleeping" ? (
            <path d="M46 56 h 8" stroke="#1C1917" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          ) : mood === "celebrating" || mood === "curious" ? (
            <path d="M45 55 q 5 4, 10 0" stroke="#1C1917" strokeWidth="1.7" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M46 55 q 4 2.5, 8 0" stroke="#1C1917" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          )}
        </g>

        {/* sleeping z's */}
        {mood === "sleeping" && (
          <g className="mascot-zzz">
            <text x="74" y="32" fontSize="10" fontFamily="sans-serif" fontWeight="700" fill="#F4A982" opacity="0.85">z</text>
            <text x="82" y="22" fontSize="7" fontFamily="sans-serif" fontWeight="700" fill="#F4A982" opacity="0.6">z</text>
          </g>
        )}
      </svg>
    </span>
  );
}
