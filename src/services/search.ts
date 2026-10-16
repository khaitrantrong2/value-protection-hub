/** Deterministic bilingual matching; preserves source records and never sends content to a translator. */
export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const SYNONYMS = [
  ["accounts receivable", "account receivable", "receivables", "cong no", "ar"],
  ["collection", "collections", "thu tien", "thu hoi"],
  ["process", "quy trinh"], ["contract", "hop dong"],
  ["owner", "nguoi phu trach", "phu trach"], ["team", "doi ngu"],
  ["template", "templates", "bieu mau"], ["policy", "chinh sach"],
  ["input", "inputs", "dau vao"], ["output", "outputs", "dau ra"],
  ['reconciliation', 'reconciliations', 'recon', 'doi soat'],
  ['accrual', 'trich truoc'], ['settlement', 'tat toan'],
] as const;

function canonical(value: string): string {
  let result = ` ${normalizeSearch(value)} `;
  SYNONYMS.forEach((group, index) => {
    for (const phrase of [...group].sort((a, b) => b.length - a.length)) result = result.replace(new RegExp(`\\b${phrase}\\b`, "g"), `term${index}`);
  });
  return result.trim();
}

export function matchesSearch(query: string, values: string | readonly string[]): boolean {
  const needle = canonical(query);
  if (!needle) return true;
  const haystack = canonical(typeof values === "string" ? values : values.join(" "));
  return needle.split(/\s+/).every(word => word.length <= 2 ? haystack.split(/\s+/).includes(word) : haystack.includes(word));
}
