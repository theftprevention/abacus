import type { CrawlContext } from '../types';

import { StepFunctions } from 'aws-sdk';
import { sanitizeTimestamp } from '../../core/helpers/sanitizeTimestamp';
import { updateHistoryEntry } from '../lib/historyTable';

const stepFunctionsService = new StepFunctions();

export async function nextExecution(context: CrawlContext): Promise<void> {
  // Reset batch count for next state machine execution
  await updateHistoryEntry(context.crawlId, {
    batchUrlCount: 0,
  });

  // Start a state machine execution to continue the crawl
  await stepFunctionsService.startExecution({
    name: `${context.crawlName}-continued-${sanitizeTimestamp()}`,
    stateMachineArn: context.stateMachineArn,
    input: JSON.stringify({
      Payload: { context },
    }),
  }).promise();
}
