import { describe, expect, it } from 'vitest'
import { loadConfigFromFile } from 'vite'

 describe('Vite packaged asset paths', () => {
  it('uses relative asset URLs so the desktop and Android app can load offline', async () => {
    const loaded = await loadConfigFromFile({ command: 'build', mode: 'production' }, 'vite.config.ts')
    expect(loaded?.config.base).toBe('./')
  })
})
