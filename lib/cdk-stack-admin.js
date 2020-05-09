const cdk = require("@aws-cdk/core");
const lambda = require("@aws-cdk/aws-lambda");

class CdkStack extends cdk.Stack {
  /**
   * @param {cdk.App} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    //Lambda
    new lambda.Function(this, "admin-service-function", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      description: "Lambda function for admin backend service.",
      functionName: "admin-service-function",
      code: lambda.Code.inline(
        `exports.handler = function(event, context, callback) { return callback(null, "hello world"); }`
      )
    });
  }
}

module.exports = { CdkStack };
