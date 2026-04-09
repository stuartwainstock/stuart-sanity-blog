/**
 * Next/SWC + MapLibre can reference Babel's `_wrap_native_super` without bundling the helper.
 * Install the real @babel/runtime helper on globalThis before any `maplibre-gl` import runs.
 */
import wrapNativeSuper from '@babel/runtime/helpers/wrapNativeSuper'

type WithWrap = typeof globalThis & {
  _wrap_native_super?: typeof wrapNativeSuper
}

const g = globalThis as WithWrap
if (g._wrap_native_super === undefined) {
  g._wrap_native_super = wrapNativeSuper
}
