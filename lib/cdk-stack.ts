import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaRole = new iam.Role(this, 'lambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));

    const table = new dynamodb.Table(this, 'Courses', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
    });

    const getAllItemsFunction = new lambda.Function(this, 'get-all-items', {
      runtime: lambda.Runtime.NODEJS_12_X,    
      code: lambda.Code.fromAsset('lambda'),  
      handler: 'get-all-items.getAllItemsHandler',
      environment: {
        SAMPLE_TABLE: table.tableName
      },
      role: lambdaRole
    });

    const getByIdFunction = new lambda.Function(this, 'get-by-id', {
      runtime: lambda.Runtime.NODEJS_12_X,    
      code: lambda.Code.fromAsset('lambda'),  
      handler: 'get-by-id.getByIdHandler',
      environment: {
        SAMPLE_TABLE: table.tableName
      },
      role: lambdaRole
    });

    const putItemFunction = new lambda.Function(this, 'put-item', {
      runtime: lambda.Runtime.NODEJS_12_X,    
      code: lambda.Code.fromAsset('lambda'),  
      handler: 'put-item.putItemHandler',
      environment: {
        SAMPLE_TABLE: table.tableName
      },
      role: lambdaRole
    });

    const api = new apigw.RestApi(this, 'Lambda-CRUD');
    
    const getAllItemsIntegration = new apigw.LambdaIntegration(getAllItemsFunction);
    api.root.addMethod('GET', getAllItemsIntegration);

    const putItemIntegration = new apigw.LambdaIntegration(putItemFunction);
    
    api.root.addMethod('POST', putItemIntegration);

    const idResource = api.root.addResource('{id}');
    const getByIdIntegration = new apigw.LambdaIntegration(getByIdFunction);
    idResource.addMethod('GET', getByIdIntegration);
  }
}
