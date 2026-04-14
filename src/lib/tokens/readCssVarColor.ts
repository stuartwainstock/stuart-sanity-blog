/**
 * Read a `--*` color custom property from `:root` (Style Dictionary output in globals).
 * WebGL layers (e.g. MapLibre line paint) cannot use `var(...)` strings; resolve here instead.
 */
export function readCssVarColor(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return raw || fallback
}
