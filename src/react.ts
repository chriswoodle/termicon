import { createElement, useEffect, useMemo, useState } from 'react'
import type { ReactElement, CSSProperties } from 'react'
import { generate, type GenerateOptions } from './core.ts'
import { toSvg, toIconSvg } from './svg.ts'
import type { IdenticonResult } from './types.ts'
import type { Palette } from './utils/palette.ts'

export interface IdenticonProps {
  value: string
  size?: 2 | 3 | 5
  seed?: string
  palette?: Palette
  pixelSize?: number
  padding?: number
  background?: string
  transparent?: boolean
  // 'squares' (default) renders each cell as a filled square; 'icons' uses the geometric
  // shape variant (circle, star, hexagon, etc.) selected by the hash.
  variant?: 'squares' | 'icons'
  className?: string
  style?: CSSProperties
  title?: string
}

function renderSvg(id: IdenticonResult, props: IdenticonProps): string {
  const opts = {
    pixelSize: props.pixelSize,
    padding: props.padding,
    background: props.background,
    transparent: props.transparent,
  }
  return props.variant === 'icons' ? toIconSvg(id, opts) : toSvg(id, opts)
}

// React component for rendering an identicon. Generation is async (uses native crypto);
// the first paint is empty until generate() resolves — typically one microtask later.
export function Identicon(props: IdenticonProps): ReactElement {
  const { value, size, seed, palette, className, style, title } = props

  const generateOptions: GenerateOptions = useMemo(
    () => ({ size, seed, palette }),
    [size, seed, palette],
  )

  const [id, setId] = useState<IdenticonResult | null>(null)
  useEffect(() => {
    let cancelled = false
    generate(value, generateOptions).then((result) => { if (!cancelled) setId(result) })
    return () => { cancelled = true }
  }, [value, generateOptions])

  // dangerouslySetInnerHTML is safe here: toSvg builds the markup itself from numeric/HSL
  // values — there's no user-controlled string interpolation in the output.
  const svg = id ? renderSvg(id, props) : ''

  return createElement('span', {
    className,
    style,
    title,
    'aria-label': title ?? `identicon for ${value}`,
    role: 'img',
    dangerouslySetInnerHTML: { __html: svg },
  })
}
