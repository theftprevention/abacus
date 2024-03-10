import { ArnFormat, Stack, type StackProps } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { type Construct } from 'constructs';
import {
  CONSTRUCT_NAME_PREFIX,
  CRAWLER_STATE_MACHINE_NAME,
  S3_QUEUED_URLS_KEY,
  URL_TABLE_NAME_PREFIX,
  VIRGINIA_ABC_ORIGIN,
} from '../../core/constants';
import { CrawlerStateMachine } from './crawlerStateMachine';
import { CrawlerStepLambdas } from './crawlerStepLambdas';

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
    const crawlerStateMachineArn = this.formatArn({
      service: 'states',
      resource: 'stateMachine',
      resourceName: CRAWLER_STATE_MACHINE_NAME,
      arnFormat: ArnFormat.COLON_RESOURCE_NAME,
    });

    // Create all the lambdas for our webcrawler
    const { steps } = new CrawlerStepLambdas(
      this,
      `${CONSTRUCT_NAME_PREFIX}CrawlerStepLambdas`,
      {
        bucket,
        crawlerStateMachineArn,
        createUrlTablePolicy,
        historyTable,
        productTable,
        region: this.region,
        s3QueuedUrlsKey: S3_QUEUED_URLS_KEY,
        targetOrigin: VIRGINIA_ABC_ORIGIN,
        urlTableNamePrefix: URL_TABLE_NAME_PREFIX,
      }
    );

    // Create the state machine
    new CrawlerStateMachine(
      this,
      `${CONSTRUCT_NAME_PREFIX}CrawlerStateMachine`,
      {
        bucket,
        stateMachineArn: crawlerStateMachineArn,
        steps,
      }
    );
  }
}
