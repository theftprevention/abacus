import type { CrawlerSteps } from '../types';

import { Duration } from 'aws-cdk-lib';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Bucket } from "aws-cdk-lib/aws-s3";
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
import { Construct } from 'constructs';
import {
  CONSTRUCT_NAME_PREFIX,
  CRAWLER_STATE_MACHINE_NAME,
  DISTRIBUTED_MAP_CONCURRENCY_LIMIT,
  S3_QUEUED_URLS_KEY,
} from '../../core/constants';

const { booleanEquals } = Condition;

export interface CrawlerStateMachineProps {
  bucket: Bucket;
  stateMachineArn: string;
  steps: CrawlerSteps;
}

/**
 * Construct to create our web crawler state machine
 */
export class CrawlerStateMachine extends Construct {
  constructor(scope: Construct, id: string, props: CrawlerStateMachineProps) {
    super(scope, id);

    const { bucket, steps } = props;

    const invokeEnqueueUrls = new LambdaInvoke(this, 'EnqueueUrls', {
      lambdaFunction: steps.enqueueUrls,
      payload: TaskInput.fromJsonPathAt('$$.Execution.Input'),
    });
    const invokeGetProductGroup = new LambdaInvoke(this, 'GetProductGroup', {
      lambdaFunction: steps.getProductGroup,
    });
    const invokeNextExecution = new LambdaInvoke(this, 'NextExecution', {
      lambdaFunction: steps.nextExecution,
    });
    const invokeStopCrawl = new LambdaInvoke(this, 'StopCrawl', {
      lambdaFunction: steps.stopCrawl,
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
      .itemProcessor(invokeGetProductGroup)
      .addCatch(invokeEnqueueUrls)
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

    const logGroup = new LogGroup(this, 'ExecutionLogs');
    const stateMachine = new StateMachine(this, `${id}-StateMachine`, {
      stateMachineName: CRAWLER_STATE_MACHINE_NAME,
      definitionBody: DefinitionBody.fromChainable(
        // Enqueue URLs from the database
        invokeEnqueueUrls.addCatch(invokeEnqueueUrls).next(
          // Check if we have urls still to visit
          new Choice(this, 'QueueContainsUrls?')
            .when(
              booleanEquals('$.Payload.queueIsNonEmpty', true),
              // Check if we have visited more urls than our threshold for a single state machine execution
              new Choice(this, 'VisitedUrlsExceedsThreshold?')
                .when(
                  booleanEquals('$.Payload.thresholdExceeded', true),
                  // Continue crawling in another state machine execution
                  invokeNextExecution.next(new Succeed(this, 'ContinuingInAnotherExecution'))
                )
                .otherwise(
                  // Crawl every page we read from the queue in parallel
                  distributedMap.next(invokeEnqueueUrls)
                )
            )
            .otherwise(
              // No urls in the queue, so we can complete the crawl
              invokeStopCrawl.next(new Succeed(this, 'Done'))
            )
        )
      ),
      logs: {
        level: LogLevel.ERROR,
        destination: logGroup
      }
    });

    // Grant the beginCrawl lambda permissions to start an execution of this state machine
    stateMachine.grantStartExecution(steps.beginCrawl);
    // Grant the webcrawler state machine permissions to read and write to the working bucket
    bucket.grantReadWrite(stateMachine.role);

    // manually add permission to execute own state machine, required by Distributed Map state
    // for child executions. 
    stateMachine.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["states:StartExecution", "states:StopExecution", "states:StartSyncExecution"],
      resources: [props.stateMachineArn],
    }));

    // manually add permission to invoke function "getProductGroup" as CustomState is used
    stateMachine.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["lambda:InvokeFunction"],
      resources: [steps.getProductGroup.functionArn],
    }));
    steps.beginCrawl.addEnvironment('CRAWLER_STATE_MACHINE_ARN', stateMachine.stateMachineArn);
  }
}
