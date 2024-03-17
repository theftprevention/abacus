import type { HttpUrlString } from '../core/types';
import type * as handlers from './index';

export interface CrawlContext extends Omit<CrawlOptions, 'urlTableNamePrefix'> {
  readonly urlTableName: string;
}

export interface CrawlOptions {
  readonly crawlId: string;
  readonly crawlName: string;
  readonly stateMachineArn: string;
  readonly targetOrigin: HttpUrlString;
  readonly urlTableNamePrefix: string;
}

export type HandlerName = {
  [K in keyof typeof handlers]: (typeof handlers)[K] extends Function ? K : never;
}[keyof typeof handlers];

export type StepName = { [K in HandlerName]: K extends `${infer N}Handler` ? N : K }[HandlerName];

export interface HistoryEntry extends CrawlContext {
  batchUrlCount: number;
  endTimestamp?: number;
  startTimestamp: number;
  stateMachineArn: string;
  urlCount: number;
}
