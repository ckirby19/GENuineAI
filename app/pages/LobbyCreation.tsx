import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Users, Plus } from 'lucide-react'

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            <Card className="bg-muted neon-border">
              <CardContent>
                <Button onClick={props.createLobby} className="w-full neon-button">Create New Lobby</Button>
              </CardContent>
            </Card>

            <Card className="bg-muted neon-border">
              <CardContent className="space-y-4">
                <Input 
                  type="text" 
                  placeholder="Enter lobby code" 
                  value={props.lobbyCode}
                  onChange={(e) => props.setLobbyCode(e.target.value)}
                  maxLength={6}
                  className="w-full bg-background text-foreground border-[hsl(var(--neon-purple))]"
                />
                <Button onClick={props.joinLobby} className="w-full neon-button">Join Lobby</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
}
