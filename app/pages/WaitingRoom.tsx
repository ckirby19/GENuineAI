import { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { motion } from 'framer-motion'
import { Users, Crown, Copy, ArrowLeft } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface Props {
    username: string;
    participants: Schema["Participant"]["type"][];
    currentLobby: Schema["Lobby"]["type"]
    isHost: boolean | null | undefined
    startGame: () => void;
    leaveLobby: () => void;
}

export const WaitingRoom = (props: Props) => {
    const { toast } = useToast()

    const copyLobbyCode = () => {
      navigator.clipboard.writeText(props.currentLobby.code!)
      toast({
        title: "Lobby code copied!",
      })
    }

    const container = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1
        }
      }
    }

    const item = {
      hidden: { opacity: 0, x: -20 },
      show: { opacity: 1, x: 0 }
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-accent">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-md space-y-8"
      >
        <Card className="bg-muted neon-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Users className="w-6 h-6 mr-2 text-[hsl(var(--neon-purple))]" />
                Lobby
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={copyLobbyCode}
              >
                <Copy className="w-4 h-4 mr-1" />
                {props.currentLobby.code}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {props.participants.filter(p => !p.isAiParticipant).map((player) => (
                <motion.div
                  key={player.id}
                  variants={item}
                  className="flex items-center p-3 rounded-lg bg-accent/50"
                >
                  {player.isHost ? (
                    <Crown className="w-5 h-5 mr-2 text-[hsl(var(--neon-green))]" />
                  ) : (
                    <div className="w-5 h-5 mr-2" />
                  )}
                  <span className="flex-1">{player.username}</span>
                  {player.isHost && (
                    <span className="text-xs text-[hsl(var(--neon-green))]">HOST</span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {props.isHost &&
              <Button 
                className="w-full neon-button"
                disabled={props.participants.length < 3}
                onClick={props.startGame}
              >
                Start Game
              </Button>
            }
            <Button 
              variant="outline" 
              className="w-full neon-border"
              onClick={props.leaveLobby}
              asChild
            >
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
      // <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      //     <h1 className="text-3xl font-bold mb-8 neon-text">Lobby: {props.currentLobby.code}</h1>
      //     <h2 className="text-xl">Participants:</h2>
      //     <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-4xl">
      //         {props.participants.filter(p => !p.isAiParticipant).map((participant) => (
      //             <Card className="bg-muted neon-border text-justify">
      //               <CardContent>
      //                 {participant.username} {participant.isHost ? '(Host)' : ''}
      //               </CardContent>
      //             </Card>
      //         ))}
      //     </div>
      //     {props.isHost ? (
      //       <Button className="neon-button" onClick={props.startGame}>
      //         Start Game
      //       </Button>
      //     ) : (
      //       <p className="text-xl">
      //         Waiting for host to start game...
      //       </p>
      //     )}
      //     <Button className="neon-button" onClick={props.leaveLobby}>
      //       Leave Lobby
      //     </Button>
      //   </div>
      );
}
