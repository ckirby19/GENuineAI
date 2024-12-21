import { Schema } from "@/amplify/data/resource";
import { GAME_STATUSES } from "../model";
import { generateClient } from "aws-amplify/api";

interface Props {
    username: string;
    setIsNameEntered: React.Dispatch<React.SetStateAction<boolean>>;
    lobbyCode: string;
    setLobbyCode: React.Dispatch<React.SetStateAction<string>>;
    currentLobby: Schema["Lobby"]["type"] | null
    setCurrentLobby: React.Dispatch<React.SetStateAction<Schema["Lobby"]["type"] | null>>;
}
export const LobbyCreation = (props: Props) => {

    const client = generateClient<Schema>();

    async function createLobby() {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const lobby = await client.models.Lobby.create({
          code,
          hostId: props.username,
          status: GAME_STATUSES.WAITING
        });
    
        await client.models.Participant.create({
          userId: props.username,
          username: props.username,
          lobbyId: lobby.data?.id,
          isHost: true
        });
        
        props.setCurrentLobby(lobby.data);
    }
    
    async function joinLobby() {
        const lobbies = await client.models.Lobby.list({
          filter: { code: { eq: props.lobbyCode.toUpperCase() } }
        });
    
        if (lobbies.data.length === 0) {
          alert("Lobby not found!");
          return;
        }
    
        const lobby = lobbies.data[0];
        
        // Check for existing participant with same name
        const existingParticipants = await client.models.Participant.list({
          filter: { 
            and: [
              { lobbyId: { eq: lobby.id } },
              { username: { eq: props.username } }
            ]
          }
        });
    
        if (existingParticipants.data.length > 0) {
          alert("This name is already taken in this lobby. Please choose another name.");
          props.setIsNameEntered(false); // Reset to name entry screen
          return;
        }
    
        await client.models.Participant.create({
          userId: props.username,
          username: props.username,
          lobbyId: lobby.id,
          isHost: false
        });
    
        props.setCurrentLobby(lobby);
    }

    return (
        <main className="mobile-friendly">
          <h1>Welcome, {props.username}!</h1>
          <div className="lobby-actions">
            <button className="create-lobby" onClick={createLobby}>Create New Lobby</button>
            <div className="join-section">
              <input
                type="text"
                placeholder="Enter Lobby Code"
                value={props.lobbyCode}
                onChange={(e) => props.setLobbyCode(e.target.value)}
                maxLength={6}
              />
              <button onClick={joinLobby}>Join Lobby</button>
            </div>
          </div>
        </main>
      );
}
