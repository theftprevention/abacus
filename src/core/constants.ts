export const CONSTRUCT_NAME_PREFIX = 'Abacus';
export const CRAWLER_STATE_MACHINE_NAME = 'abacus-crawler-state-machine';

/**
 * The default concurrency limit for the Distributed Map state's child executions
 * 
 * Distributed Map state can support up to 10,000 concurrent executions but we need to consider the default Lambda 
 * concurrency limit of 1,000 per AWS region. To increase the concurrency limit for child executions, you can request
 * a quota increase for the Lambda concurrency limit and then update the concurrency limit for the child executions of
 * the Distributed Map state accordingly. You may also need to use provisioned concurrency for the Lambda function "CrawlPageAndQ"
 * to deal with the initial burst of concurrency.
 */
export const DISTRIBUTED_MAP_CONCURRENCY_LIMIT = 5;

export const MAX_ATTEMPTS_PER_URL = 3;

/**
 * The default number of urls to sync in parallel.
 * 
 * Note that this value must be the same or bigger than the `DISTRIBUTED_MAP_CONCURRENCY_LIMIT`.
 */
export const MAX_CONCURRENT_URLS = 5;

export const S3_QUEUED_URLS_KEY = 'temp-crawler-urls/queuedUrls.json';

/**
 * The default number of urls to visit within a single state machine execution.
 *
 * There's a limit of 25,000 step function history events, so for large crawls we must split the work across multiple
 * executions. When the number of visited urls for an execution is greater than this, we launch a new step function
 * execution to continue crawling the website.
 */
export const STATE_MACHINE_URL_THRESHOLD = 10000;

export const URL_TABLE_NAME_PREFIX = 'crawler-urls';

export const VIRGINIA_ABC_HOST = 'www.abc.virginia.gov';
export const VIRGINIA_ABC_ORIGIN = `https://${VIRGINIA_ABC_HOST}`;
