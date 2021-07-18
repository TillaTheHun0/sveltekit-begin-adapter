import { readFileSync, existsSync,writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'
import esbuild from 'esbuild'
const { resolve, join } = path
const __dirname = path.dirname(new URL(import.meta.url).pathname);


export default function () {
	/** @type {import('@sveltejs/kit').Adapter} */
	const adapter = {
		name: '@sveltejs/adapter-begin',

		async adapt({ utils }) {
			
			const files = fileURLToPath(new URL('./files', import.meta.url))
			utils.log.minor('verifying app.arc manifest exists');
			if (!existsSync('app.arc')) {
				utils.log.minor('adding architect manifest app.arc');
				utils.copy(join(files, 'app.arc'), 'app.arc')
			}

			utils.log.minor('bundling server for lambda...');
			utils.copy(join(files, 'entry.js'), '.svelte-kit/begin/entry.js');
			await esbuild.build({
				entryPoints: ['.svelte-kit/begin/entry.js'],
				outfile: join('.begin', 'sveltekit-render', 'index.js'),
				bundle: true,
				platform: 'node'
			})

			
			// writeFileSync(join('.begin', 'render', 'index.js'), `
			// 'use strict';
			// const handler= require('./entry-index.js')
		  // module.exports= handler`)
			// writeFileSync(join('.begin', 'render', 'package.json'), `{"type":"commonjs"}`)

			//const { static: static_mount_point } = parse_arc('app.arc');

			const static_directory = resolve('.begin','public');
			const server_directory = resolve(join('.begin','shared'));

			utils.log.minor('Writing client application...');
			utils.copy_static_files(static_directory);
			utils.copy_client_files(static_directory);


			// utils.log.minor('Writing server application...');
			// utils.copy_server_files(server_directory);
			//writeFileSync(join('.begin','shared','.keep.js'),'//keep this', { flag: 'wx' })

			utils.log.minor('Prerendering static pages...');
			await utils.prerender({
				dest: static_directory
			});
		}
	};

	return adapter;
}
