# termicon

[![npm version](https://img.shields.io/npm/v/termicon.svg)](https://www.npmjs.com/package/termicon)
[![npm downloads](https://img.shields.io/npm/dm/termicon.svg)](https://www.npmjs.com/package/termicon)
[![Build](https://github.com/chriswoodle/termicon/actions/workflows/bump.yml/badge.svg)](https://github.com/chriswoodle/termicon/actions/workflows/bump.yml)
[![types](https://img.shields.io/npm/types/termicon.svg)](https://www.npmjs.com/package/termicon)
[![license](https://img.shields.io/npm/l/termicon.svg)](./LICENSE)

Identicon library that works with the terminal and browser. Generates deterministic, visually distinct avatars from any string — email address, username, hash, or arbitrary text.

![Terminal output showing identicon rendered in ANSI color blocks](https://raw.githubusercontent.com/chriswoodle/termicon/main/sample-terminal.png)

![Browser output showing identicon rendered as SVG](https://raw.githubusercontent.com/chriswoodle/termicon/main/sample-browser.png)

## Install

```sh
yarn add termicon
```

## Quick start

Pick your environment — each example is everything you need to render an avatar from a string.

### React

```tsx
import { Identicon } from 'termicon/react'

export function UserAvatar({ email }) {
  return <Identicon value={email} pixelSize={48} />
}
```

The component generates the hash asynchronously and inlines the SVG. Configure colors and shape with `palette`, `variant`, `background`, and more — see the [React component](#identicon-react) reference below.

### Vue

```vue
<script setup>
import { Identicon } from 'termicon/vue'
defineProps(['email'])
</script>

<template>
  <Identicon :value="email" :pixel-size="48" />
</template>
```

See the [Vue component](#identicon-vue) reference for configurable props.

### Svelte

No wrapper component — call the SVG renderer directly:

```svelte
<script>
  import { generate } from 'termicon'
  import { toSvg } from 'termicon/svg'
  export let email
</script>

{#await generate(email) then id}
  {@html toSvg(id, { pixelSize: 48 })}
{/await}
```

### Vanilla browser

```ts
import { generate } from 'termicon'
import { toSvg, toDataUri } from 'termicon/svg'

const id = await generate('alice@example.com')

// Inject inline SVG…
document.querySelector('#avatar').innerHTML = toSvg(id)

// …or use a data URI on an <img>:
document.querySelector('img.avatar').src = toDataUri(id)
```

### Node / terminal

```ts
import { generate } from 'termicon'
import { toAnsi } from 'termicon/ansi'

toAnsi.write(await generate('alice@example.com'), process.stdout)
```

### TUI applications (ink, blessed, etc.)

`toAnsi` returns a string of truecolor ANSI escapes that any terminal-UI library can pass through to stdout. Drop it into whichever "raw text" primitive your TUI exposes — don't wrap it in a styled container, since that fights with the per-cell background escapes termicon emits.

**[ink](https://github.com/vadimdemedes/ink)** (React for terminals):

```tsx
import React, { useEffect, useState } from 'react'
import { Text } from 'ink'
import { generate } from 'termicon'
import { toAnsi } from 'termicon/ansi'

export function Identicon({ value }: { value: string }) {
  const [ansi, setAnsi] = useState('')
  useEffect(() => {
    generate(value).then((id) => setAnsi(toAnsi(id, { transparent: true })))
  }, [value])
  return <Text>{ansi}</Text>
}
```

`<Text>` passes escape sequences through untouched. Avoid `<Box backgroundColor="…">` around it — that conflicts with the per-cell color escapes.

**[blessed](https://github.com/chjj/blessed)** / blessed-contrib:

```ts
import blessed from 'blessed'
import { generate } from 'termicon'
import { toAnsi } from 'termicon/ansi'

const screen = blessed.screen()
const box = blessed.box({ tags: false, width: 12, height: 5, top: 0, left: 0 })
box.setContent(toAnsi(await generate('alice'), { cellWidth: 2 }))
screen.append(box)
screen.render()
```

Set `tags: false` so blessed doesn't try to interpret the escapes as its own markup. Size the box to `cellWidth * gridSize` columns × `gridSize` rows.

**General TUI guidance:**

- **Layout math.** A 5×5 identicon with default `cellWidth: 2` occupies **10 columns × 5 rows**. For 3×3 it's 6×3, for 2×2 it's 4×2. Increase `cellWidth` for a chunkier look (3 or 4 is common in TUI dashboards).
- **Backgrounds.** Pass `transparent: true` to let the host terminal/TUI theme show through, or `background: '#1a1a1a'` (or any hex/`rgb()`/`hsl()`) to match your palette. The default gray (`rgb(240,240,240)`) is tuned for general use and may clash with dark themes.
- **Truecolor support.** termicon emits SGR `48;2;R;G;B` truecolor escapes — works in iTerm, Windows Terminal, Alacritty, Kitty, WezTerm, and modern xterm. In terminals that lack truecolor, colors degrade to nearest 256-color but the layout stays correct.
- **Async caveat.** `generate()` is async. In ink, generate in `useEffect`. In imperative TUIs (blessed, react-curse, etc.), `await` before drawing the frame. The hash is fast enough (sub-millisecond for typical inputs) that you usually don't need a loading state.

---

## API

### `generate(input, options?)`

Hashes the input with SHA-256 and returns an `IdenticonResult` describing the grid, color, and shape. All renderers take this result as their first argument. Uses native crypto (`crypto.subtle.digest` in browsers, `node:crypto` in Node) — async because Web Crypto's digest API is async-only.

```ts
import { generate } from 'termicon'

const id = await generate('alice@example.com')
// { grid: number[][], color: { h, s, l }, shape: number, cssColor: string }
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | `2 \| 3 \| 5` | `5` | Grid dimensions |
| `seed` | `string` | — | Mixed into the hash. Use when the visual should be stable across input changes (e.g., user renames) |
| `palette` | `PaletteName \| string[]` | — | Color palette — see [Palettes](#palettes) below |

---

### Palettes

By default, foreground color is derived from the hash as HSL. Pass `palette` to pick from a curated preset or your own array of CSS colors.

```ts
const id = await generate('alice@example.com', { palette: 'pastel' })
// id.cssColor === '#a6c8e1' (or whichever entry the hash points to)

const custom = await generate('alice@example.com', {
  palette: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf'],
})
```

Built-in presets: `'default'` (hash-derived HSL), `'pastel'`, `'mono'`, `'vivid'`, `'earth'`, `'ocean'`, `'sunset'`.

---

### `seed`

Decouple the visual from the input string. Useful for stable avatars across account renames or for namespacing (e.g., different palettes per environment without changing inputs).

```ts
await generate('user-1234', { seed: 'avatar-v2' })
// Same user-1234 always produces the same avatar; bumping seed to 'avatar-v3' rolls everyone.
```

---

### `toSvg(id, options?)`

Returns an SVG string of squares.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pixelSize` | `number` | `120` | Width and height of the output in pixels |
| `padding` | `number` | `1` | Empty cells around the grid on each side |
| `background` | `string` | `'#f0f0f0'` | CSS color for the background |
| `transparent` | `boolean` | `false` | Omit the background rect (overrides `background`) |

---

### `toIconSvg(id, options?)`

Like `toSvg` but renders cells as shapes (circle, diamond, star, hexagon, etc.) instead of squares. The shape is derived from the hash so it is stable per input. Accepts the same options as `toSvg`.

---

### `toDataUri(id, options?)` / `toIconDataUri(id, options?)`

Returns a `data:image/svg+xml;utf8,…` URI. Drop straight into `<img src>` or CSS `background-image` — no DOM mounting required.

```ts
import { toDataUri } from 'termicon/svg'

const uri = toDataUri(await generate('alice@example.com'))
document.querySelector('img.avatar').src = uri
```

---

### `toCanvas(id, ctx, options?)`

Draws onto an existing `CanvasRenderingContext2D`. The caller is responsible for sizing the canvas to match `pixelSize` before calling.

```ts
import { toCanvas } from 'termicon/canvas'

const canvas = document.createElement('canvas')
canvas.width = canvas.height = 120
toCanvas(id, canvas.getContext('2d')!)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pixelSize` | `number` | `120` | Logical render size in pixels |
| `padding` | `number` | `1` | Empty cells around the grid |
| `background` | `string` | `'#f0f0f0'` | CSS color for the background |
| `transparent` | `boolean` | `false` | Skip drawing the background |

---

### `toAnsi(id, options?)` / `toAnsi.write(id, stream, options?)`

Returns a string with truecolor ANSI escape sequences for display in a terminal. `toAnsi.write` pipes it to a writable stream with a trailing newline.

```ts
import { toAnsi } from 'termicon/ansi'

console.log(toAnsi(id))

// Or write directly to a stream:
toAnsi.write(id, process.stdout)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cellWidth` | `number` | `2` | Number of space characters per cell |
| `background` | `string` | — | CSS color (hex, rgb(), or hsl()) for off-cells |
| `transparent` | `boolean` | `false` | Use the terminal's default background color instead |

---

### `toAscii(id, options?)`

Returns a plain-text string. Useful in environments without color support or for debugging.

```ts
import { toAscii } from 'termicon/ascii'

console.log(toAscii(id))
// #.#.#
// #####
// ##.##
// .#.#.
// .....
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cellWidth` | `number` | `1` | Characters per cell |
| `onChar` | `string` | `'#'` | Character for on-cells |
| `offChar` | `string` | `'.'` | Character for off-cells |

---

### `fingerprint(id)`

Returns a stable, human-readable string fingerprint of an identicon. Useful for test assertions — encodes the canonical hash-derived properties (grid, color, shape), ignoring rendering choices like palette.

```ts
import { fingerprint, generate } from 'termicon'

expect(fingerprint(await generate('alice'))).toBe(
  '5x5:0000001110111110101011011:hsl(239,44,52):35'
)
```

---

### `<Identicon>` (React) {#identicon-react}

Imported from `termicon/react`. Renders a `<span role="img" aria-label="…">` with an inline SVG. Generation is async; the first paint is empty until `generate()` resolves (typically the next microtask). Requires React ≥ 19. Listed as an optional `peerDependency`.

```tsx
import { Identicon, type IdenticonProps } from 'termicon/react'
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | *(required)* | Input string to hash |
| `size` | `2 \| 3 \| 5` | `5` | Grid dimensions |
| `seed` | `string` | — | Mixed into the hash, see [`seed`](#seed) |
| `palette` | `PaletteName \| string[]` | — | Color palette, see [Palettes](#palettes) |
| `pixelSize` | `number` | `120` | SVG width/height in pixels |
| `padding` | `number` | `1` | Empty cells around the grid |
| `background` | `string` | `'#f0f0f0'` | CSS color for the background |
| `transparent` | `boolean` | `false` | Omit the background rect |
| `variant` | `'squares' \| 'icons'` | `'squares'` | `'icons'` renders shapes per cell instead of squares |
| `title` | `string` | — | Overrides the default `aria-label` |
| `className` | `string` | — | Forwarded to the wrapper `<span>` |
| `style` | `CSSProperties` | — | Forwarded to the wrapper `<span>` |

The SVG is injected via `dangerouslySetInnerHTML`, which is safe here because the markup is built from numeric values — no string interpolation from user input.

---

### `<Identicon>` (Vue) {#identicon-vue}

Imported from `termicon/vue`. Same structure as the React wrapper. Uses `watchEffect` so the SVG updates reactively when props change. Requires Vue ≥ 3.5. Listed as an optional `peerDependency`.

```vue
<script setup>
import { Identicon } from 'termicon/vue'
</script>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | *(required)* | Input string to hash |
| `size` | `2 \| 3 \| 5` | `5` | Grid dimensions |
| `seed` | `string` | — | Mixed into the hash |
| `palette` | `PaletteName \| string[]` | — | Color palette |
| `pixelSize` | `number` | `120` | SVG width/height in pixels |
| `padding` | `number` | `1` | Empty cells around the grid |
| `background` | `string` | `'#f0f0f0'` | CSS color for the background |
| `transparent` | `boolean` | `false` | Omit the background rect |
| `variant` | `'squares' \| 'icons'` | `'squares'` | `'icons'` renders shapes per cell |
| `title` | `string` | — | Overrides the default `aria-label` |

## Development

```sh
yarn install
yarn dlx @yarnpkg/sdks vscode
yarn test
yarn build
```

## License

[MIT](./LICENSE)
