// @vitest-environment happy-dom
import { describe, it, expect, beforeAll } from 'vitest'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Identicon } from '../../src/react.ts'
import { generate } from '../../src/core.ts'
import { toSvg, toIconSvg } from '../../src/svg.ts'

beforeAll(() => {
  // Required for React 18+ to recognize the testing environment and accept act(...).
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

// Wait for useEffect → setState → re-render. Polls instead of guessing tick counts.
async function waitForSvg(container: HTMLElement): Promise<void> {
  for (let i = 0; i < 50; i++) {
    if (container.querySelector('svg')) return
    await act(async () => { await new Promise((r) => setTimeout(r, 1)) })
  }
  throw new Error('SVG did not render within timeout')
}

async function mount(props: Parameters<typeof Identicon>[0]): Promise<{ root: Root; container: HTMLDivElement }> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  let root!: Root
  await act(async () => {
    root = createRoot(container)
    root.render(createElement(Identicon, props))
  })
  return { root, container }
}

// Normalize SVG strings through the DOM so void-tag serialization differences (<rect/> vs
// <rect></rect>) don't break equality tests.
function normalize(svg: string): string {
  const wrapper = document.createElement('div')
  wrapper.innerHTML = svg
  return wrapper.innerHTML
}

describe('<Identicon /> (React)', () => {
  it('renders a role=img span', async () => {
    const { container } = await mount({ value: 'alice' })
    const span = container.querySelector('span')
    expect(span).not.toBeNull()
    expect(span!.getAttribute('role')).toBe('img')
  })

  it('aria-label defaults to "identicon for <value>"', async () => {
    const { container } = await mount({ value: 'alice' })
    expect(container.querySelector('span')!.getAttribute('aria-label')).toBe('identicon for alice')
  })

  it('aria-label uses title prop when provided', async () => {
    const { container } = await mount({ value: 'alice', title: 'Alice avatar' })
    expect(container.querySelector('span')!.getAttribute('aria-label')).toBe('Alice avatar')
  })

  it('injects an SVG after async generate resolves', async () => {
    const { container } = await mount({ value: 'alice' })
    await waitForSvg(container)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('SVG output matches direct toSvg(generate(value)) for same props', async () => {
    const { container } = await mount({ value: 'alice', pixelSize: 64, padding: 2 })
    await waitForSvg(container)
    const id = await generate('alice')
    const expected = normalize(toSvg(id, { pixelSize: 64, padding: 2 }))
    expect(container.querySelector('span')!.innerHTML).toBe(expected)
  })

  it('variant="icons" uses toIconSvg', async () => {
    const { container } = await mount({ value: 'alice', variant: 'icons', pixelSize: 64 })
    await waitForSvg(container)
    const id = await generate('alice')
    expect(container.querySelector('span')!.innerHTML).toBe(normalize(toIconSvg(id, { pixelSize: 64 })))
  })

  it('honors transparent prop', async () => {
    const { container } = await mount({ value: 'alice', transparent: true })
    await waitForSvg(container)
    const html = container.querySelector('span')!.innerHTML
    expect(html).not.toContain('fill="#f0f0f0"')
  })

  it('honors background prop', async () => {
    const { container } = await mount({ value: 'alice', background: '#ff0000' })
    await waitForSvg(container)
    expect(container.querySelector('span')!.innerHTML).toContain('fill="#ff0000"')
  })

  it('passes palette through to generate()', async () => {
    const { container } = await mount({ value: 'alice', palette: ['#abcdef'] })
    await waitForSvg(container)
    expect(container.querySelector('span')!.innerHTML).toContain('fill="#abcdef"')
  })

  it('applies className and style props', async () => {
    const { container } = await mount({ value: 'alice', className: 'avatar', style: { display: 'inline-block' } })
    const span = container.querySelector('span')!
    expect(span.className).toBe('avatar')
    expect(span.style.display).toBe('inline-block')
  })
})
