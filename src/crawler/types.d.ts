import type { HttpUrlString } from '@abacus/common';

export interface CrawlContext extends CrawlOptions {
  readonly urlTableName: string;
}

export interface CrawlOptions {
  readonly crawlId: string;
  readonly maxAttemptsPerUrl: number;
  readonly maxConcurrentUrls: number;
  readonly maxUrls: number;
  readonly stateMachineUrlThreshold: number;
  readonly targetOrigin: HttpUrlString;
}

export type StepName =
  | 'beginCrawl'
  | 'enqueueUrls'
  | 'getProductGroup'
  | 'nextExecution'
  | 'stopCrawl';

export interface HistoryEntry extends CrawlContext {
  batchUrlCount: number;
  endTimestamp?: number;
  startTimestamp: number;
  urlCount: number;
}
