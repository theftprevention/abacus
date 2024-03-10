import type { CrawlContext } from '../types';

import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { sanitizeTimestamp } from '../../core/helpers/sanitizeTimestamp';
import { updateHistoryEntry } from '../lib/historyTable';

const sfnClient = new SFNClient();

export async function nextExecution(context: CrawlContext): Promise<void> {
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
