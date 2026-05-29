import { resolveCss } from './utils/color.ts'
import type { IdenticonResult } from './types.ts'

const DEFAULT_PIXEL_SIZE = 120
const DEFAULT_BG = '#f0f0f0'

export interface CanvasOptions {
  pixelSize?: number
  padding?: number
  background?: string
  transparent?: boolean
}

// Draws the identicon onto an existing canvas context — background first, then foreground cells.
// The caller is responsible for sizing the canvas to match pixelSize before calling.
export function toCanvas(
  identicon: IdenticonResult,
  ctx: CanvasRenderingContext2D,
  options: CanvasOptions = {},
): void {
  const pixelSize = options.pixelSize ?? DEFAULT_PIXEL_SIZE
  const padding = options.padding ?? 1
  const { grid } = identicon
  const gridSize = grid.length
  const cellSize = pixelSize / (gridSize + 2 * padding)
  const offset = padding * cellSize
  const foregroundColor = resolveCss(identicon)

  if (!options.transparent) {
    ctx.fillStyle = options.background ?? DEFAULT_BG
    ctx.fillRect(0, 0, pixelSize, pixelSize)
  }
  // When transparent, caller is responsible for sizing/clearing the canvas before calling.

  ctx.fillStyle = foregroundColor
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col]) {
        const x = offset + col * cellSize
        const y = offset + row * cellSize
        ctx.fillRect(x, y, cellSize, cellSize)
      }
    }
  }
}
