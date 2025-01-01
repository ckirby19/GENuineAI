import { Schema } from "@/amplify/data/resource";

interface Props {
    username: string;
    participants: Schema["Participant"]["type"][];
    currentLobby: Schema["Lobby"]["type"]
    isHost: boolean | null | undefined
    startGame: () => void;
    leaveLobby: () => void;
}

export const WaitingRoom = (props: Props) => {
    return (
        <div className="mobile-friendly">
          <h1>Lobby: {props.currentLobby.code}</h1>
          <div className="participants-list">
            <h2>Participants:</h2>
            <ul>
              {props.participants.filter(p => !p.isAiParticipant).map((participant) => (
                <li key={participant.id}>
                  {participant.username} {participant.isHost ? '(Host)' : ''}
                </li>
              ))}
            </ul>
          </div>
          {props.isHost ? (
            <button 
              className="start-game"
              onClick={props.startGame}
            >
              Start Game
            </button>
          ) : (
            <div className="waiting-message">
              Waiting for host to start game...
            </div>
          )}
          <button className="leave-lobby" onClick={props.leaveLobby}>
            Leave Lobby
          </button>
        </div>
      );
}
