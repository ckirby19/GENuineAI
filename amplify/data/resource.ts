import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { ROUND_STATUSES, LOBBY_STATUSES } from "../../app/model";
/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Lobby: a
    .model({
      code: a.string(),
      hostId: a.string(),
      status: a.enum(Object.values(LOBBY_STATUSES)),
      currentRound: a.integer().default(0),
      participants: a.hasMany('Participant', 'lobbyId'),
      rounds: a.hasMany('Round', 'lobbyId')
    })
    .authorization((allow) => [allow.publicApiKey()]),
  Participant: a
    .model({
      userId: a.string(),
      username: a.string(),
      lobbyId: a.string(),
      lobby: a.belongsTo('Lobby', 'lobbyId'),
      isHost: a.boolean(),
      score: a.integer().default(0),
      answers: a.hasMany('Answer', 'participantId')
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
      lobbyId: a.string(),
      lobby: a.belongsTo('Lobby', 'lobbyId'),
      promptId: a.string(),
      prompt: a.belongsTo('Prompt', 'promptId'),
      roundNumber: a.integer(),
      status: a.enum(Object.values(ROUND_STATUSES)),
      answers: a.hasMany('Answer', 'roundId')
    })
    .authorization((allow) => [allow.publicApiKey()]),
  Answer: a
    .model({
      roundId: a.string(),
      round: a.belongsTo('Round', 'roundId'),
      participantId: a.string(),
      participant: a.belongsTo('Participant', 'participantId'),
      text: a.string(),
      votes: a.integer().default(0)
    })
    .authorization((allow) => [allow.publicApiKey()]),

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

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
