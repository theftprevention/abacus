import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { CrawlerStack } from '../crawler/lib/crawler-stack';

describe('CrawlerStack', () => {
  test('synthesizes correctly', () => {
    const app = new App();

    // Create the CrawlerStack.
    const crawlerStack = new CrawlerStack(app, 'CrawlerStack');

    // Prepare the stack for assertions.
    const template = Template.fromStack(crawlerStack);

    // Assert it creates the function with the correct properties...
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Architectures: [Architecture.X86_64.name],
      Handler: 'index.main',
      Runtime: Runtime.NODEJS_20_X.name,
    });
  });
});
