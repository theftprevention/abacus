import type { Construct } from 'constructs';
import { LayerVersion, Code } from 'aws-cdk-lib/aws-lambda';

export class JsdomLambdaLayer extends LayerVersion {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      code: Code.fromAsset('bin/layers/jsdom'),
    });
  }
}
