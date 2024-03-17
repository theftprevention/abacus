import { toNonNegativeIntegerOrNull } from './toNonNegativeIntegerOrNull';
import { toStringOrNull } from './toStringOrNull';

export class HttpResponseError extends Error {
  constructor(statusCode: number | string | null | undefined, message?: string | null);
  constructor(statusCodeArg: unknown, message?: string | null) {
    const statusCode = toHttpStatusCode(statusCodeArg);
    if (!(message = toStringOrNull(message))) {
      message = 'Request failed';
      if (statusCode) {
        message += ` with status code ${statusCode}`
        const statusCodeDescription = statusCodeDescriptions.get(statusCode);
        if (statusCodeDescription) {
          message += ` (${statusCodeDescription})`;
        }
      }
    }
    super(message);
    if (statusCode) {
      this.#statusCode = statusCode;
    }
  }

  #statusCode: HttpResponseStatusCode | null = null;
  get statusCode(): HttpResponseStatusCode | null {
    return this.#statusCode;
  }
  set statusCode(value: unknown) {
    this.#statusCode = toHttpStatusCode(value);
  }
}

function toHttpStatusCode(value: unknown): HttpResponseStatusCode | null {
  const code = toNonNegativeIntegerOrNull(value);
  return code != null && code >= 100 && code <= 599 ? code as HttpResponseStatusCode : null;
}

const statusCodeDescriptions = new Map<HttpResponseStatusCode, string>([
  [100, 'Continue'],
  [101, 'Switching Protocols'],
  [102, 'Processing'],
  [103, 'Early Hints'],
  [200, 'OK'],
  [201, 'Created'],
  [202, 'Accepted'],
  [203, 'Non-Authoritative Information'],
  [204, 'No Content'],
  [205, 'Reset Content'],
  [206, 'Partial Content'],
  [207, 'Multi-Status'],
  [208, 'Already Reported'],
  [226, 'IM Used'],
  [300, 'Multiple Choices'],
  [301, 'Moved Permanently'],
  [302, 'Found'],
  [303, 'See Other'],
  [304, 'Not Modified'],
  [305, 'Use Proxy'],
  [307, 'Temporary Redirect'],
  [308, 'Permanent Redirect'],
  [400, 'Bad Request'],
  [401, 'Unauthorized'],
  [402, 'Payment Required'],
  [403, 'Forbidden'],
  [404, 'Not Found'],
  [405, 'Method Not Allowed'],
  [406, 'Not Acceptable'],
  [407, 'Proxy Authentication Required'],
  [408, 'Request Timeout'],
  [409, 'Conflict'],
  [410, 'Gone'],
  [411, 'Length Required'],
  [412, 'Precondition Failed'],
  [413, 'Payload Too Large'],
  [414, 'URI Too Long'],
  [415, 'Unsupported Media Type'],
  [416, 'Range Not Satisfiable'],
  [417, 'Expectation Failed'],
  [418, 'I\'m a teapot'],
  [421, 'Misdirected Request'],
  [422, 'Unprocessable Content'],
  [423, 'Locked'],
  [424, 'Failed Dependency'],
  [425, 'Too Early'],
  [426, 'Upgrade Required'],
  [428, 'Precondition Required'],
  [429, 'Too Many Requests'],
  [431, 'Request Header Fields Too Large'],
  [451, 'Unavailable For Legal Reasons'],
  [500, 'Internal Server Error'],
  [501, 'Not Implemented'],
  [502, 'Bad Gateway'],
  [503, 'Service Unavailable'],
  [504, 'Gateway Timeout'],
  [505, 'HTTP Version Not Supported'],
  [506, 'Variant Also Negotiates'],
  [507, 'Insufficient Storage'],
  [508, 'Loop Detected'],
  [510, 'Not Extended'],
  [511, 'Network Authentication Required'],
]);

type HttpResponseStatusCode =
  `${1 | 2 | 3 | 4 | 5}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` extends (infer S)
    ? S extends `${infer N extends number}`
      ? N
      : never
    : never;
