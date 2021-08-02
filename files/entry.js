'use strict';

import url from 'url';
import { init, render } from '../output/server/app.js'; // eslint-disable-line import/no-unresolved
import arc from '@architect/functions'

// arg pulled from .svelte-kit/output/app.js
init({ paths: {"base":"","assets":"/."} });

const checkStatic = arc.http.proxy({passthru:true})

export const handler = arc.http.async(checkStatic,svelteHandler)

export async function svelteHandler(event) {
	const { host, rawPath: path, httpMethod, rawQueryString, headers, body } = event;

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

	const rendered = await render({
		host,
		method: httpMethod,
		headers,
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


