/**
 * Input sanitization utilities for XSS prevention.
 * Use these before rendering any user-generated content.
 */

/** Strip HTML tags from a string */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/** Escape HTML special characters */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/** Sanitize a string for safe display – strips tags and trims */
export function sanitizeText(input: string, maxLength = 10000): string {
  if (!input) return "";
  return stripHtml(input).trim().slice(0, maxLength);
}

/** Validate and sanitize a URL – only allow http(s) and relative URLs */
export function sanitizeUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  // Allow relative URLs
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  // Allow http(s) only
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return trimmed;
  } catch {
    // Invalid URL
  }
  return "";
}

/** Sanitize an email address */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().slice(0, 255);
}
