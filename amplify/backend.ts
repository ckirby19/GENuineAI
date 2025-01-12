import { defineBackend } from "@aws-amplify/backend";
import { data, generatePromptResponse, pickHumanResponse } from "./data/resource";
import { auth } from './auth/resource';
import { storage } from './storage/resource';
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

export const backend = defineBackend({
  data,
  generateTextResponse: generatePromptResponse,
  pickHumanResponse: pickHumanResponse,
  auth,
  storage
});

backend.generateTextResponse.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel"],
    resources: [
      `arn:aws:bedrock:eu-west-2::foundation-model/mistral.mistral-7b-instruct-v0:2`,
      `arn:aws:bedrock:eu-west-2::foundation-model/amazon.titan-text-express-v1`,
      `arn:aws:bedrock:eu-west-2::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
    ],
  })
);

backend.pickHumanResponse.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel"],
    resources: [
      `arn:aws:bedrock:eu-west-2::foundation-model/mistral.mistral-7b-instruct-v0:2`,
      `arn:aws:bedrock:eu-west-2::foundation-model/amazon.titan-text-express-v1`,
      `arn:aws:bedrock:eu-west-2::foundation-model/anthropic.claude-3-haiku-20240307-v1:0`,
    ],
  })
);