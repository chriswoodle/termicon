import { describe, it, expect } from 'vitest'
import { parseCssColor } from '../../src/utils/color.ts'

describe('parseCssColor', () => {
  it('parses #rgb shorthand', () => {
    expect(parseCssColor('#abc')).toEqual([0xaa, 0xbb, 0xcc])
  })

  it('parses #rrggbb', () => {
    expect(parseCssColor('#ff8800')).toEqual([255, 136, 0])
  })

  it('is case insensitive', () => {
    expect(parseCssColor('#FF8800')).toEqual([255, 136, 0])
    expect(parseCssColor('#Ff88aB')).toEqual([255, 136, 171])
  })

  it('parses rgb()', () => {
    expect(parseCssColor('rgb(10, 20, 30)')).toEqual([10, 20, 30])
  })

  it('parses rgba() ignoring alpha', () => {
    expect(parseCssColor('rgba(10, 20, 30, 0.5)')).toEqual([10, 20, 30])
  })

  it('parses hsl()', () => {
    const rgb = parseCssColor('hsl(0, 100%, 50%)')
    expect(rgb).toEqual([255, 0, 0])
  })

  it('clamps rgb values above 255', () => {
    expect(parseCssColor('rgb(300, 400, 128)')).toEqual([255, 255, 128])
  })

  it('returns null for unparseable input', () => {
    expect(parseCssColor('red')).toBeNull()
    expect(parseCssColor('garbage')).toBeNull()
    expect(parseCssColor('#zzz')).toBeNull()
  })

  it('trims whitespace', () => {
    expect(parseCssColor('  #ff8800  ')).toEqual([255, 136, 0])
  })
})
