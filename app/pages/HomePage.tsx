import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Brain } from 'lucide-react'
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { motion } from 'framer-motion'
import { Dispatch, SetStateAction } from 'react'
import { GAME_TYPE, GameType } from "../model"

interface Props {
    username: string;
    setUsername: Dispatch<React.SetStateAction<string>>;
    isNameEntered: boolean;
    setIsNameEntered: Dispatch<React.SetStateAction<boolean>>;
    setGameMode: Dispatch<SetStateAction<GameType | null>>;
    gameMode: GameType | null;
    createLobby: (numberOfAiModels: number) => void;
}

export const HomePage = (props: Props) => {

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (props.username.trim()) {
            props.setIsNameEntered(true);
            if (props.gameMode === GAME_TYPE.SINGLE_PLAYER){
                props.createLobby(3);
            }
        }
    };
    
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
                        <h1 className="text-4xl font-bold mb-8 neon-text text-center">GENuineAI</h1>
                        <div className="flex items-center text-center mb-8">
                            <Brain className="w-12 h-12 mr-4 text-[hsl(var(--neon-purple))]" />
                            <p className="text-xl">
                                {props.gameMode === GAME_TYPE.SINGLE_PLAYER ? "Single Player" : "Multi-Player"} Mode
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="justify-center">
                        <form onSubmit={handleNameSubmit} className="w-full space-y-4">
                            <Input
                            type="text"
                            placeholder="Enter your name"
                            value={props.username}
                            onChange={(e) => props.setUsername(e.target.value)}
                            required
                            className="w-full bg-muted text-foreground border-[hsl(var(--neon-blue))]"
                            />
                            <Button className="w-full neon-button" type="submit">
                                Submit
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter>
                        <Button 
                        variant="outline" 
                        className="w-full neon-border"
                        onClick={() => props.setGameMode(null)}
                        > 
                            Return to Game Selection
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
      );
}
