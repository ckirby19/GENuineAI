import { Schema } from "@/amplify/data/resource";

interface Props {
    participants: Schema["Participant"]["type"][];

}

export const ScoresInfo = (props: Props) => {
    return (
     <div className="score-board">
        <h2>Scores:</h2>
        <ul>
          {props.participants.map((participant) => (
            <li key={participant.id}>
              {participant.username}: {participant.score || 0}
            </li>
          ))}
        </ul>
     </div>
      );
}
