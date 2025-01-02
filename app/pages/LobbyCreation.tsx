import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface Props {
    username: string;
    lobbyCode: string;
    setLobbyCode: React.Dispatch<React.SetStateAction<string>>;
    createLobby: () => void;
    joinLobby: () => void;
}
export const LobbyCreation = (props: Props) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
          <h1 className="text-3xl font-bold mb-8 neon-text">Welcome, {props.username}!</h1>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-4xl">
            <Card className="bg-muted neon-border">
              <CardContent className="space-y-8">
                <Button onClick={props.createLobby} className="w-full neon-button mt-6">Create New Lobby</Button>
                <Input 
                  type="text" 
                  placeholder="Enter lobby code" 
                  value={props.lobbyCode}
                  onChange={(e) => props.setLobbyCode(e.target.value)}
                  maxLength={6}
                  className="w-full bg-background text-foreground border-[hsl(var(--neon-purple))]"
                />
                <Button onClick={props.joinLobby} className="w-full neon-button mb-6">Join Lobby</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
}
