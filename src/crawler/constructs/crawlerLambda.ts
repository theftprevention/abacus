import type { HandlerName } from '../types';

import { type Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, type NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface CrawlerLambdaProps extends NodejsFunctionProps {
  handler: HandlerName;
}

export class CrawlerLambda extends NodejsFunction {
  constructor(scope: Construct, id: string, props: CrawlerLambdaProps) {
    super(scope, id, {
      entry: './src/crawler/index.ts',
      memorySize: 512,
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.minutes(5),
      ...props,
    });
  }
}
