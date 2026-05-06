const PUBLIC_BASE = import.meta.env.VITE_PUBLIC_URL?.replace(/\/$/, "") ?? "";

export function clientUrl(path: string): string {
  const base = PUBLIC_BASE || window.location.origin;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
