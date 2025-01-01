import {
  type ClientSchema,
  a,
  defineData,
  defineFunction,
} from "@aws-amplify/backend";

export const TEXT_MODEL_ID = "mistral.mistral-7b-instruct-v0:2"; // meta.llama3-70b-instruct-v1
export const IMAGE_MODEL_ID = "amazon.titan-image-generator-v1" // amazon.titan-image-generator-v2:0

export const generateTextResponse = defineFunction({
  entry: "./handler.ts",
  environment: {
    MODEL_ID: TEXT_MODEL_ID,
  },
  timeoutSeconds: 30,
  memoryMB: 1024
});

const schema = a.schema({
  Lobby: a
    .model({
      code: a.string(),
      hostId: a.string(),
      status: a.enum(['WAITING', 'STARTED', 'COMPLETED']),
      currentRound: a.integer().default(0),
      participants: a.hasMany('Participant', 'lobbyId'),
      rounds: a.hasMany('Round', 'lobbyId')
    })
    .authorization((allow) => [allow.publicApiKey()]),
  Participant: a
    .model({
      userId: a.string(),
      username: a.string(),
      lobbyId: a.id(),
      isHost: a.boolean().default(false),
      isAiParticipant: a.boolean().default(false),
      score: a.integer().default(0),
      lobby: a.belongsTo('Lobby', 'lobbyId'),
      answers: a.hasMany('Answer', 'participantId'),
      votes: a.hasMany('Vote', 'participantId')
    })
    .authorization((allow) => [allow.publicApiKey()]),
  Prompt: a
    .model({
      text: a.string(),
      round: a.hasOne('Round', 'promptId'),
      isActive: a.boolean().default(true)
    })
    .authorization((allow) => [allow.publicApiKey()]),
  Round: a
    .model({
      lobbyId: a.id(),
      promptId: a.id(),
      roundNumber: a.integer(),
      status: a.enum(['ANSWERING', 'VOTING', 'SCORING']),
      lobby: a.belongsTo('Lobby', 'lobbyId'),
      prompt: a.belongsTo('Prompt', 'promptId'), //This relationship should be reversed
      answers: a.hasMany('Answer', 'roundId'),
      votes: a.hasMany('Vote', 'roundId')
    })
    .authorization((allow) => [allow.publicApiKey()]),
  Answer: a
    .model({
      roundId: a.id(),
      participantId: a.id(),
      isAiAnswer: a.boolean().default(false),
      text: a.string(),
      round: a.belongsTo('Round', 'roundId'),
      participant: a.belongsTo('Participant', 'participantId'),
      votes: a.hasMany('Vote', 'answerId')
    })
    .authorization((allow) => [allow.publicApiKey()]),
  Vote: a
    .model({
      roundId: a.id(),
      participantId: a.id(), 
      answerId: a.id(),
      round: a.belongsTo('Round', 'roundId'),
      participant: a.belongsTo('Participant', 'participantId'), // The Id of the person who voted
      answer: a.belongsTo('Answer', 'answerId') // The Id of the answer
    })
    .authorization((allow) => [allow.publicApiKey()]),
  GenerateTextResponse: a
    .query()
    .arguments({ prompt: a.string().required() })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(generateTextResponse)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

// "use client"
// import { Amplify } from "aws-amplify";
// import outputs from "../../amplify_outputs.json";
// import { generateClient } from "aws-amplify/data";

// Amplify.configure(outputs);

// const client = generateClient<Schema>() // use this Data client for CRUDL requests

// const samplePrompts = [
//   "Never bring a _____ to a pillow fight",
//   "The secret ingredient in grandma's cookies is _____",
//   "The worst thing to say during a job interview is _____",
//   "I knew it was true love when they _____",
//   "The most useless superpower would be _____",
//   "If I were president, my first action would be to _____",
//   "The best way to survive a zombie apocalypse is to _____",
//   "The next big trend in fashion will be _____",
//   "My autobiography would be titled _____",
//   "The worst piece of advice I've ever received was _____",
//   "If aliens visited Earth, the first thing they'd do is _____",
//   "The most surprising thing you'd find in a time capsule from 2024 would be _____",
//   "The real reason dinosaurs went extinct is _____",
//   "The next Olympic sport should be _____",
//   "If dogs could talk, the first thing they'd say is _____"
// ];

// samplePrompts.forEach(async (prompt) => {
//   await client.models.Prompt.create({
//     text: prompt,
//   })
// })