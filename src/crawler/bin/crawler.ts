import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { CONSTRUCT_NAME_PREFIX } from '../constants';
import { CrawlerStack } from '../crawlerStack';

const app = new App();
new CrawlerStack(app, `${CONSTRUCT_NAME_PREFIX}CrawlerStack`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
