/** Rolling window for map + recent table (days). */
export const RUNS_MAP_WINDOW_DAYS = 365

/**
 * Minneapolis–Saint Paul metro (approximate). The runs map defaults to this view and prefers
 * fitting bounds to route segments inside this box so multi-region activity does not zoom out
 * to a world-scale view.
 */
export const RUNS_MAP_HOME_BOUNDS = {
  south: 44.73,
  north: 45.22,
  west: -93.65,
  east: -92.78,
} as const

export const RUNS_MAP_HOME_CENTER = {latitude: 44.98, longitude: -93.18}
export const RUNS_MAP_HOME_ZOOM = 9.5
