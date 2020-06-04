const cdk = require("@aws-cdk/core");
const dynamoDB = require("@aws-cdk/aws-dynamodb");
const lambda = require("@aws-cdk/aws-lambda");
const cognito = require("@aws-cdk/aws-cognito");
const iam = require("@aws-cdk/aws-iam");
const apigateway = require("@aws-cdk/aws-apigateway");
const AttributeType = dynamoDB.AttributeType;
const duration = cdk.Duration;
class AdminStack extends cdk.Stack {
  /**
   * @param {cdk.App} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    //Cognito
    new cognito.UserPool(this, "TROUVER_ADMIN_USER_POOL", {
      userPoolName: "TROUVER_ADMIN_USER_POOL",
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
        phone: false
      },
      signInAliases: {
        email: true
      },
      requiredAttributes: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireSymbols: true
      },
      userInvitation: {
        emailBody: " {username} , Your verification code is {####}. ",
        emailSubject: "Your verification code"
      },
      mfaSecondFactor: {
        sms: false,
        otp: false
      }
    });

    //DynamoDB
    const dynamoDBTable = new dynamoDB.Table(this, "admin-service", {
      tableName: "admin-service",
      partitionKey: {
        name: "email",
        type: AttributeType.STRING
      },
      readCapacity: 1,
      writeCapacity: 1
    });
    const sessionTable = new dynamoDB.Table(this, "admin-service-sessions", {
      //Admin Session table
      tableName: "admin-service-sessions",
      partitionKey: {
        name: "sessionId",
        type: AttributeType.STRING
      },
      readCapacity: 1,
      writeCapacity: 1
    });

    // const statement = new iam.PolicyStatement();
    // statement.addActions("dynamodb:*");
    // statement.addResources("*");

    const role = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
    });

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:*"],
        resources: [
          dynamoDBTable.tableArn,
          sessionTable.tableArn,
          new cdk.CfnParameter(
            this,
            "ConnectionTableARN" //Needs id of the index
          ).value.toString(), //Sessions Table ARN
          new cdk.CfnParameter(
            this,
            "ConnectionTableGSIArn" //Needs id of the index
          ).value.toString()
        ]
      })
    );

    //Lambda
    const lambdaFunction = new lambda.Function(this, "admin-service-function", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      description: "Lambda function for admin backend service.",
      functionName: "admin-service-function",
      code: lambda.Code.inline(
        `exports.handler = function(event, context, callback) { return callback(null, "hello world"); }`
      ),
      timeout: duration.seconds(30),
      role
    });
    //lambdaFunction.addToRolePolicy(statement);
    const api = new apigateway.LambdaRestApi(this, "TrouverDevAPI", {
      handler: lambdaFunction,
      proxy: false
    });
    const items = api.root.addResource("admin");
    items.addMethod("GET"); // GET /items
  }
}

module.exports = { AdminStack };
