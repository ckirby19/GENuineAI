The game voting state bug was fixed by:

1. Adding currentRound and participants as dependencies to the answers subscription useEffect hook
2. Adding a check at the start of the hook to clear answers when there's no current round
3. Ensuring proper dependency arrays for all useEffect hooks to maintain proper state synchronization

These changes ensure that:
- The answers state is properly cleared when rounds change
- The subscription is properly updated when the round changes
- All users see the correct game state (answer entry vs voting) based on the current round status