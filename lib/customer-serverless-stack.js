const cdk = require("@aws-cdk/core");
const dynamoDB = require("@aws-cdk/aws-dynamodb");
const lambda = require("@aws-cdk/aws-lambda");
const cognito = require("@aws-cdk/aws-cognito");
const iam = require("@aws-cdk/aws-iam");
const apigateway = require("@aws-cdk/aws-apigateway");
const AttributeType = dynamoDB.AttributeType;
const duration = cdk.Duration;
const userPoolOperation = cognito.UserPoolOperation;

class CustomerServiceStack extends cdk.Stack {
  /**
   * @param {cdk.App} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    //Cognito
    new cognito.UserPool(this, "TROUVER_CUSTOMER_USER_POOL", {
      userPoolName: "TROUVER_CUSTOMER_USER_POOL",
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
        emailBody: " {username} , Your verification code is {####}.",
        emailSubject: "Your verification code"
      },
      mfaSecondFactor: {
        sms: false,
        otp: false
      }
    });

    //DynamoDB
    const customerIdentityServiceTable = new dynamoDB.Table(
      this,
      "customer-identity-service",
      {
        tableName: "customer-identity-service",
        partitionKey: {
          name: "email",
          type: AttributeType.STRING
        },
        readCapacity: 1,
        writeCapacity: 1
      }
    );

    const sessionTable = new dynamoDB.Table(this, "customer-service-sessions", {
      //Customer Session table
      tableName: "customer-service-sessions",
      partitionKey: {
        name: "sessionId",
        type: AttributeType.STRING
      },
      readCapacity: 1,
      writeCapacity: 1
    });

    const role = new iam.Role(this, "CustomerLambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
    });

    role.addToPolicy(
      //Required dynamoDB tables
      new iam.PolicyStatement({
        actions: ["dynamodb:*"],
        resources: [
          customerIdentityServiceTable.tableArn,
          sessionTable.tableArn
        ]
      })
    );

    //Lambda
    new lambda.Function(this, "customer-identity-service-function", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      description: "Lambda function for Customer backend service.",
      functionName: "customer-identity-service-function",
      code: lambda.Code.inline(
        `exports.handler = function(event, context, callback) { return callback(null, "hello world"); }`
      ),
      timeout: duration.seconds(30),
      role
    });
  }
}

module.exports = { CustomerServiceStack };
