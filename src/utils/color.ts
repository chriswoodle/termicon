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
