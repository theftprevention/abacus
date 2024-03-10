import type { UrlString } from '../types';

import { get } from 'node:https';
import { JSDOM } from 'jsdom';
import { HttpResponseError } from '../classes/httpResponseError';
import { toStringOrNull } from './toStringOrNull';

const htmlContentTypePattern = /^text\/html\b/i;

export function loadHtmlDocument(url: URL | UrlString): Promise<Document> {
  return new Promise<Document>((resolve, reject) => {
    const request = get(url, (response) => {
      const { statusCode } = response;
      if (statusCode !== 200) {
        return reject(new HttpResponseError(statusCode, response.statusMessage));
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => body += chunk);
      response.on('end', () => {
        const type = toStringOrNull(response.headers['content-type']);
        if (!type || !htmlContentTypePattern.test(type)) {
          return reject(new Error(`Response uses an unexpected Content-Type: ${type}`));
        }
        try {
          resolve(new JSDOM(body).window.document);
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on('error', reject);
    request.end();
  });
}
