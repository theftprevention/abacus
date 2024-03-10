import type { StackProps } from 'aws-cdk-lib';
import type { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Construct } from 'constructs';
import type { HandlerName } from '../types';

import { ArnFormat, CfnOutput, Duration, Stack } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import {
  Choice,
  Condition,
  DefinitionBody,
  DistributedMap,
  LogLevel,
  ResultWriter,
  S3JsonItemReader,
  StateMachine,
  Succeed,
  TaskInput,
} from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import {
  CONSTRUCT_NAME_PREFIX,
  CRAWLER_STATE_MACHINE_NAME,
  DISTRIBUTED_MAP_CONCURRENCY_LIMIT,
  MAX_CONCURRENT_URLS,
  S3_QUEUED_URLS_KEY,
  STATE_MACHINE_URL_THRESHOLD,
  URL_TABLE_NAME_PREFIX,
  URL_TABLE_STATUS_INDEX_NAME,
  VIRGINIA_ABC_ORIGIN,
} from '../../core/constants';

export class CrawlerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // S3 bucket to store working files and output from step functions
    const bucket = new Bucket(this, `${CONSTRUCT_NAME_PREFIX}CrawlerBucket`);

    // Dynamodb table to store our web crawl history
    const historyTable = new Table(this, `${CONSTRUCT_NAME_PREFIX}CrawlerHistoryTable`, {
      partitionKey: {
        name: 'crawlId',
        type: AttributeType.STRING,
      },
    });

    // Dynamodb table to store products
    const productTable = new Table(this, `${CONSTRUCT_NAME_PREFIX}CrawlerProductTable`, {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
    });

    // Helper method to create a policy to perform the given actions on any dynamodb context table
    const createUrlTablePolicy = (actions: string[]) => new PolicyStatement({
      effect: Effect.ALLOW,
      actions: actions.map((action) => `dynamodb:${action}`),
      resources: [this.formatArn({
        service: 'dynamodb',
        resource: 'table',
        resourceName: `${URL_TABLE_NAME_PREFIX}*`,
      })],
    });

    // We construct this manually rather than using the output of the CrawlerStateMachine to avoid a circular
    // dependency. The 'nextExecution' lambda needs permissions to start the state machine in which it resides.
    const stateMachineArn = this.formatArn({
      service: 'states',
      resource: 'stateMachine',
      resourceName: CRAWLER_STATE_MACHINE_NAME,
      arnFormat: ArnFormat.COLON_RESOURCE_NAME,
    });

    const jsdomLayer = new LayerVersion(this, 'JsdomLayer', {
      code: Code.fromAsset('bin/layers/jsdom'),
    });

    const uuidLayer = new LayerVersion(this, 'UuidLayer', {
      code: Code.fromAsset('bin/layers/uuid'),
    });

    const lambda = (() => {
      const defaultProps = {
        bundling: {
          externalModules: ['@aws-sdk/*', 'jsdom', 'uuid'],
        },
        entry: './src/crawler/index.ts',
        environment: {
          CRAWLER_STATE_MACHINE_ARN: stateMachineArn,
          HISTORY_TABLE_NAME: historyTable.tableName,
          MAX_CONCURRENT_URLS: String(MAX_CONCURRENT_URLS),
          PRODUCT_TABLE_NAME: productTable.tableName,
          S3_BUCKET: bucket.bucketName,
          S3_QUEUED_URLS_KEY,
          STATE_MACHINE_URL_THRESHOLD: String(STATE_MACHINE_URL_THRESHOLD),
          TARGET_ORIGIN: VIRGINIA_ABC_ORIGIN,
          URL_TABLE_NAME_PREFIX,
          URL_TABLE_STATUS_INDEX_NAME,
        },
        layers: [jsdomLayer, uuidLayer],
        memorySize: 512,
        runtime: Runtime.NODEJS_20_X,
        timeout: Duration.minutes(5),
      } satisfies NodejsFunctionProps;

      return (
        id: string,
        handler: HandlerName,
        props?: Omit<NodejsFunctionProps, 'handler' | (keyof typeof defaultProps)>
      ) => new NodejsFunction(this, id, {
        ...defaultProps,
        handler,
        ...props,
      });
    })();

    // Lambda to trigger crawling
    const beginCrawlLambda = lambda('BeginCrawlLambda', 'beginCrawlHandler');
    historyTable.grantReadWriteData(beginCrawlLambda);
    beginCrawlLambda.addToRolePolicy(createUrlTablePolicy(['CreateTable', 'DescribeTable', 'BatchWriteItem', 'PutItem', 'GetItem']));

    // Lambda for reading queued urls from the URL table
    const enqueueUrlsLambda = lambda('EnqueueUrlsLambda', 'enqueueUrlsHandler');
    historyTable.grantReadWriteData(enqueueUrlsLambda);
    bucket.grantReadWrite(enqueueUrlsLambda);
    enqueueUrlsLambda.addToRolePolicy(createUrlTablePolicy(['Query']));

    // Lambda for crawling a page
    const getProductGroupLambda = lambda('GetProductGroupLambda', 'getProductGroupHandler');
    productTable.grantReadWriteData(getProductGroupLambda);
    getProductGroupLambda.addToRolePolicy(createUrlTablePolicy(['PutItem', 'GetItem', 'DeleteItem']));

    // When we've reached a certain queue size, we restart the step function execution so as not to breach the
    // execution history limit of 25000 steps
    const nextExecutionLambda = lambda('NextExecutionLambda', 'nextExecutionHandler');
    nextExecutionLambda.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['states:StartExecution'],
      resources: [stateMachineArn],
    }));
    historyTable.grantReadWriteData(nextExecutionLambda);

    // Lambda for cleaning up when crawling has finished
    const stopCrawlLambda = lambda('StopCrawlLambda', 'stopCrawlHandler');
    historyTable.grantReadWriteData(stopCrawlLambda);
    bucket.grantReadWrite(stopCrawlLambda);
    stopCrawlLambda.addToRolePolicy(createUrlTablePolicy(['DeleteTable']));

    // Save the start crawl lambda arn as a stack output for our `crawl` script
    new CfnOutput(this, 'BeginCrawlFunctionArn', {
      exportName: 'BeginCrawlFunctionArn',
      value: beginCrawlLambda.functionArn,
    });

    const enqueueUrls = new LambdaInvoke(this, 'EnqueueUrls', {
      lambdaFunction: enqueueUrlsLambda,
      payload: TaskInput.fromJsonPathAt('$$.Execution.Input'),
    });
    const getProductGroup = new LambdaInvoke(this, 'GetProductGroup', {
      lambdaFunction: getProductGroupLambda,
    });
    const nextExecution = new LambdaInvoke(this, 'NextExecution', {
      lambdaFunction: nextExecutionLambda,
    });
    const stopCrawl = new LambdaInvoke(this, 'StopCrawl', {
      lambdaFunction: stopCrawlLambda,
    });

    const distributedMap = new DistributedMap(
        this,
        `${CONSTRUCT_NAME_PREFIX}CrawlerDistributedMap`,
        {
          maxConcurrency: DISTRIBUTED_MAP_CONCURRENCY_LIMIT,
          itemReader: new S3JsonItemReader({
            bucket,
            key: S3_QUEUED_URLS_KEY,
          }),
          resultWriter: new ResultWriter({
            bucket,
            prefix: 'sfn-distmap-outputs/',
          }),
        }
      )
      .itemProcessor(getProductGroup)
      .addCatch(enqueueUrls)
      .addRetry({
        backoffRate: 2,
        interval: Duration.seconds(2),
        maxAttempts: 6,
        errors: [
          'Lambda.ServiceException',
          'Lambda.AWSLambdaException',
          'Lambda.SdkClientException',
        ],
      });

    const { booleanEquals } = Condition;
    const logGroup = new LogGroup(this, 'ExecutionLogs');
    const stateMachine = new StateMachine(this, `${id}-StateMachine`, {
      stateMachineName: CRAWLER_STATE_MACHINE_NAME,
      definitionBody: DefinitionBody.fromChainable(
        // Enqueue URLs from the database
        enqueueUrls.addCatch(enqueueUrls).next(
          // Check if we have urls still to visit
          new Choice(this, 'QueueContainsUrls?')
            .when(
              booleanEquals('$.Payload.queueIsNonEmpty', true),
              // Check if we have visited more urls than our threshold for a single state machine execution
              new Choice(this, 'VisitedUrlsExceedsThreshold?')
                .when(
                  booleanEquals('$.Payload.thresholdExceeded', true),
                  // Continue crawling in another state machine execution
                  nextExecution.next(new Succeed(this, 'ContinuingInAnotherExecution'))
                )
                .otherwise(
                  // Crawl every page we read from the queue in parallel
                  distributedMap.next(enqueueUrls)
                )
            )
            .otherwise(
              // No urls in the queue, so we can complete the crawl
              stopCrawl.next(new Succeed(this, 'Done'))
            )
        )
      ),
      logs: {
        level: LogLevel.ERROR,
        destination: logGroup
      }
    });

    // Grant the beginCrawl lambda permissions to start an execution of this state machine
    stateMachine.grantStartExecution(beginCrawlLambda);
    // Grant the webcrawler state machine permissions to read and write to the working bucket
    bucket.grantReadWrite(stateMachine.role);

    // manually add permission to execute own state machine, required by Distributed Map state
    // for child executions. 
    stateMachine.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["states:StartExecution", "states:StopExecution", "states:StartSyncExecution"],
      resources: [stateMachineArn],
    }));

    // manually add permission to invoke function "getProductGroup" as CustomState is used
    stateMachine.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["lambda:InvokeFunction"],
      resources: [getProductGroupLambda.functionArn],
    }));
  }
}
