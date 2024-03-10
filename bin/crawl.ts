import type { AWSError, Request } from 'aws-sdk';

import { CloudFormation, Lambda } from 'aws-sdk';
import { awsPaginatedRequest } from '../src/core/helpers/awsPaginatedRequest';

process.env.AWS_SDK_LOAD_CONFIG = 'true';

const cloudFormationService = new CloudFormation();
const lambdaService = new Lambda();

(async () => {
  // List all cloudformation exports
  const listExports = cloudFormationService.listExports.bind(cloudFormationService) as {
    (params: CloudFormation.ListExportsInput): Request<CloudFormation.ListExportsOutput, AWSError>;
  };
  const cfnExports = await awsPaginatedRequest(listExports, {}, 'Exports', 'NextToken', 'NextToken');

  // Find the arn of the lambda function to start a crawl
  const beginCrawlFunctionArn = cfnExports.find((exp) => exp.Name === 'BeginCrawlFunctionArn')?.Value;

  if (beginCrawlFunctionArn) {
    const response = await lambdaService.invoke({
      FunctionName: beginCrawlFunctionArn,
      InvocationType: 'RequestResponse',
    }).promise();

    console.log('beginCrawl response', response);

    if (response.Payload) {
      const { stateMachineExecutionArn } = JSON.parse(response.Payload as string);
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
