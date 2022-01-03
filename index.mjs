import { readFileSync, existsSync,writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'
import esbuild from 'esbuild'
const { resolve, join } = path
const __dirname = path.dirname(new URL(import.meta.url).pathname);

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

		async adapt(builder) {
			const tmp = builder.getBuildDirectory('begin-tmp')

			builder.rimraf('.begin')
			
			const files = fileURLToPath(new URL('./files', import.meta.url))
			builder.log.minor('verifying app.arc manifest exists');
			if (!existsSync('app.arc')) {
				builder.log.minor('adding architect manifest app.arc');
				builder.copy(join(files, 'app.arc'), 'app.arc')
			}

			builder.log.minor('bundling server for lambda...');
			builder.copy(join(files, 'entry.js'), '.svelte-kit/begin/entry.js');


			/** @type {BuildOptions} */
			const defaultOptions = {
				entryPoints: ['.svelte-kit/begin/entry.js'],
				outfile: join('.begin', 'sveltekit-render', 'index.js'),
				bundle: true,
				inject: [join(files, 'shims.js')],
				platform: 'node'
			};

			const buildOptions =
				options && options.esbuild ? await options.esbuild(defaultOptions) : defaultOptions;

			await esbuild.build(buildOptions);

			const static_directory = resolve('.begin','public');

			builder.log.minor('Writing client application...');
			builder.writeStatic(static_directory);
			builder.writeClient(static_directory);


			builder.log.minor('Prerendering static pages...');
			await builder.prerender({
				dest: static_directory
			});
		}
	};

	return adapter;
}
