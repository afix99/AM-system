"use client";
import { useCallback, useRef, useState } from "react";
import { MascotCharacter, type MascotMood } from "./MascotCharacter";
import { useAutonomy } from "./useAutonomy";

export function MascotMount() {
  const wrapperRef = useRef<HTMLButtonElement | null>(null);
  const [mood, setMood] = useState<MascotMood>("idle");
  const [facingLeft, setFacingLeft] = useState(false);
  const celebrateUntilRef = useRef(0);

  const handleState = useCallback(
    (s: { speed: number; facingLeft: boolean; isMouseNear: boolean; isSleepy: boolean }) => {
      setFacingLeft(s.facingLeft);
      if (performance.now() < celebrateUntilRef.current) return;
      if (s.isSleepy) setMood("sleeping");
      else if (s.isMouseNear) setMood("curious");
      else if (s.speed > 1) setMood("walking");
      else setMood("idle");
    },
    []
  );

  useAutonomy({
    elementRef: wrapperRef,
    onStateChange: handleState,
    bottomInset: 112,
    topInset: 64,
    rightInset: 0,
  });

  const handleClick = useCallback(() => {
    setMood("celebrating");
    celebrateUntilRef.current = performance.now() + 1100;
    window.setTimeout(() => {
      if (performance.now() >= celebrateUntilRef.current) setMood("idle");
    }, 1150);
  }, []);

  return (
    <button
      ref={wrapperRef}
      type="button"
      data-mascot
      aria-label="Claude"
      onClick={handleClick}
      className="mascot-wrap"
    >
      <MascotCharacter mood={mood} facingLeft={facingLeft} size={52} />
    </button>
  );
}
