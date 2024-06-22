import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { CrawlerStack } from '../src/crawler/crawlerStack';

describe('CrawlerStack', () => {
  it('should synthesize correctly', () => {
    const app = new App();

    // Create the CrawlerStack.
    const crawlerStack = new CrawlerStack(app, 'TestCrawlerStack');

    // Prepare the stack for assertions.
    const template = Template.fromStack(crawlerStack);

    // Assert it creates the functions with the correct properties...
    template.resourceCountIs('AWS::Lambda::Function', 5);

    for (const step of ['beginCrawl', 'enqueueUrls', 'getProductGroup', 'nextExecution', 'stopCrawl']) {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Handler: `index.${step}`,
        Runtime: Runtime.NODEJS_20_X.name,
      });
    }
  });
});
