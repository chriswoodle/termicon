// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'
import { createApp, h, nextTick, type App } from 'vue'
import { Identicon } from '../../src/vue.ts'
import { generate } from '../../src/core.ts'
import { toSvg, toIconSvg } from '../../src/svg.ts'

// Poll for the SVG to appear — watchEffect awaits an async generate(), and the timing
// of microtask + nextTick varies. More robust than guessing tick counts.
async function waitForSvg(container: HTMLElement): Promise<void> {
  for (let i = 0; i < 50; i++) {
    if (container.querySelector('svg')) return
    await nextTick()
    await new Promise((r) => setTimeout(r, 1))
  }
  throw new Error('SVG did not render within timeout')
}

async function mount(props: Record<string, unknown>): Promise<{ app: App; container: HTMLDivElement }> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const app = createApp({ render: () => h(Identicon, props) })
  app.mount(container)
  await nextTick()
  return { app, container }
}

describe('<Identicon /> (Vue)', () => {
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

  it('injects an SVG after watchEffect resolves', async () => {
    const { container } = await mount({ value: 'alice' })
    await waitForSvg(container)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('SVG content matches direct toSvg(generate(value)) for same props', async () => {
    const { container } = await mount({ value: 'alice', pixelSize: 64, padding: 2 })
    await waitForSvg(container)
    const id = await generate('alice')
    // Compare by route: serialize the expected SVG through the DOM so void-tag normalization
    // (e.g. <rect/> -> <rect></rect>) matches what the browser stored in innerHTML.
    const wrapper = document.createElement('div')
    wrapper.innerHTML = toSvg(id, { pixelSize: 64, padding: 2 })
    expect(container.querySelector('span')!.innerHTML).toBe(wrapper.innerHTML)
  })

  it('variant="icons" uses toIconSvg', async () => {
    const { container } = await mount({ value: 'alice', variant: 'icons', pixelSize: 64 })
    await waitForSvg(container)
    const id = await generate('alice')
    const wrapper = document.createElement('div')
    wrapper.innerHTML = toIconSvg(id, { pixelSize: 64 })
    expect(container.querySelector('span')!.innerHTML).toBe(wrapper.innerHTML)
  })

  it('honors transparent prop', async () => {
    const { container } = await mount({ value: 'alice', transparent: true })
    await waitForSvg(container)
    expect(container.querySelector('span')!.innerHTML).not.toContain('fill="#f0f0f0"')
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

  it('passes seed through to generate()', async () => {
    const { container: a } = await mount({ value: 'alice' })
    await waitForSvg(a)
    const { container: b } = await mount({ value: 'alice', seed: 'v2' })
    await waitForSvg(b)
    expect(a.querySelector('span')!.innerHTML).not.toBe(b.querySelector('span')!.innerHTML)
  })
})
