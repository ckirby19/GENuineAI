# Fix for Vote Phase Transition Issue

## Problem
When all players have submitted their answers, the game is not properly transitioning to the voting page. While we've implemented the status update to VOTING and local state updates in the AnswerEntryPage component, the parent component needs to properly handle this transition.

## Root Cause
1. The round status is being updated correctly in the database when all answers are submitted
2. The local state (currentRound) is being updated with the new status
3. However, the parent component (game page) isn't properly switching between AnswerEntryPage and VotingPage based on the round status

## Solution
The game page needs to properly handle the round status changes. Here's what needs to be implemented in the page.tsx:

```typescript
// In the game page component
{currentRound?.status === ROUND_STATUSES.ANSWERING ? (
  <AnswerEntryPage
    username={username}
    userAnswer={userAnswer}
    setUserAnswer={setUserAnswer}
    participants={participants}
    answers={answers}
    currentRound={currentRound}
    setCurrentRound={setCurrentRound}
    setCurrentPrompt={setCurrentPrompt}
  />
) : currentRound?.status === ROUND_STATUSES.VOTING ? (
  <VotingPage
    username={username}
    participants={participants}
    answers={answers}
    currentRound={currentRound}
    currentLobby={currentLobby}
    setCurrentPrompt={setCurrentPrompt}
    setCurrentRound={setCurrentRound}
    setAnswers={setAnswers}
    setCurrentLobby={setCurrentLobby}
  />
) : null}
```

This change ensures that:
1. The game page properly switches between components based on the round status
2. When the round status changes to VOTING, the VotingPage component is displayed immediately
3. All necessary props are passed to both components for proper functionality

## Implementation Steps
1. We've already implemented the status update in AnswerEntryPage
2. We've added the necessary props to update local state in AnswerEntryPage
3. The parent component needs to use the currentRound.status to determine which component to render