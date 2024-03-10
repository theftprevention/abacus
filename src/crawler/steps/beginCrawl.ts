import type { CrawlContext } from '../types';

import { DynamoDB, StepFunctions } from 'aws-sdk';
import { sanitizeTimestamp } from '../../core/helpers/sanitizeTimestamp';
import { getProductGroupUrls } from '../../core/getProductGroupUrls';
import { putHistoryEntry } from '../lib/historyTable';
import { createUrlTable, UrlStatus } from '../lib/urlTable';

const ddbDocumentClient = new DynamoDB.DocumentClient();
const stepFunctionsService = new StepFunctions();

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

  await ddbDocumentClient.batchWrite({
    RequestItems: {
      [urlTableName]: productGroupUrls.map((url) => ({
        PutRequest: {
          Item: {
            url,
            status: UrlStatus.PENDING,
          },
        },
      })),
    },
  }).promise();

  // Start step function execution
  const response = await stepFunctionsService.startExecution({
    name: `${context.crawlName}-${sanitizeTimestamp(startTimestamp)}`,
    stateMachineArn: context.stateMachineArn,
    input: JSON.stringify({
      Payload: { context },
    }),
  }).promise();

  return { stateMachineExecutionArn: response.executionArn };
}
