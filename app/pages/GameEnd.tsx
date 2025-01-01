import { Schema } from "@/amplify/data/resource";

interface Props {
    participants: Schema["Participant"]["type"][];
    leaveLobby: () => void;
}

export const GameEnd = (props: Props) => {
    return (
        <div>
        <div className="game-over">
          <h2>Game Over!</h2>
          <div className="final-scores">
            <h3>Final Scores:</h3>
            <ul>
              {[...props.participants]
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .map((participant) => (
                  <li key={participant.id}>
                    {participant.username}: {participant.score || 0}
                  </li>
                ))
              }
            </ul>
          </div>
        </div>
        <button className="leave-lobby" onClick={props.leaveLobby}>
          Leave Lobby
        </button>
      </div>
      );
}
