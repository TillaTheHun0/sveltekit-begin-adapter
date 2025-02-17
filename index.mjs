/* eslint-disable no-unused-vars */

import { readFileSync, existsSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import esbuild from 'esbuild'
const { resolve, join } = path
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * @typedef {import('esbuild').BuildOptions} BuildOptions
 */

/**
 * @param {{
 *   esbuild?: (defaultOptions: BuildOptions) => Promise<BuildOptions> | BuildOptions;
 * }} [options]
 **/
export default function (options) {
  /** @type {import('@sveltejs/kit').Adapter} */
  const adapter = {
    name: '@sveltejs/adapter-begin',

    async adapt ({ utils }) {
      const files = fileURLToPath(new URL('./files', import.meta.url))
      utils.log.minor('verifying app.arc manifest exists')
      if (!existsSync('app.arc')) {
        utils.log.minor('adding architect manifest app.arc')
        utils.copy(join(files, 'app.arc'), 'app.arc')
      }

      utils.log.minor('bundling server for lambda...')
      utils.copy(join(files, 'entry.js'), '.svelte-kit/begin/entry.js')

      /** @type {BuildOptions} */
      const defaultOptions = {
        entryPoints: ['.svelte-kit/begin/entry.js'],
        outfile: join('.begin', 'sveltekit-render', 'index.js'),
        bundle: true,
        inject: [join(files, 'shims.js')],
        platform: 'node'
      }

      const buildOptions = options && options.esbuild
        ? await options.esbuild(defaultOptions)
        : defaultOptions

      await esbuild.build(buildOptions)

      const staticDirectory = resolve('.begin', 'public')

      utils.log.minor('Writing client application...')
      utils.copy_static_files(staticDirectory)
      utils.copy_client_files(staticDirectory)

      utils.log.minor('Prerendering static pages...')
      await utils.prerender({ dest: staticDirectory })
    }
  }

  return adapter
}
