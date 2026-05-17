export type PaletteName = 'default' | 'pastel' | 'mono' | 'vivid' | 'earth' | 'ocean' | 'sunset'
export type Palette = PaletteName | readonly string[]

// Curated palette presets. Picked to look reasonable against the default #f0f0f0 background.
// 'default' is a sentinel — the renderer ignores it and uses the hash-derived HSL color.
const PRESETS: Record<Exclude<PaletteName, 'default'>, readonly string[]> = {
  pastel: ['#f4a6a6', '#f4c2a6', '#f4e1a6', '#c8e1a6', '#a6d6c2', '#a6c8e1', '#bca6e1', '#e1a6d2'],
  mono:   ['#202020', '#404040', '#606060', '#808080'],
  vivid:  ['#e91e63', '#9c27b0', '#3f51b5', '#03a9f4', '#009688', '#4caf50', '#ff9800', '#f44336'],
  earth:  ['#6b4423', '#8b5a2b', '#a67c52', '#c19a6b', '#5e7a3a', '#7a8f4a', '#b8b06b', '#8c6d3f'],
  ocean:  ['#0a1f3d', '#1e3a5f', '#3a6090', '#5b8db8', '#7eb3d3', '#a8d4e5', '#4a8b7a', '#2c5e4a'],
  sunset: ['#3a1f5d', '#7a2e7d', '#c14a8a', '#e87b7b', '#f5a96b', '#f7c873', '#fae0a0', '#fff2c4'],
}

export function isPaletteName(value: unknown): value is PaletteName {
  return typeof value === 'string' && (value === 'default' || value in PRESETS)
}

// Picks a CSS color from the palette using `index` (a hash byte) for stable selection.
// Returns null when the palette is 'default', signaling: use the hash-derived HSL color.
export function pickFromPalette(palette: Palette, index: number): string | null {
  if (palette === 'default') return null
  const colors = Array.isArray(palette) ? palette : PRESETS[palette as Exclude<PaletteName, 'default'>]
  if (!colors || colors.length === 0) return null
  return colors[index % colors.length]!
}
