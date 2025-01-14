# Creative Writing Game with AI Integration

This project is a creative writing game that leverages AI to enhance gameplay, supporting both single-player and multi-player modes.

The game is built using React and AWS Amplify, providing a seamless and interactive experience for users. Players can join lobbies, answer prompts, vote on responses, and compete against AI-generated answers. The application utilizes AWS services for backend functionality, including data storage, authentication, and AI text generation.

## Repository Structure

```
.
├── amplify/
│   ├── auth/
│   │  └── resource.ts
│   ├── data/
│   │  ├── pickHumanResponseHandler.tsx
│   │  ├── promptResponseHandler.tsx
│   │  └── resource.ts
│   ├── storage/
│   │  └── resource.ts
│   ├── backend.ts
│   ├── package.json
│   └── tsconfig.json
├── app/
│   ├── pages/
│   │  ├── AnswerEntryPage.tsx
│   │  ├── AnswerVoteRevealPage.tsx
│   │  ├── GameEnd.tsx
│   │  ├── GameModePage.tsx
│   │  ├── HomePage.tsx
│   │  ├── LobbyCreation.tsx
│   │  ├── MultiPlayerGame.tsx
│   │  ├── SinglePlayerGame.tsx
│   │  ├── VotingPage.tsx
│   │  ├── VotingPageAi.tsx
│   │  └── WaitingRoom.tsx
│   ├── app.css
│   ├── getPrompts.ts
│   ├── layout.tsx
│   ├── model.ts
│   └── page.tsx
├── components/
│   ├── hooks/
│   └── ui/
├── lib/
│   └── utils.ts
├── amplify.yml
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### Game Modes

1. Single Player:
   - Create a lobby
   - Answer prompts
   - Compete against AI-generated responses

2. Multi Player:
   - Create or join a lobby
   - Invite friends using the lobby code
   - Answer prompts and vote on responses
   - Compete against other players and AI

## Data Flow

The application follows this general data flow:

1. User creates or joins a lobby
2. Lobby data is stored in DynamoDB via Amplify DataStore
3. Game rounds are created with prompts fetched from S3
4. Players submit answers, stored as Answer entities
5. In single-player mode, AI generates responses using AWS Bedrock
6. Players vote on answers (multi-player) or AI selects the best answer (single-player)
7. Scores are calculated and updated in real-time
8. Game progresses through rounds until completion

```
[User] <-> [React Frontend] <-> [Amplify DataStore] <-> [DynamoDB]
                                       ^
                                       |
                                [AWS Bedrock API]
                                       ^
                                       |
                                [Lambda Functions]
```

## Infrastructure

The project uses the following AWS resources:

- **Lambda Functions**:
  - `generatePromptResponse`: Generates AI responses to prompts
  - `pickHumanResponse`: Selects the most human-like response

- **DynamoDB Tables** (created by Amplify DataStore):
  - Lobby
  - Participant
  - Prompt
  - Round
  - Answer
  - Vote

- **S3 Buckets**:
  - `gameStorage`: Stores text and image prompts

- **Cognito User Pool**: Handles user authentication

- **AppSync API**: Manages GraphQL operations for the data model

- **IAM Roles and Policies**: Configured for Lambda functions to access Bedrock and other AWS services