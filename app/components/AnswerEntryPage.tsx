import { Schema } from "@/amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { Dispatch, SetStateAction } from "react";

interface Props {
    username: string;
    userAnswer: string;
    setUserAnswer: Dispatch<SetStateAction<string>>;
    participants: Schema["Participant"]["type"][];
    answers: Schema["Answer"]["type"][];
    currentRound: Schema["Round"]["type"] | null;
    setCurrentRound: Dispatch<SetStateAction<Schema["Round"]["type"] | null>>;
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
        <div>Human Answers submitted: {props.answers.filter(x => !x.isAiAnswer).length} / {props.participants.filter(x => !x.isAiParticipant).length}
        </div>
        <div>GenAI Answer submitted? {props.answers.find(x => x.isAiAnswer == true) != null ? "Yes" : "No"}</div>
      </div>
      );
}