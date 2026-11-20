// Search and avatar helpers for the custom select: accent-insensitive matching
// and up to two initials taken from the first letters or digits of each word.
export function normalizeOptionText(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function initialsOfLabel(text) {
  let out = "";
  for (const part of String(text ?? "").trim().split(/\s+/)) {
    const char = [...part].find((item) => /[\p{L}\p{N}]/u.test(item));
    if (char) out += char;
    if (out.length >= 2) break;
  }
  return (out || "?").toUpperCase();
}
