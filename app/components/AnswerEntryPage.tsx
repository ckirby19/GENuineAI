import { Schema } from "@/amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { Dispatch, SetStateAction } from "react";
import { ROUND_STATUSES } from "../model";

interface Props {
    username: string;
    userAnswer: string;
    setUserAnswer: Dispatch<SetStateAction<string>>;
    participants: Schema["Participant"]["type"][];
    answers: Schema["Answer"]["type"][];
    currentRound: Schema["Round"]["type"] | null;
    setCurrentRound: Dispatch<SetStateAction<Schema["Round"]["type"] | null>>;
    setCurrentPrompt: Dispatch<SetStateAction<Schema["Prompt"]["type"] | null>>;
}

export const AnswerEntryPage = (props: Props) => {
    const client = generateClient<Schema>();

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
            
            // Check if this was the last answer needed
            // const newAnswerCount = props.answers.length + 1;
            // if (newAnswerCount === props.participants.length) {
            //   // Update round status to voting
            //   const updatedRound = await client.models.Round.update({
            //     id: props.currentRound.id,
            //     status: ROUND_STATUSES.VOTING
            //   });
            //   // Update local state to trigger re-render
            //   if (updatedRound.data) {
            //     props.setCurrentRound(updatedRound.data);
            //   }
            // }
          }
        }
      }

    return (
        <div className="answer-phase">
        {!props.answers.some(a => a.participantId === props.participants.find(p => p.userId === props.username)?.id) ? (
          <form onSubmit={submitAnswer}>
            <input
              type="text"
              value={props.userAnswer}
              onChange={(e) => props.setUserAnswer(e.target.value)}
              placeholder="Your answer..."
              required
            />
            <button type="submit">Submit Answer</button>
          </form>
        ) : (
          <div>Waiting for other players to answer...</div>
        )}
        <div>Answers submitted: {props.answers.length} / {props.participants.length}</div>
      </div>
      );
}