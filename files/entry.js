'use strict';

import url from 'url';
import { init, render } from '../output/server/app.js'; // eslint-disable-line import/no-unresolved
import arc from '@architect/functions'
import asap from '@architect/asap'

// arg pulled from .svelte-kit/output/app.js
init({ paths: { base: "", assets: "/." } });

export const handler = async function (request, context) {
	// add a rawBody onto the request
	request.rawBody = request.body
	return arc.http.async(asap({ passthru: true }), svelteHandler)(request, context)
}

async function svelteHandler(event) {
	const { host, rawPath: path, httpMethod, cookies, rawQueryString, headers, rawBody } = event;

	// Shim for sveltekit's respond requiring content-type to be present 
	const contentTypeHeader = Object.keys(headers).find(key => key.toLowerCase() === 'content-type')
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
		headers: {
			...(cookies ?  { cookie: cookies.join(';') } : {}),
			...headers
		},
		path,
		rawBody,
		raw: rawBody,
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


