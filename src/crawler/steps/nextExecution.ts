import type { CrawlContext } from '../types';

import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { env, sanitizeTimestamp } from '@abacus/common';
import { updateHistoryEntry } from '../lib/historyTable';

const CRAWLER_STATE_MACHINE_ARN = env('CRAWLER_STATE_MACHINE_ARN');

const sfnClient = new SFNClient();

/**
 * Responsible for continuing execution via another state machine execution if we're getting too
 * close to the maximum number of steps in our state machine execution.
 */
export async function nextExecution(context: CrawlContext): Promise<void> {
  // Reset batch count for next state machine execution
  await updateHistoryEntry(context.crawlId, {
    batchUrlCount: 0,
  });

  // Start a state machine execution to continue the crawl
  await sfnClient.send(new StartExecutionCommand({
    name: `${context.crawlId}-continued-${sanitizeTimestamp()}`,
    stateMachineArn: CRAWLER_STATE_MACHINE_ARN,
    input: JSON.stringify({
      Payload: { context },
    }),
  }));
}
