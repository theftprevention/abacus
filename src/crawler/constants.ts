/**
 * A prefix that is appended to the name of every construct.
 */
export const CONSTRUCT_NAME_PREFIX = 'Abacus';

/**
 * The name of the state machine.
 */
export const CRAWLER_STATE_MACHINE_NAME = 'abacus-crawler-state-machine';

/**
 * The maximum number of times that an attempt can be made to load the product group at a given URL.
 */
export const DEFAULT_MAX_ATTEMPTS_PER_URL = 3;

/**
 * The default number of urls to sync in parallel.
 * 
 * Note that this value must be greater than or equal to `DISTRIBUTED_MAP_CONCURRENCY_LIMIT`.
 */
export const DEFAULT_MAX_CONCURRENT_URLS = 10;

/**
 * The default maximum number of URLs to visit within a single state machine execution.
 *
 * There's a limit of 25,000 step function history events, so for large crawls we must split the
 * work across multiple executions. When the number of visited urls for an execution is greater than
 * this, we launch a new step function execution to continue crawling the website.
 */
export const DEFAULT_STATE_MACHINE_URL_THRESHOLD = 10000;

/**
 * The default concurrency limit for the Distributed Map state's child executions
 * 
 * Distributed Map state can support up to 10,000 concurrent executions but we need to consider the
 * default Lambda concurrency limit of 1,000 per AWS region. To increase the concurrency limit for
 * child executions, you can request a quota increase for the Lambda concurrency limit and then
 * update the concurrency limit for the child executions of the Distributed Map state accordingly.
 */
export const DISTRIBUTED_MAP_CONCURRENCY_LIMIT = 10;

/**
 * The key of the file within the S3 bucket in which the enqueued URLs are stored.
 */
export const S3_QUEUED_URLS_KEY = 'temp-crawler-urls/queuedUrls.json';

/**
 * The prefix that is prepended to the name of the URL table.
 */
export const URL_TABLE_NAME_PREFIX = 'crawler-urls';

/**
 * The origin of the Virginia ABC website.
 */
export const VIRGINIA_ABC_ORIGIN = 'https://www.abc.virginia.gov';
