# sveltekit-begin-adapter

Adapter for Svelte apps that creates a [Begin](https://begin.com/) app, using a function for dynamic server rendering.

## Configuration

run `npm install @ryanbethel/sveltekit-begin-adapter --save-dev`.

Then add the adapter to your `svelte.config.js`:

```js
import begin from '@ryanbethel/sveltekit-begin-adapter';

export default {
	kit: {
		...
		adapter: begin()
	}
};
```

