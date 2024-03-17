import type { CrawlContext } from '../types';

import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { sanitizeTimestamp } from '@abacus/common';
import { updateHistoryEntry } from '../lib/historyTable';

const sfnClient = new SFNClient();

/**
 * Responsible for continuing execution via another state machine execution if we're getting too
 * close to the maximum number of steps in our state machine execution.
 */
export async function nextExecution(event: { Payload: { context: CrawlContext } }): Promise<void> {
  const { context } = event.Payload;

  // Reset batch count for next state machine execution
  await updateHistoryEntry(context.crawlId, {
    batchUrlCount: 0,
  });

  // Start a state machine execution to continue the crawl
  await sfnClient.send(new StartExecutionCommand({
    name: `${context.crawlName}-continued-${sanitizeTimestamp()}`,
    stateMachineArn: context.stateMachineArn,
    input: JSON.stringify({
      Payload: { context },
    }),
  }));
}
