import type { LinkStatus } from "../types/links";

export type DestinationState = "ready" | "missing" | "invalid" | "blocked";
export interface LinkDestination {
  href: string | null;
  state: DestinationState;
  reason?: string;
  ephemeral: boolean;
}

/** Validate the destination, never guess permissions or rewrite meaningful search parameters. */
export function getLinkDestination(link: { url: string; status?: LinkStatus | string; accessNote?: string }): LinkDestination {
  if (link.status === "Blocked") return { href: null, state: "blocked", reason: "directory.linkBlocked", ephemeral: false };
  const raw = String(link.url ?? "").trim();
  if (!raw) return { href: null, state: "missing", reason: "directory.linkMissing", ephemeral: false };
  try {
    if (raw.length > 4096 || /[\s<>"'\\]/u.test(raw)) throw new Error();
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase().replace(/\.+$/, '');
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || !host.includes(".") || /^[\d.]+$/.test(host) || /[\[\]:]/.test(host) || /(?:^|\.)(?:localhost|local|internal|intranet)$/.test(host) || (parsed.port && parsed.port !== "443")) throw new Error();
    const ephemeral = [...parsed.searchParams.keys()].some((key) => /^(?:_?csrf(?:token)?|session(?:id|token)?|jsessionid|auth(?:token)?|access_token|refresh_token|navigationid)$/i.test(key));
    return { href: raw, state: "ready", ephemeral, reason: ephemeral ? "directory.linkTemporary" : undefined };
  } catch {
    return { href: null, state: "invalid", reason: "directory.linkInvalid", ephemeral: false };
  }
}

export function inspectLink(url: string, status?: LinkStatus | string) {
  const destination = getLinkDestination({ url, status });
  return { ...destination, url: destination.href, canOpen: destination.state === "ready" };
}
