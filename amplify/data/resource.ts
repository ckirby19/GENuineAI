import {
  type ClientSchema,
  a,
  defineData,
  defineFunction,
} from "@aws-amplify/backend";

export const TEXT_MODEL_ID = "mistral.mistral-7b-instruct-v0:2";
export const DRAWING_MODEL_ID = "stability.stable-diffusion-xl-v1";

export const generatePromptTextResponse = defineFunction({
  entry: "./promptTextResponseHandler.ts",
  environment: {
    MODEL_ID: TEXT_MODEL_ID,
  },
  timeoutSeconds: 30,
  memoryMB: 1024
});

export const generatePromptDrawingResponse = defineFunction({
  entry: "./promptDrawingResponseHandler.ts",
  environment: {
    MODEL_ID: DRAWING_MODEL_ID,
  },
  timeoutSeconds: 60,
  memoryMB: 1024
});

export const pickHumanResponse = defineFunction({
  entry: "./pickHumanReponseHandler.ts",
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
      gameType: a.enum(['SINGLE_PLAYER', 'MULTIPLAYER']),
      gameAnswerType: a.enum(['TEXT', 'DRAWING']),
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
      drawing: a.string(), // SVG string
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
    .handler(a.handler.function(generatePromptTextResponse)),
  GenerateDrawingResponse: a
    .query()
    .arguments({ prompt: a.string().required() })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(generatePromptDrawingResponse)),
  PickHumanResponse: a
    .query()
    .arguments({ prompt: a.string().required() })
    .returns(a.string())
    .authorization((allow) => [allow.publicApiKey()])
    .handler(a.handler.function(pickHumanResponse)),
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