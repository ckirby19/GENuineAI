import { Schema } from "@/amplify/data/resource";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
    participants: Schema["Participant"]["type"][];
    leaveLobby: () => void;
}

export const GameEnd = (props: Props) => {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <motion.div
          key="endgame"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-2xl"
        >
          <Card className="w-full bg-muted neon-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                Final Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {props.participants
                  .sort((a, b) => (b.score || 0) - (a.score || 0))                
                  .map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <span className="flex items-center">
                        {(index === 0 || player.score == props.participants[0].score) && <Trophy className="w-5 h-5 mr-2 text-[hsl(var(--neon-green))]" />}
                        {player.username}
                      </span>
                      <span className="font-bold">{player.score}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full neon-button" onClick={props.leaveLobby}>
                Leave Lobby
              </Button>
          </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
}
