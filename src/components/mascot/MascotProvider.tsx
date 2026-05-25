"use client";
import { useCallback, useState } from "react";
import { ClaudeSparkle } from "@/components/ui/ClaudeSparkle";

export function MascotMount() {
  const [pulsing, setPulsing] = useState(false);

  const handleTap = useCallback(() => {
    setPulsing(true);
    window.setTimeout(() => setPulsing(false), 350);
  }, []);

  return (
    <button
      type="button"
      data-mascot
      aria-label="Claude"
      onClick={handleTap}
      className={`mascot-corner ${pulsing ? "mascot-pulse" : ""}`}
    >
      <ClaudeSparkle size={32} />
    </button>
  );
}
