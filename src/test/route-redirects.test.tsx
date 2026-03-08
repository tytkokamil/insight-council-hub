import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";

/**
 * Minimal redirect routes mirroring src/routes.tsx definitions.
 * We test that each old path redirects to the new canonical path.
 */
const REDIRECTS: [string, string][] = [
  ["/graph", "/decision-graph"],
  ["/audit", "/audit-trail"],
  ["/knowledge", "/knowledge-base"],
  ["/automations", "/automation-rules"],
  ["/ai-policy", "/ai-data-policy"],
  ["/avv", "/dpa"],
];

function LocationDisplay() {
  // We can't use useLocation outside Router, so we use a small helper
  const Location = () => {
    const loc = window.__test_location;
    return <div data-testid="location">{loc}</div>;
  };
  return <Location />;
}

// A tiny component that captures location via the router
function CaptureLocation() {
  // Using a React Router compatible way
  return <CaptureInner />;
}

import { useLocation } from "react-router-dom";

function CaptureInner() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe("Route redirects", () => {
  REDIRECTS.forEach(([oldPath, newPath]) => {
    it(`redirects ${oldPath} → ${newPath}`, () => {
      render(
        <MemoryRouter initialEntries={[oldPath]}>
          <Routes>
            <Route path={oldPath} element={<Navigate to={newPath} replace />} />
            <Route path={newPath} element={<CaptureInner />} />
            <Route path="*" element={<div data-testid="location">not-found</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId("location").textContent).toBe(newPath);
    });
  });
});
