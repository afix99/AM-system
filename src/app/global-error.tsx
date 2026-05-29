"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#1C1917", color: "#F5EFE8", fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>Application error</h1>
          <p style={{ fontSize: "0.875rem", color: "#A8A29E", maxWidth: "28rem", marginBottom: "1.5rem" }}>
            A critical error prevented the app from rendering. Try reloading.
          </p>
          {error.digest && (
            <p style={{ fontSize: "0.75rem", color: "#78716C", fontFamily: "monospace", marginBottom: "1.5rem" }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{ background: "#D97756", border: 0, color: "#F5EFE8", padding: "0.5rem 1rem", borderRadius: "0.375rem", fontSize: "0.875rem", cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
