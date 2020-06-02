const cdk = require("@aws-cdk/core");
const iam = require("@aws-cdk/aws-iam");
const lambda = require("@aws-cdk/aws-lambda");
const dynamoDB = require("@aws-cdk/aws-dynamodb");
const apigateway = require("@aws-cdk/aws-apigateway");
const AttributeType = dynamoDB.AttributeType;
const managedPolicy = iam.ManagedPolicy;
const parameterDefinition = cdk.CfnParameter;

const duration = cdk.Duration;
class WebSocketStack extends cdk.Stack {
  /**
   * @param {cdk.App} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    //Role for WebSocket lambda Function
    const role = new iam.Role(this, "LambdaWebSocketExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
    });

    // attach managed policy to role
    const apiGatewayInvokePolicy = managedPolicy.fromAwsManagedPolicyName(
      "AmazonAPIGatewayInvokeFullAccess"
    );
    const lambdaBasicExecutionRole = managedPolicy.fromAwsManagedPolicyName(
      "AWSLambdaBasicExecutionRole"
    );
    role.addManagedPolicy(apiGatewayInvokePolicy);
    role.addManagedPolicy(lambdaBasicExecutionRole);

    const webSocketLambda = new lambda.Function(
      this,
      "admin-service-websocket-function",
      {
        runtime: lambda.Runtime.NODEJS_12_X,
        handler: "index.handler",
        description: "Lambda function to connect with WebSocket API",
        functionName: "admin-service-websocket-function",
        code: lambda.Code.inline(
          `exports.handler = function(event, context, callback) { return callback(null, "hello world"); }`
        ),
        timeout: duration.seconds(30),
        role
      }
    );

    //DynamoDB
    const dynamoDBTable = new dynamoDB.Table(
      this,
      "admin-service-websocket-connections",
      {
        tableName: "admin-service-websocket-connections",
        partitionKey: {
          name: "connectionId",
          type: AttributeType.STRING
        },
        readCapacity: 1,
        writeCapacity: 1
      }
    );
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:*"],
        resources: [
          dynamoDBTable.tableArn, //WebSocket Connection Table
          new cdk.CfnParameter(this, "SessionTableArn").value.toString() //Sessions Table
        ]
      })
    );
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:*"],
        resources: [
          new cdk.CfnParameter(this, "AdminUSerPoolArn").value.toString()
        ]
      })
    );

    const webSocketApi = new apigateway.CfnApiV2(
      this,
      "admin-service-websocket-api",
      {
        name: "AdminServiceWebSockets",
        protocolType: "WEBSOCKET",
        routeSelectionExpression: "$request.body.action"
      }
    );

    // API ROUTES ------------------------------------------------------------------

    // connect route
    const apigatewayroutesocketconnect = new apigateway.CfnRouteV2(
      this,
      "apigatewayroutesocketconnect",
      {
        apiId: webSocketApi.ref,
        routeKey: "$connect",
        authorizationType: "NONE",
        operationName: "ConnectRoute",
        target:
          "integrations/" +
          new apigateway.CfnIntegrationV2(
            this,
            "apigatewayintegrationsocketconnect",
            {
              apiId: webSocketApi.ref,
              integrationType: "AWS_PROXY",
              integrationUri:
                "arn:aws:apigateway:ap-south-1:lambda:path/2015-03-31/functions/" +
                webSocketLambda.functionArn +
                "/invocations"
              //credentialsArn: roleapigatewaysocketapi.roleArn
            }
          ).ref
      }
    );
    // disconnect route
    const apigatewayroutesocketdisconnect = new apigateway.CfnRouteV2(
      this,
      "apigatewayroutesocketdisconnect",
      {
        apiId: webSocketApi.ref,
        routeKey: "$disconnect",
        authorizationType: "NONE",
        operationName: "DisconnectRoute",
        target:
          "integrations/" +
          new apigateway.CfnIntegrationV2(
            this,
            "apigatewayintegrationsocketdisconnect",
            {
              apiId: webSocketApi.ref,
              integrationType: "AWS_PROXY",
              integrationUri:
                "arn:aws:apigateway:ap-south-1:lambda:path/2015-03-31/functions/" +
                webSocketLambda.functionArn +
                "/invocations"
              // credentialsArn: roleapigatewaysocketapi.roleArn
            }
          ).ref
      }
    );

    // message route
    const apigatewayroutesocketdefault = new apigateway.CfnRouteV2(
      this,
      "apigatewayroutesocketdefault",
      {
        apiId: webSocketApi.ref,
        routeKey: "$default",
        authorizationType: "NONE",
        operationName: "SendRoute",
        target:
          "integrations/" +
          new apigateway.CfnIntegrationV2(
            this,
            "apigatewayintegrationsocketdefault",
            {
              apiId: webSocketApi.ref,
              integrationType: "AWS_PROXY",
              integrationUri:
                "arn:aws:apigateway:ap-south-1:lambda:path/2015-03-31/functions/" +
                webSocketLambda.functionArn +
                "/invocations"
              //credentialsArn: roleapigatewaysocketapi.roleArn
            }
          ).ref
      }
    );

    // DEPLOY ------------------------------------------------------------------

    // deployment
    const apigatewaydeploymentsocket = new apigateway.CfnDeploymentV2(
      this,
      "apigatewaydeploymentsocket",
      {
        apiId: webSocketApi.ref
      }
    );

    // all the routes are dependencies of the deployment
    const routes = new cdk.ConcreteDependable();
    routes.add(apigatewayroutesocketconnect);
    routes.add(apigatewayroutesocketdisconnect);
    routes.add(apigatewayroutesocketdefault);

    // Add the dependency
    apigatewaydeploymentsocket.node.addDependency(routes);
  }
}

module.exports = { WebSocketStack };
