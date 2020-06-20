const cdk = require("@aws-cdk/core");
const dynamoDB = require("@aws-cdk/aws-dynamodb");
const lambda = require("@aws-cdk/aws-lambda");
const iam = require("@aws-cdk/aws-iam");
const AttributeType = dynamoDB.AttributeType;
const duration = cdk.Duration;

class SharedOrderStack extends cdk.Stack {
  /**
   * @param {cdk.App} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    //DynamoDB
    const orderDetailsTable = new dynamoDB.Table(this, "shared-order-details", {
      tableName: "shared-order-details",
      partitionKey: {
        name: "orderId",
        type: AttributeType.STRING
      },
      readCapacity: 1,
      writeCapacity: 1
    });
    const warehouseDetailsTable = new dynamoDB.Table(
      this,
      "shared-order-warehouse-lookup",
      {
        tableName: "shared-order-warehouse-lookup",
        partitionKey: {
          name: "id",
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
        resources: [orderDetailsTable.tableArn, warehouseDetailsTable.tableArn]
      })
    );

    //Lambda
    new lambda.Function(this, "shared-order-service-function", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      description: "Lambda function for handling orders.",
      functionName: "shared-order-service-function",
      code: lambda.Code.inline(
        `exports.handler = function(event, context, callback) { return callback(null, "hello world"); }`
      ),
      timeout: duration.seconds(30),
      role
    });
  }
}

module.exports = { SharedOrderStack };
