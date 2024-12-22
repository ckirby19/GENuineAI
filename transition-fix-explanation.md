# Fix for Answer to Voting Phase Transition

## Issues Identified
1. The `setCurrentRound` and `setCurrentPrompt` props were not being passed to the AnswerEntryPage component
2. There were two competing mechanisms trying to handle the transition:
   - One in the AnswerEntryPage's submitAnswer function
   - Another in the page component's useEffect hook for answers

## Changes Made
1. Added missing props to AnswerEntryPage in page.tsx:
```typescript
<AnswerEntryPage
  username={username}
  userAnswer={userAnswer}
  setUserAnswer={setUserAnswer}
  participants={participants}
  answers={answers}
  currentRound={currentRound}
  setCurrentRound={setCurrentRound}  // Added
  setCurrentPrompt={setCurrentPrompt} // Added
/>
```

2. Removed the automatic transition logic from the useEffect hook in page.tsx to avoid conflicts with the transition logic in AnswerEntryPage.

## How it Works Now
1. When a user submits their answer, the AnswerEntryPage component checks if this was the last answer needed
2. If it was the last answer, it updates the round status to VOTING and updates the local state
3. The page component observes the currentRound status and switches to the VotingPage when the status is VOTING
4. With the competing logic removed and proper props passed, the transition should now work smoothly for all users