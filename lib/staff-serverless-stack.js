const cdk = require("@aws-cdk/core");
const dynamoDB = require("@aws-cdk/aws-dynamodb");
const lambda = require("@aws-cdk/aws-lambda");
const cognito = require("@aws-cdk/aws-cognito");
const iam = require("@aws-cdk/aws-iam");
const apigateway = require("@aws-cdk/aws-apigateway");
const AttributeType = dynamoDB.AttributeType;
const duration = cdk.Duration;

class StaffServiceStack extends cdk.Stack {
  /**
   * @param {cdk.App} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    //Cognito
    new cognito.UserPool(this, "TROUVER_STAFF_USER_POOL", {
      userPoolName: "TROUVER_STAFF_USER_POOL",
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
    const staffIdentityServiceTable = new dynamoDB.Table(
      this,
      "staff-identity-service",
      {
        tableName: "staff-identity-service",
        partitionKey: {
          name: "email",
          type: AttributeType.STRING
        },
        readCapacity: 1,
        writeCapacity: 1
      }
    );

    const sessionTable = new dynamoDB.Table(this, "staff-service-sessions", {
      //Staff Session table
      tableName: "staff-service-sessions",
      partitionKey: {
        name: "sessionId",
        type: AttributeType.STRING
      },
      readCapacity: 1,
      writeCapacity: 1
    });

    const role = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
    });

    role.addToPolicy(
      //Required dynamoDB tables
      new iam.PolicyStatement({
        actions: ["dynamodb:*"],
        resources: [staffIdentityServiceTable.tableArn, sessionTable.tableArn]
      })
    );

    //Lambda
    const lambdaFunction = new lambda.Function(
      this,
      "staff-identity-service-function",
      {
        runtime: lambda.Runtime.NODEJS_12_X,
        handler: "index.handler",
        description: "Lambda function for Staff backend service.",
        functionName: "staff-identity-service-function",
        code: lambda.Code.inline(
          `exports.handler = function(event, context, callback) { return callback(null, "hello world"); }`
        ),
        timeout: duration.seconds(30),
        role
      }
    );
    //lambdaFunction.addToRolePolicy(statement);
    const api = new apigateway.LambdaRestApi(this, "TrouverDevAPI", {
      handler: lambdaFunction,
      proxy: false
    });
    const items = api.root.addResource("staff");
    items.addMethod("GET"); // GET /items
  }
}

module.exports = { StaffServiceStack };
