export function hslString(hue: number, saturation: number, lightness: number): string {
  const clampedHue = Number.isFinite(hue) ? Math.min(360, Math.max(0, hue)) : 0
  const clampedSaturation = Number.isFinite(saturation) ? Math.min(100, Math.max(0, saturation)) : 0
  const clampedLightness = Number.isFinite(lightness) ? Math.min(100, Math.max(0, lightness)) : 0
  return `hsl(${clampedHue},${clampedSaturation}%,${clampedLightness}%)`
}

export function hslToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  saturation /= 100
  lightness /= 100
  const chroma = saturation * Math.min(lightness, 1 - lightness)
  const computeChannel = (channelOffset: number): number => {
    const sector = (channelOffset + hue / 30) % 12
    return lightness - chroma * Math.max(Math.min(sector - 3, 9 - sector, 1), -1)
  }
  return [Math.round(computeChannel(0) * 255), Math.round(computeChannel(8) * 255), Math.round(computeChannel(4) * 255)]
}

// Parses a CSS color string to RGB. Supports #rgb, #rrggbb, rgb(r,g,b), and hsl(h,s%,l%).
// Returns null for unparseable input (named colors aren't supported — pre-convert to hex).
export function parseCssColor(input: string): [number, number, number] | null {
  const s = input.trim().toLowerCase()

  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(s)
  if (hexMatch) {
    const hex = hexMatch[1]!
    if (hex.length === 3) {
      return [
        parseInt(hex[0]! + hex[0]!, 16),
        parseInt(hex[1]! + hex[1]!, 16),
        parseInt(hex[2]! + hex[2]!, 16),
      ]
    }
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ]
  }

  const rgbMatch = /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/.exec(s)
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, Math.round(parseFloat(rgbMatch[1]!))))
    const g = Math.min(255, Math.max(0, Math.round(parseFloat(rgbMatch[2]!))))
    const b = Math.min(255, Math.max(0, Math.round(parseFloat(rgbMatch[3]!))))
    return [r, g, b]
  }

  const hslMatch = /^hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%?\s*,\s*(\d+(?:\.\d+)?)%?/.exec(s)
  if (hslMatch) {
    return hslToRgb(parseFloat(hslMatch[1]!), parseFloat(hslMatch[2]!), parseFloat(hslMatch[3]!))
  }

  return null
}
