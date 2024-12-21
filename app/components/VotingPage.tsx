import { Schema } from "@/amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { GAME_STATUSES, numberOfRounds, ROUND_STATUSES } from "../model";
import { Dispatch, SetStateAction } from "react";

interface Props {
    username: string;
    participants: Schema["Participant"]["type"][];
    answers: Schema["Answer"]["type"][];
    currentRound: Schema["Round"]["type"] | null;
    currentLobby: Schema["Lobby"]["type"] | null;
    setCurrentPrompt: Dispatch<SetStateAction<Schema["Prompt"]["type"] | null>>;
    setCurrentRound: Dispatch<SetStateAction<Schema["Round"]["type"] | null>>;
    setAnswers: Dispatch<SetStateAction<Schema["Answer"]["type"][]>>;
    setCurrentLobby: Dispatch<SetStateAction<Schema["Lobby"]["type"] | null>>;
}

export const VotingPage = (props: Props) => {
    const client = generateClient<Schema>();

    async function submitVote(answerId: string) {
        if (props.currentRound) {
          // Increment votes for the answer
          const answer = props.answers.find(a => a.id === answerId);
          if (answer) {
            await client.models.Answer.update({
              id: answerId,
              votes: (answer.votes || 0) + 1
            });
    
            // Check if all votes are in (one per participant except answer author)
            const totalVotes = props.answers.reduce((sum, a) => sum + (a.votes || 0), 0);
            if (totalVotes === props.participants.length - 1) {
              // Find winning answer
              const winningAnswer = props.answers.reduce((prev, curr) => 
                (curr.votes || 0) > (prev.votes || 0) ? curr : prev
              );
    
              // Update winner's score
              const winner = props.participants.find(p => p.id === winningAnswer.participantId);
              if (winner) {
                await client.models.Participant.update({
                  id: winner.id,
                  score: (winner.score || 0) + 1
                });
              }
    
              // Move to next round or end game
              if (props.currentLobby?.currentRound && props.currentLobby.currentRound < numberOfRounds) {
                const storedPrompts = JSON.parse(localStorage.getItem(`gamePrompts_${props.currentLobby.id}`) || "[]");
                const nextPromptText = storedPrompts[props.currentLobby.currentRound];
    
                // Create next prompt
                const nextPrompt = await client.models.Prompt.create({
                  text: nextPromptText
                });
    
                if (!nextPrompt.data?.id) {
                  console.error("Failed to create next prompt");
                  return;
                }
    
                const nextRound = await client.models.Round.create({
                  lobbyId: props.currentLobby.id,
                  promptId: nextPrompt.data.id,
                  roundNumber: props.currentLobby.currentRound + 1,
                  status: ROUND_STATUSES.ANSWERING
                });
    
                if (!nextRound.data?.id) {
                  console.error("Failed to create next round");
                  return;
                }
    
                // Update lobby and reset state
                const updatedLobby = await client.models.Lobby.update({
                  id: props.currentLobby?.id ?? "",
                  currentRound: props.currentLobby.currentRound + 1
                });
    
                props.setCurrentPrompt(nextPrompt.data);
                props.setCurrentRound(nextRound.data);
                props.setAnswers([]);
                props.setCurrentLobby(updatedLobby.data);
              } else {
                // End game
                await client.models.Lobby.update({
                  id: props.currentLobby?.id ?? "",
                  status: GAME_STATUSES.COMPLETED
                });
              }
            }
          }
        }
      }


    return (
        <div className="voting-phase">
            {props.answers.map((answer) => {
                const isOwnAnswer = answer.participantId === props.participants.find(p => p.userId === props.username)?.id;
                return (
                    <div key={answer.id} className="answer-card">
                    <p>{answer.text}</p>
                    {!isOwnAnswer && (
                        <button 
                        onClick={() => submitVote(answer.id)}
                        disabled={props.answers.reduce((sum, a) => sum + (a.votes || 0), 0) >= props.participants.length - 1}
                        >
                        Vote for this answer
                        </button>
                    )}
                    <span>Votes: {answer.votes || 0}</span>
                    </div>
                );
            })}
        </div>
      );
}