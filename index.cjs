'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var path = require('path');
var url = require('url');
var esbuild = require('esbuild');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var esbuild__default = /*#__PURE__*/_interopDefaultLegacy(esbuild);

/* eslint-disable no-unused-vars */
const { resolve, join } = path__default["default"];
path__default["default"].dirname(new URL((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.cjs', document.baseURI).href))).pathname);

/**
 * @typedef {import('esbuild').BuildOptions} BuildOptions
 */

/**
 * @param {{
 *   esbuild?: (defaultOptions: BuildOptions) => Promise<BuildOptions> | BuildOptions;
 * }} [options]
 **/
function index (options) {
  /** @type {import('@sveltejs/kit').Adapter} */
  const adapter = {
    name: '@sveltejs/adapter-begin',

    async adapt ({ utils }) {
      const files = url.fileURLToPath(new URL('./files', (typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.cjs', document.baseURI).href))));
      utils.log.minor('verifying app.arc manifest exists');
      if (!fs.existsSync('app.arc')) {
        utils.log.minor('adding architect manifest app.arc');
        utils.copy(join(files, 'app.arc'), 'app.arc');
      }

      utils.log.minor('bundling server for lambda...');
      utils.copy(join(files, 'entry.js'), '.svelte-kit/begin/entry.js');

      /** @type {BuildOptions} */
      const defaultOptions = {
        entryPoints: ['.svelte-kit/begin/entry.js'],
        outfile: join('.begin', 'sveltekit-render', 'index.js'),
        bundle: true,
        inject: [join(files, 'shims.js')],
        platform: 'node'
      };

      const buildOptions = options && options.esbuild
        ? await options.esbuild(defaultOptions)
        : defaultOptions;

      await esbuild__default["default"].build(buildOptions);

      const staticDirectory = resolve('.begin', 'public');

      utils.log.minor('Writing client application...');
      utils.copy_static_files(staticDirectory);
      utils.copy_client_files(staticDirectory);

      utils.log.minor('Prerendering static pages...');
      await utils.prerender({
        dest: staticDirectory
      });
    }
  };

  return adapter
}

exports["default"] = index;
//# sourceMappingURL=index.cjs.map
