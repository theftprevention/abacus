import type { Uint8ArrayBlobAdapter } from '@smithy/util-stream';
import type { CrawlOptions } from '../src/crawler/types';

import { CloudFormationClient, ListExportsCommand } from '@aws-sdk/client-cloudformation';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { Command, InvalidArgumentError, Option } from 'commander';
import { awsPaginatedRequest } from '../src/aws-utils/awsPaginatedRequest';
import { toNonNegativeIntegerOrNull } from '../src/common/toNonNegativeIntegerOrNull';
import {
  DEFAULT_MAX_ATTEMPTS_PER_URL,
  DEFAULT_MAX_CONCURRENT_URLS,
  DEFAULT_STATE_MACHINE_URL_THRESHOLD,
  DISTRIBUTED_MAP_CONCURRENCY_LIMIT,
  VIRGINIA_ABC_ORIGIN,
} from '../src/crawler/bin/crawler';

function optionToNonNegativeInteger(value: string): number {
  const result = toNonNegativeIntegerOrNull(value);
  if (result == null) {
    throw new InvalidArgumentError(`Cannot convert '${value}' to an integer`);
  }
  return result;
}

const options = new Command()
  .addOption(
    new Option(
      '--max-attempts-per-url <count>',
      'Maximum number of fetch attempts allowed for each product group URL'
    )
    .default(DEFAULT_MAX_ATTEMPTS_PER_URL)
    .argParser(optionToNonNegativeInteger)
  )
  .addOption(
    new Option(
      '--max-concurrent-urls <count>',
      'Maximum number of concurrent product group requests'
    )
    .default(DEFAULT_MAX_CONCURRENT_URLS)
    .argParser((value) => {
      const maxConcurrentUrls = optionToNonNegativeInteger(value);
      if (maxConcurrentUrls < DISTRIBUTED_MAP_CONCURRENCY_LIMIT) {
        throw new InvalidArgumentError(
          `The '--max-concurrent-urls' option must be greater than or equal to the DISTRIBUTED_MAP_CONCURRENCY_LIMIT (${DISTRIBUTED_MAP_CONCURRENCY_LIMIT}).`
        );
      }
      return maxConcurrentUrls;
    })
  )
  .addOption(
    new Option('--max-urls <count>', 'Maximum number of product group URLs that will be fetched')
      .default(null, 'no limit')
      .argParser(optionToNonNegativeInteger)
  )
  .option('--name <name>', 'A name to identify this crawl')
  .option('--origin <origin>', 'The origin of the Virginia ABC website', VIRGINIA_ABC_ORIGIN)
  .addOption(
    new Option(
      '--state-machine-url-threshold <count>',
      'Maximum number of fetch attempts allowed per state machine execution'
    )
    .default(DEFAULT_STATE_MACHINE_URL_THRESHOLD)
    .argParser(optionToNonNegativeInteger)
  )
  .parse()
  .opts();

process.env.AWS_SDK_LOAD_CONFIG = 'true';

const lambdaClient = new LambdaClient();

(async () => {
  // List all cloudformation exports
  const cfnExports = await awsPaginatedRequest(
    CloudFormationClient,
    ListExportsCommand,
    null,
    'Exports',
    'NextToken'
  );

  // Find the arn of the lambda function to start a crawl
  const beginCrawlFunctionArn = cfnExports.find((exp) => exp.Name === 'BeginCrawlFunctionArn')?.Value;

  if (beginCrawlFunctionArn) {
    const crawlOptions: Partial<CrawlOptions> = {
      crawlName: options.name,
      maxAttemptsPerUrl: options.maxAttemptsPerUrl,
      maxConcurrentUrls: options.maxConcurrentUrls,
      maxUrls: options.maxUrls,
      stateMachineUrlThreshold: options.stateMachineUrlThreshold,
      targetOrigin: options.origin,
    };
    const command = new InvokeCommand({
      FunctionName: beginCrawlFunctionArn,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(crawlOptions),
    });
    const response = await lambdaClient.send(command);
    let payload: Record<string, unknown> | Uint8ArrayBlobAdapter | undefined = response?.Payload;

    if (payload) {
      payload = JSON.parse(payload.transformToString()) as Record<string, unknown>;
      const stateMachineExecutionArn = String(payload?.stateMachineExecutionArn ?? '');
      const region = stateMachineExecutionArn.split(':')[3];
      if (region && stateMachineExecutionArn) {
        const stateMachineConsoleUrl = `https://${region}.console.aws.amazon.com/states/home?region=${region}#/executions/details/${stateMachineExecutionArn}`;
        console.log('---');
        console.log('Started web crawl execution. Track its progress in the console here:');
        console.log(stateMachineConsoleUrl);
      } else {
        console.error('Failed to start the crawl.');
        console.log('Payload:', payload);
        process.exit(1);
      }
    } else {
      console.error('Failed to start the crawl', response);
      process.exit(1);
    }
  } else {
    console.error('Couldn\'t find export with name BeginCrawlFunctionArn. Have you deployed yet?');
    process.exit(2);
  }
})();
