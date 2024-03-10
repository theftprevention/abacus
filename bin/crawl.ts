import { CloudFormationClient, ListExportsCommand } from '@aws-sdk/client-cloudformation';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { awsPaginatedRequest } from '../src/core/helpers/awsPaginatedRequest';

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
    const command = new InvokeCommand({
      FunctionName: beginCrawlFunctionArn,
      InvocationType: 'RequestResponse',
    });
    const response = await lambdaClient.send(command);
    const payload = response?.Payload;

    console.log('beginCrawl response', response);

    if (payload) {
      const { stateMachineExecutionArn } = JSON.parse(payload.transformToString());
      const region = stateMachineExecutionArn.split(':')[3];
      const stateMachineConsoleUrl = `https://${region}.console.aws.amazon.com/states/home?region=${region}#/executions/details/${stateMachineExecutionArn}`;
      console.log('---');
      console.log('Started web crawl execution. Track its progress in the console here:');
      console.log(stateMachineConsoleUrl);
    } else {
      console.error("Failed to start the crawl", response);
      process.exit(1);
    }
  } else {
    console.error("Couldn't find export with name BeginCrawlFunctionArn. Have you deployed yet?");
    process.exit(2);
  }
})();
