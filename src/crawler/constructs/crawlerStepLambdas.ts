import type { Table } from 'aws-cdk-lib/aws-dynamodb';
import type { NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Bucket } from 'aws-cdk-lib/aws-s3';
import type { UrlString } from '../../core/types';
import type { CrawlerSteps, HandlerName } from '../types';

import { Construct } from 'constructs';
import { CfnOutput } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { MAX_CONCURRENT_URLS, STATE_MACHINE_URL_THRESHOLD } from '../../core/constants';
import { CrawlerLambda } from './crawlerLambda';
import { JsdomLambdaLayer } from './jsdomLambdaLayer';

export interface CrawlerStepLambdasProps {
  bucket: Bucket;
  crawlerStateMachineArn: string;
  createUrlTablePolicy: (actions: string[]) => PolicyStatement;
  historyTable: Table;
  productTable: Table;
  region: string;
  s3QueuedUrlsKey: string;
  targetOrigin: URL | UrlString;
  urlTableNamePrefix: string;
}

export class CrawlerStepLambdas extends Construct {
  constructor(scope: Construct, id: string, props: CrawlerStepLambdasProps) {
    super(scope, id);

    const { bucket, historyTable, productTable } = props;

    // Environment variables given to the lambdas
    const environment = {
      CRAWLER_STATE_MACHINE_ARN: props.crawlerStateMachineArn,
      HISTORY_TABLE_NAME: historyTable.tableName,
      MAX_CONCURRENT_URLS: String(MAX_CONCURRENT_URLS),
      PRODUCT_TABLE_NAME: productTable.tableName,
      S3_BUCKET: bucket.bucketName,
      S3_QUEUED_URLS_KEY: props.s3QueuedUrlsKey,
      STATE_MACHINE_URL_THRESHOLD: String(STATE_MACHINE_URL_THRESHOLD),
      TARGET_ORIGIN: String(props.targetOrigin),
      URL_TABLE_NAME_PREFIX: props.urlTableNamePrefix,
    };

    const jsdomLayer = new JsdomLambdaLayer(this, 'JsdomLayer');

    const lambda = (
      id: string,
      handler: HandlerName,
      props?: Omit<NodejsFunctionProps, 'environment' | 'handler' | 'layers'>
    ) => new CrawlerLambda(this, id, {
      ...props,
      environment,
      handler,
      layers: [jsdomLayer],
      bundling: {
        externalModules: ['@aws-sdk/*', 'jsdom'],
      },
    });

    // Lambda to trigger crawling
    const beginCrawl = lambda('BeginCrawlLambda', 'beginCrawlHandler');
    historyTable.grantReadWriteData(beginCrawl);
    beginCrawl.addToRolePolicy(props.createUrlTablePolicy(['CreateTable', 'DescribeTable', 'PutItem', 'GetItem']));

    // Lambda for reading queued urls from the URL table
    const enqueueUrls = lambda('EnqueueUrlsLambda', 'enqueueUrlsHandler');
    historyTable.grantReadWriteData(enqueueUrls);
    bucket.grantReadWrite(enqueueUrls);
    enqueueUrls.addToRolePolicy(props.createUrlTablePolicy(['Query']));

    // Lambda for crawling a page
    const getProductGroup = lambda('GetProductGroupLambda', 'getProductGroupHandler');
    productTable.grantReadWriteData(getProductGroup);
    getProductGroup.addToRolePolicy(props.createUrlTablePolicy(['PutItem', 'GetItem', 'DeleteItem']));

    // Lambda for cleaning up when crawling has finished
    const stopCrawl = lambda('StopCrawlLambda', 'stopCrawlHandler');
    historyTable.grantReadWriteData(stopCrawl);
    bucket.grantReadWrite(stopCrawl);
    stopCrawl.addToRolePolicy(props.createUrlTablePolicy(['DeleteTable']));

    // When we've reached a certain queue size, we restart the step function execution so as not to breach the
    // execution history limit of 25000 steps
    const nextExecution = lambda('NextExecutionLambda', 'nextExecutionHandler');
    nextExecution.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['states:StartExecution'],
      resources: [props.crawlerStateMachineArn],
    }));
    props.historyTable.grantReadWriteData(nextExecution);

    // Save the start crawl lambda arn as a stack output for our `crawl` script
    new CfnOutput(this, 'BeginCrawlFunctionArn', {
      exportName: 'BeginCrawlFunctionArn',
      value: beginCrawl.functionArn,
    });

    this.steps = {
      beginCrawl,
      enqueueUrls,
      getProductGroup,
      nextExecution,
      stopCrawl,
    };
  }

  readonly steps: CrawlerSteps;
}
