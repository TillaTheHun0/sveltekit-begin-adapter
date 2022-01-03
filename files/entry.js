import { __fetch_polyfill } from '@sveltejs/kit/install-fetch';

import url from 'url';
import arc from '@architect/functions'

// TODO: should this use builder.getServerDirectory()?
import { App } from '../output/server/app.js';
import { manifest } from '../output/server/manifest.js';

__fetch_polyfill()

const app = new App(manifest);

const checkStatic = arc.http.proxy({passthru:true})

export const handler = arc.http.async(checkStatic,svelteHandler)

export async function svelteHandler(event) {
	const { host, rawPath: path, httpMethod, cookies, rawQueryString, headers, body } = event;

	// Shim for sveltekit's respond requiring content-type to be present 
	contentTypeHeader = Object.keys(headers).find(key => key.toLowerCase() === 'content-type')
	if (!contentTypeHeader) {
		switch (httpMethod.toLowerCase()) {
			case ('get'):
				headers['content-type'] = 'text/html; charset=UTF-8';
				break;
			default:
				headers['content-type'] = 'application/json'
		}
	}
	
	const query = new url.URLSearchParams(rawQueryString);

	const rendered = await app.render({
		host,
		method: httpMethod,
		headers: {
			...(cookies ?  { cookie: cookies.join(';') } : {}),
			...headers
		},
		path,
		rawBody: body,
		query
	});

	if (rendered) {
		return {
			isBase64Encoded: false,
			statusCode: rendered.status,
			headers: rendered.headers,
			body: rendered.body
		};
	}

	return {
		statusCode: 404,
		body: 'Not Found'
	};
}


