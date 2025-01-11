import { defineBackend } from "@aws-amplify/backend";
import { data, TEXT_MODEL_ID, generatePromptTextResponse, pickHumanResponse, generatePromptDrawingResponse, DRAWING_MODEL_ID } from "./data/resource";
import { auth } from './auth/resource';
import { storage } from './storage/resource';
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

export const backend = defineBackend({
  data,
  generateTextResponse: generatePromptTextResponse,
  generateDrawingResponse: generatePromptDrawingResponse,
  pickHumanResponse: pickHumanResponse,
  auth,
  storage
});


backend.generateTextResponse.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel"],
    resources: [
      `arn:aws:bedrock:eu-west-2::foundation-model/${TEXT_MODEL_ID}`,
    ],
  })
);

backend.generateDrawingResponse.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel"],
    resources: [
      `arn:aws:bedrock:eu-west-2::foundation-model/${DRAWING_MODEL_ID}`,
    ],
  })
);

backend.pickHumanResponse.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel"],
    resources: [
      `arn:aws:bedrock:eu-west-2::foundation-model/${TEXT_MODEL_ID}`,
    ],
  })
);