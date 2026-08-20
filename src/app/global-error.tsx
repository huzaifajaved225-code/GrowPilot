"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps): React.JSX.Element {
  useEffect(() => {
    console.error("Root-level application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, sans-serif",
            padding: "1rem",
          }}
        >
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              GrowPilot hit an unexpected error
            </h1>
            <p style={{ color: "#666", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Please try reloading the page. If the problem persists, contact support.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: 6,
                background: "#4f46e5",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
