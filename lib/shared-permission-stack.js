const cdk = require("@aws-cdk/core");
const dynamoDB = require("@aws-cdk/aws-dynamodb");
const lambda = require("@aws-cdk/aws-lambda");
const cognito = require("@aws-cdk/aws-cognito");
const iam = require("@aws-cdk/aws-iam");
const apigateway = require("@aws-cdk/aws-apigateway");
const AttributeType = dynamoDB.AttributeType;
const duration = cdk.Duration;

class sharedPermissionStack extends cdk.Stack {
  /**
   * @param {cdk.App} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    //DynamoDB
    const permissionSetsLookup = new dynamoDB.Table(
      this,
      "shared-permission-set-lookup",
      {
        tableName: "shared-permission-set-lookup",
        partitionKey: {
          name: "id",
          type: AttributeType.STRING
        },
        readCapacity: 1,
        writeCapacity: 1
      }
    );
    const permissionAssociationTable = new dynamoDB.Table(
      this,
      "shared-permission-association",
      {
        tableName: "shared-permission-association",
        partitionKey: {
          name: "sub",
          type: AttributeType.STRING
        },
        sortKey: {
          name: "permissionSetId",
          type: AttributeType.STRING
        },
        readCapacity: 1,
        writeCapacity: 1
      }
    );

    const role = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
    });

    role.addToPolicy(
      //Required dynamoDB tables
      new iam.PolicyStatement({
        actions: ["dynamodb:*"],
        resources: [
          permissionAssociationTable.tableArn,
          permissionSetsLookup.tableArn
        ]
      })
    );

    //Lambda
    new lambda.Function(this, "shared-permission-service-function", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      description: "Lambda function for handling permissions for staff.",
      functionName: "shared-permission-service-function",
      code: lambda.Code.inline(
        `exports.handler = function(event, context, callback) { return callback(null, "hello world"); }`
      ),
      timeout: duration.seconds(30),
      role
    });
  }
}

module.exports = { sharedPermissionStack };
