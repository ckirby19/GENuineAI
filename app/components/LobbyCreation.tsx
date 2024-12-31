interface Props {
    username: string;
    lobbyCode: string;
    setLobbyCode: React.Dispatch<React.SetStateAction<string>>;
    createLobby: () => void;
    joinLobby: () => void;
}
export const LobbyCreation = (props: Props) => {
    return (
        <main className="mobile-friendly">
          <h1>Welcome, {props.username}!</h1>
          <div className="lobby-actions">
            <button className="create-lobby" onClick={props.createLobby}>Create New Lobby</button>
            <div className="join-section">
              <input
                type="text"
                placeholder="Enter Lobby Code"
                value={props.lobbyCode}
                onChange={(e) => props.setLobbyCode(e.target.value)}
                maxLength={6}
              />
              <button onClick={props.joinLobby}>Join Lobby</button>
            </div>
          </div>
        </main>
      );
}
