/**
 * Walk DTCG-style token JSON (Style Dictionary source) and collect leaves with `$value`.
 */
export type JsonTokenLeaf = {
  /** Dot path, e.g. `color.background` */
  path: string
  $value: string
  $description?: string
}

export function walkDtcgLeaves(
  obj: unknown,
  prefix: string[] = [],
): JsonTokenLeaf[] {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return []
  }

  const record = obj as Record<string, unknown>

  if (typeof record.$value === 'string') {
    const path = prefix.join('.')
    return [
      {
        path,
        $value: record.$value,
        $description: typeof record.$description === 'string' ? record.$description : undefined,
      },
    ]
  }

  const rows: JsonTokenLeaf[] = []
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith('$')) continue
    rows.push(...walkDtcgLeaves(value, [...prefix, key]))
  }
  return rows
}
