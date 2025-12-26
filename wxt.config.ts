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
  vite: _env => ({
    plugins: [tailwindcss()],
  }),
  webExt: {
    binaries: {
      firefox: 'firefoxdeveloperedition',
    },
  },
})
