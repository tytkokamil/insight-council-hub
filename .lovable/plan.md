

## Route Rename & Redirect Plan

### Summary
Rename 6 routes to their canonical form, update all internal references, and add redirect routes for backward compatibility.

### Route mapping

| Old | New | Type |
|-----|-----|------|
| `/graph` | `/decision-graph` | protected |
| `/audit` | `/audit-trail` | protected |
| `/knowledge` | `/knowledge-base` | protected |
| `/automations` | `/automation-rules` | protected |
| `/ai-policy` | `/ai-data-policy` | public |
| `/avv` | `/dpa` | public |

### Files to edit (8 files)

**1. `src/routes.tsx`**
- Change primary route `path` for all 6 routes to new names
- Add 6 redirect routes using `<Navigate to="/new-path" replace />` for old paths

**2. `src/components/layout/SidebarNav.tsx`**
- Line 71: `/graph` → `/decision-graph`
- Line 89: `/automations` → `/automation-rules`
- Line 90: `/audit` → `/audit-trail`
- Line 106: `/knowledge` → `/knowledge-base`
- Line 134: `/audit` → `/audit-trail`

**3. `src/components/layout/TopBar.tsx`**
- Update area map keys and title map keys for all 4 protected routes

**4. `src/components/layout/CommandPalette.tsx`**
- Line 38: `/graph` → `/decision-graph`

**5. `src/components/landing/Footer.tsx`**
- Line 23: `/avv` → `/dpa`
- Line 27: `/ai-policy` → `/ai-data-policy`

**6. `src/hooks/usePrefetch.ts`**
- Line 18: `/graph` → `/decision-graph`

**7. `src/pages/GlobalSearch.tsx`**
- Line 168: `/knowledge` → `/knowledge-base`

**8. Legal cross-links (4 files)**
- `DataProcessingAgreement.tsx`: `/ai-policy` → `/ai-data-policy`
- `AiDataPolicy.tsx`: `/avv` → `/dpa`
- `SubProcessors.tsx`: `/avv` → `/dpa`, `/ai-policy` → `/ai-data-policy`
- `PrivacyPolicy.tsx`: `/avv` → `/dpa`, `/ai-policy` → `/ai-data-policy`
- `TermsOfService.tsx`: `/avv` → `/dpa`, `/ai-policy` → `/ai-data-policy`

### Redirect approach
In `routes.tsx`, add `Navigate` imports and 6 redirect routes:
```tsx
<Route path="/graph" element={<Navigate to="/decision-graph" replace />} />
// ... same pattern for all 6
```

