# Waiting Room Transition Issue

## Problem
When all players have submitted their answers, the game stays in the "Waiting for other players to answer..." state instead of transitioning to the voting page. This occurs because there's no mechanism to update the round status from "ANSWERING" to "VOTING" when all answers are received.

## Analysis
1. In `AnswerEntryPage.tsx`, we can see that each player submits their answer, but there's no logic to trigger a phase transition when all answers are in.
2. The component shows a waiting message and tracks the number of answers: 
```typescript
<div>Waiting for other players to answer...</div>
<div>Answers submitted: {props.answers.length} / {props.participants.length}</div>
```
3. While it tracks the count, it doesn't initiate any status change when answers.length equals participants.length.

## Solution
The fix requires updating the round status to "VOTING" when all answers are in. This should be done in the `submitAnswer` function in `AnswerEntryPage.tsx`. Here's the proposed change:

```typescript
async function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (props.currentRound && props.userAnswer.trim()) {
      const currentParticipant = props.participants.find(p => p.userId === props.username);
      if (currentParticipant) {
        await client.models.Answer.create({
          roundId: props.currentRound.id,
          participantId: currentParticipant.id,
          text: props.userAnswer
        });
        props.setUserAnswer("");
        
        // Check if all answers are in
        if (props.answers.length + 1 === props.participants.length) {
          // Update round status to voting
          await client.models.Round.update({
            id: props.currentRound.id,
            status: ROUND_STATUSES.VOTING
          });
        }
      }
    }
  }
```

This change will ensure that:
1. When the last answer is submitted, the round status changes to VOTING
2. This status change will trigger the appropriate UI updates through the application's state management
3. Players will automatically transition to the voting phase

Implementation of this fix requires modifying the `AnswerEntryPage.tsx` file to include the new logic for transitioning to the voting phase when all answers are received.