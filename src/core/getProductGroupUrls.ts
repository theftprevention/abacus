import type { HttpUrlString } from './types';

import { request as initRequest } from 'node:https';
import { HttpResponseError } from './classes/httpResponseError';
import { toHttpUrlStringOrNull } from './helpers/toHttpUrlStringOrNull';
import { toStringOrNull } from './helpers/toStringOrNull';

const searchPayloadDefaults = Object.freeze({
  searchHub: 'ProductsSearchHub',
  locale: 'en',
  maximumAge: 900000,
  numberOfResults: 800,
  excerptLength: 0,
  enableDidYouMean: false,
  sortCriteria: '@productz32xlabelz32xname ascending',
  queryFunctions: [],
  rankingFunctions: [],
  facetOptions: {},
  categoryFacets: [],
  retrieveFirstSentences: false,
  timezone: 'America / New_York',
  enableQuerySyntax: false,
  enableDuplicateFiltering: false,
  enableCollaborativeRating: false,
  debug: false,
  allowQueriesWithoutKeywords: true,
});

function getPageNumber(firstResult: number, totalCount: number | null): string {
  const resultsPerPage = searchPayloadDefaults.numberOfResults;
  const pageNumber = Math.floor(firstResult / resultsPerPage) + 1;
  const totalPages = totalCount == null ? null : (Math.ceil(totalCount / resultsPerPage) || 1);
  return `${pageNumber}${totalPages ? ` of ${totalPages}` : ''}`;
}

const jsonContentTypePattern = /^application\/json\b/i;

export async function getProductGroupUrls(
  origin: HttpUrlString
): Promise<HttpUrlString[]> {
  const searchEndpointUrl = new URL('coveo/rest/search/v2', origin);
  const { searchParams } = searchEndpointUrl;
  searchParams.set('sitecoreItemUri', 'sitecore://web/{C5781676-5EFD-4D25-8A54-723F2AC24ADC}?lang=en&amp;ver=80');
  searchParams.set('siteName', 'website');

  const searchEndpoint = searchEndpointUrl.href;
  const urls = new Set<HttpUrlString>();

  // Fetch list of products
  let firstResult = 0;
  let totalCount: number | null = null;
  do {
    console.log(`Fetching page ${getPageNumber(firstResult, totalCount)} of product URLs...`);
    const data = await new Promise<SearchResponseData>((resolve, reject) => {
      const payload = JSON.stringify({
        ...searchPayloadDefaults,
        firstResult,
      });
      const request = initRequest(
        searchEndpoint,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload, 'utf8'),
          },
        },
        (response) => {
          let body = '';
          response.setEncoding('utf8');
          response.on('data', (chunk) => body += chunk);
          response.on('end', () => {
            const { statusCode } = response;
            if (statusCode !== 200) {
              return reject(
                new HttpResponseError(
                  statusCode,
                  `Search request ${getPageNumber(firstResult, totalCount)} failed with status code ${statusCode}.`
                )
              );
            }
            const type = toStringOrNull(response.headers['content-type']);
            if (!type || !jsonContentTypePattern.test(type)) {
              return reject(
                new Error(
                  `Search request ${
                    getPageNumber(firstResult, totalCount)
                  } received a response with content type "${type}".`
                )
              );
            }
            try {
              const data: SearchResponseData = JSON.parse(body);
              if (
                data &&
                typeof data === 'object' &&
                Array.isArray(data.results) &&
                Number.isSafeInteger(data.totalCount)
              ) {
                resolve(data);
              } else {
                reject(
                  new Error(
                    `Search request ${
                      getPageNumber(firstResult, totalCount)
                    } received a response object that did not match the expected format.`
                  )
                );
              }
            } catch (error) {
              reject(error);
            }
          });
        }
      );
      request.on('error', reject);
      request.write(payload);
      request.end();
    });

    // Create product groups from result set
    const { results } = data;
    let url: HttpUrlString | null;
    for (const result of results) {
      url = toHttpUrlStringOrNull(result?.raw?.clickableuri);
      if (url) {
        urls.add(url);
      }
    }
    firstResult += results.length;
    totalCount = data.totalCount;
  } while (firstResult < totalCount);

  return Array.from(urls);
}

interface SearchResponseData {
  results: SearchResult[];
  totalCount: number;
}

interface SearchResult {
  raw: { clickableuri?: unknown };
}
