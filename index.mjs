import { existsSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import esbuild from 'esbuild'

const { resolve, join, relative } = path

const outDir = '.begin'
const staticDir = resolve(outDir, 'public')

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

    async adapt (builder) {
      // a directory in sveltekit to place files ie. entrypoints for esbuild and shims
      const entryDir = builder.getBuildDirectory('begin')
      // Where sveltekit has built its output
      const serverDir = relative(entryDir, builder.getServerDirectory())

      // clear out directories
      builder.rimraf(outDir)
      builder.rimraf(entryDir)

      builder.log.minor('Prerendering static pages...')
      await builder.prerender({
        dest: staticDir
      })

      // files to copy into sveltekit ie. the lambda handler which is the entrypoint for esbuild
      const files = fileURLToPath(new URL('./files', import.meta.url))

      builder.log.minor('verifying app.arc manifest exists')
      if (!existsSync('app.arc')) {
        builder.log.minor('adding architect manifest app.arc')
        builder.copy(join(files, 'app.arc'), 'app.arc')
      }

      builder.log.minor('bundling server for lambda...')
      // copy esbuild entry point to build and bundle code
      builder.copy(join(files, 'entry.js'), join(entryDir, 'entry.js'), {
        replace: {
          APP: join(serverDir, 'app.js'),
          MANIFEST: './manifest.js'
        }
      })

      builder.log.minor('generating manifest...')
      // generate a manifest file
      writeFileSync(
        join(entryDir, 'manifest.js'),
        `export const manifest = ${builder.generateManifest({
          relativePath: serverDir
        })};\n`
      )

      /** @type {BuildOptions} */
      const defaultOptions = {
        entryPoints: [join(entryDir, 'entry.js')],
        outfile: join(outDir, 'sveltekit-render', 'index.js'),
        bundle: true,
        inject: [join(files, 'shims.js')],
        platform: 'node'
      }

      const buildOptions =
        options && options.esbuild ? await options.esbuild(defaultOptions) : defaultOptions

      await esbuild.build(buildOptions)

      builder.log.minor('Writing client application...')
      builder.writeStatic(staticDir)
      builder.writeClient(staticDir)
    }
  }

  return adapter
}
