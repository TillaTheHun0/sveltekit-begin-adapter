import arc from '@architect/functions'
import asap from '@architect/asap'

import { App } from 'APP'
import { manifest } from 'MANIFEST'

const app = new App(manifest)

const checkStatic = asap({ passthru: true })

export const handler = arc.http.async(checkStatic, svelteHandler)

export async function svelteHandler (event) {
  const { rawPath, httpMethod, cookies, rawQueryString, headers, body, isBase64Encoded } = event

  // Shim for sveltekit's respond requiring content-type to be present
  const contentTypeHeader = Object.keys(headers).find(key => key.toLowerCase() === 'content-type')
  if (!contentTypeHeader) {
    switch (httpMethod.toLowerCase()) {
      case ('get'):
        headers['content-type'] = 'text/html; charset=UTF-8'
        break
      default:
        headers['content-type'] = 'application/json'
    }
  }

  const encoding = isBase64Encoded ? 'base64' : headers['content-encoding'] || 'utf-8'
  const rawBody = typeof body === 'string'
    ? Buffer.from(body, encoding)
    : typeof body === 'object'
      ? Buffer.from(JSON.stringify(body), encoding)
      : body

  const rendered = await app.render({
    url: `${rawPath}?${rawQueryString}`,
    method: httpMethod,
    headers: {
      ...(cookies ? { cookie: cookies.join(';') } : {}),
      ...headers
    },
    rawBody
  })

  if (rendered) {
    return {
      isBase64Encoded: false,
      statusCode: rendered.status,
      headers: rendered.headers,
      body: rendered.body
    }
  }

  return {
    statusCode: 404,
    body: 'Not Found'
  }
}
