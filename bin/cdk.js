#!/usr/bin/env node
const cdk = require("@aws-cdk/core");
const { CdkStack } = require("../lib/cdk-stack-admin");
const { AdminStack } = require("../lib/admin-serverless-stack");
const { WebSocketStack } = require("../lib/admin-websocket-stack");
const { StaffServiceStack } = require("../lib/staff-serverless-stack");
const { StaffWebSocketStack } = require("../lib/staff-websocket-stack");
const { sharedPermissionStack } = require("../lib/shared-permission-stack");
const { SharedOrderStack } = require("../lib/shared-order-stack");

const app = new cdk.App();
//new CdkStack(app, "CdkStack");
//new AdminStack(app, "AdminStack");
//new WebSocketStack(app, "WebSocketStack");
//new StaffServiceStack(app, "StaffServiceStack");
//new StaffWebSocketStack(app, "StaffWebSocketStack");
//new sharedPermissionStack(app, "sharedPermissionStack");
new SharedOrderStack(app, "SharedOrderStack");
