import type { WxtViteConfig } from 'wxt'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: [
    '@wxt-dev/module-vue',
    '@wxt-dev/auto-icons',
  ],
  autoIcons: {
    baseIconPath: 'assets/ucan.svg',
  },
  srcDir: 'src',
  vite: (_env): WxtViteConfig => ({
    plugins: [tailwindcss()] as WxtViteConfig['plugins'],
  }),
  webExt: {
    binaries: {
      firefox: 'firefoxdeveloperedition',
    },
  },
})
