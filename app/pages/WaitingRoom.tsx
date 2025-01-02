import { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
          <h1 className="text-3xl font-bold mb-8 neon-text">Lobby: {props.currentLobby.code}</h1>
          <h2 className="text-xl">Participants:</h2>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-4xl">
              {props.participants.filter(p => !p.isAiParticipant).map((participant) => (
                  <Card className="bg-muted neon-border text-justify">
                    <CardContent>
                      {participant.username} {participant.isHost ? '(Host)' : ''}
                    </CardContent>
                  </Card>
              ))}
          </div>
          {props.isHost ? (
            <Button className="neon-button" onClick={props.startGame}>
              Start Game
            </Button>
          ) : (
            <p className="text-xl">
              Waiting for host to start game...
            </p>
          )}
          <Button className="neon-button" onClick={props.leaveLobby}>
            Leave Lobby
          </Button>
        </div>
      );
}
