export interface HslColor {
  h: number
  s: number
  l: number
}

export interface IdenticonResult {
  grid: number[][]
  color: HslColor
  shape: number
  // CSS color string used by renderers. Always populated by generate().
  // Optional for hand-constructed test fixtures — renderers fall back to `color` when absent.
  cssColor?: string
}
