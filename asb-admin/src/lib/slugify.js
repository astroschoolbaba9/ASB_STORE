// src/lib/slugify.js
export function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "") // remove quotes
    .replace(/[^a-z0-9]+/g, "-") // non-alnum => dash
    .replace(/-+/g, "-") // collapse
    .replace(/^-|-$/g, ""); // trim dashes
}
