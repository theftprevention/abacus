import type { CrawlContext } from '../types';

import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { sanitizeTimestamp } from '../../core/helpers/sanitizeTimestamp';
import { getProductGroupUrls } from '../../core/getProductGroupUrls';
import { putHistoryEntry } from '../lib/historyTable';
import { createUrlTable, storeUrls } from '../lib/urlTable';

const sfnClient = new SFNClient();

export async function beginCrawl(context: CrawlContext) {
  const { urlTableName } = context;

  await createUrlTable(urlTableName);

  const startTimestamp = Date.now();

  await putHistoryEntry({
    ...context,
    batchUrlCount: 0,
    startTimestamp,
    urlCount: 0
  });

  const productGroupUrls = await getProductGroupUrls(context.targetOrigin);

  await storeUrls(productGroupUrls, urlTableName);

  // Start step function execution
  const response = await sfnClient.send(new StartExecutionCommand({
    name: `${context.crawlName}-${sanitizeTimestamp(startTimestamp)}`,
    stateMachineArn: context.stateMachineArn,
    input: JSON.stringify({
      Payload: { context },
    }),
  }));

  return { stateMachineExecutionArn: response.executionArn };
}
