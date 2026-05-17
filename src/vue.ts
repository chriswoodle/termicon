import { defineComponent, h, ref, watchEffect, type PropType } from 'vue'
import { generate } from './core.ts'
import { toSvg, toIconSvg } from './svg.ts'
import type { Palette } from './utils/palette.ts'

// Vue 3 component for rendering an identicon. Generation is async (native crypto via
// generate()); the rendered SVG is held in a ref and updated when props change.
export const Identicon = defineComponent({
  name: 'Identicon',
  props: {
    value: { type: String, required: true },
    size: { type: Number as PropType<2 | 3 | 5>, default: 5 },
    seed: { type: String, default: undefined },
    palette: { type: [String, Array] as PropType<Palette>, default: undefined },
    pixelSize: { type: Number, default: 120 },
    padding: { type: Number, default: 1 },
    background: { type: String, default: undefined },
    transparent: { type: Boolean, default: false },
    variant: { type: String as PropType<'squares' | 'icons'>, default: 'squares' },
    title: { type: String, default: undefined },
  },
  setup(props) {
    const svg = ref('')
    watchEffect(async (onCleanup) => {
      let cancelled = false
      onCleanup(() => { cancelled = true })
      const id = await generate(props.value, { size: props.size, seed: props.seed, palette: props.palette })
      if (cancelled) return
      const opts = {
        pixelSize: props.pixelSize,
        padding: props.padding,
        background: props.background,
        transparent: props.transparent,
      }
      svg.value = props.variant === 'icons' ? toIconSvg(id, opts) : toSvg(id, opts)
    })

    return () => h('span', {
      role: 'img',
      'aria-label': props.title ?? `identicon for ${props.value}`,
      innerHTML: svg.value,
    })
  },
})
