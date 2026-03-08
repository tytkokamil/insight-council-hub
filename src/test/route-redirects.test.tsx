import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

const REDIRECTS: [string, string][] = [
  ["/graph", "/decision-graph"],
  ["/audit", "/audit-trail"],
  ["/knowledge", "/knowledge-base"],
  ["/automations", "/automation-rules"],
  ["/ai-policy", "/ai-data-policy"],
  ["/avv", "/dpa"],
];

function CaptureLocation() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

describe("Route redirects", () => {
  REDIRECTS.forEach(([oldPath, newPath]) => {
    it(`redirects ${oldPath} → ${newPath}`, () => {
      const { getByTestId } = render(
        <MemoryRouter initialEntries={[oldPath]}>
          <Routes>
            <Route path={oldPath} element={<Navigate to={newPath} replace />} />
            <Route path={newPath} element={<CaptureLocation />} />
            <Route path="*" element={<div data-testid="location">not-found</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(getByTestId("location").textContent).toBe(newPath);
    });
  });
});
