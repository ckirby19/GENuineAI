import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { motion } from 'framer-motion'
import { Dispatch, SetStateAction } from "react";
import { multiPlayerModels } from "../model";

interface Props {
    username: string;
    lobbyCode: string;
    setLobbyCode: Dispatch<SetStateAction<string>>;
    createLobby: (aiModels: string[]) => void;
    joinLobby: () => void;
    setIsNameEntered: Dispatch<SetStateAction<boolean>>;
}
export const LobbyCreation = (props: Props) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
          <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -20 }}
           className="w-full max-w-md space-y-8"
          >
            <Card className="bg-muted neon-border">
              <CardHeader>
                <h1 className="text-3xl font-bold neon-text">Welcome, {props.username}!</h1>
              </CardHeader>
              <CardContent className="space-y-8">
                <Button onClick={() => props.createLobby(multiPlayerModels)} className="w-full neon-button mt-6">Create New Lobby</Button>
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
              <CardFooter>
                <Button 
                variant="outline" 
                className="w-full neon-border"
                onClick={() => props.setIsNameEntered(false)}
                > 
                  Return to Name Entry
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      );
}
