#!/usr/bin/env node
const cdk = require("@aws-cdk/core");
const { CdkStack } = require("../lib/cdk-stack-admin");
const { AdminStack } = require("../lib/admin-serverless-stack");

const app = new cdk.App();
//new CdkStack(app, "CdkStack");
new AdminStack(app, "AdminStack");