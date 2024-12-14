# Chat Application with AWS Services

This is a real-time chat application built using:
- Frontend: React.js
- Backend: Python Flask
- Database: AWS DynamoDB
- Hosting: AWS Amplify

## Setup Instructions

### Prerequisites
- AWS Account
- AWS CLI configured
- Node.js and npm installed
- Python 3.x installed

### Backend Setup
1. Create a DynamoDB table named 'ChatMessages'
2. Configure AWS credentials
3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### Frontend Setup
1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Create a .env file in the frontend directory:
```
REACT_APP_API_ENDPOINT=your_api_endpoint
REACT_APP_REGION=your_aws_region
```

### Running the Application
1. Start the backend:
```bash
cd backend
python app.py
```

2. Start the frontend:
```bash
cd frontend
npm start
```

### Deployment
1. Push your code to a Git repository
2. Create a new AWS Amplify app
3. Connect your repository
4. Follow the Amplify setup wizard

## Features
- Real-time messaging
- Message history
- Responsive design
- AWS integration

## Architecture
- Frontend React app communicates with Flask backend via REST API
- Messages are stored in DynamoDB
- AWS Amplify handles hosting and CI/CD

## Project Structure
// Project structure
├── src/
│   ├── backend/
│   │   ├── lambda/
│   │   │   ├── gameManagement/
│   │   │   │   ├── createGame.ts
│   │   │   │   ├── joinGame.ts
│   │   │   │   └── endGame.ts
│   │   │   ├── playerActions/
│   │   │   │   ├── submitDrawing.ts
│   │   │   │   ├── submitAnswer.ts
│   │   │   │   └── submitVote.ts
│   │   │   └── aiIntegration/
│   │   │       ├── generateDrawing.ts
│   │   │       └── generateAnswer.ts
│   │   ├── websocket/
│   │   │   └── gameUpdates.ts
│   │   └── models/
│   │       ├── types/
│   │       │   ├── game.types.ts
│   │       │   ├── player.types.ts
│   │       │   └── round.types.ts
│   │       ├── Game.ts
│   │       ├── Player.ts
│   │       └── Round.ts
│   ├── shared/
│   │   └── types/
│   │       ├── gameState.ts
│   │       └── messages.ts
│   └── infrastructure/
│   │        └── stacks/
│   │            ├── gameStack.ts
│   │            └── storageStack.ts
│   ├── frontend/
│   │   ├── components/
│   │   │   ├── animations/
│   │   │   │   ├── BackgroundAnimation.tsx
│   │   │   │   └── LoadingAnimation.tsx
│   │   │   ├── game/
│   │   │   │   ├── DrawingCanvas.tsx
│   │   │   │   ├── AnswerInput.tsx
│   │   │   │   ├── PlayerList.tsx
│   │   │   │   └── GamePrompt.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Container.tsx
│   │   │   │   └── Title.tsx
│   │   │   └── shared/
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── LoadingSpinner.tsx
│   │   ├── context/
│   │   │   ├── GameContext.tsx
│   │   │   └── UserContext.tsx
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useGame.ts
│   │   │   └── useCanvas.ts
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Lobby.tsx
│   │   │   └── Game.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   └── websocket.ts
│   │   ├── styles/
│   │   │   ├── theme.ts
│   │   │   ├── globalStyles.ts
│   │   │   └── animations.ts
│   │   ├── types/
│   │   │   ├── game.types.ts
│   │   │   ├── websocket.types.ts
│   │   │   └── components.types.ts
│   │   └── utils/
│   │       ├── gameHelpers.ts
│   │       └── validators.ts
│   ├── App.tsx
│   └── index.tsx