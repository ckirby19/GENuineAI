import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Brain } from 'lucide-react'
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { motion } from 'framer-motion'

interface Props {
    username: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
    isNameEntered: boolean;
    setIsNameEntered: React.Dispatch<React.SetStateAction<boolean>>;
}

export const HomePage = (props: Props) => {

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (props.username.trim()) {
          props.setIsNameEntered(true);
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
                        <div className="flex items-center mb-8">
                            <Brain className="w-12 h-12 mr-4 text-[hsl(var(--neon-purple))]" />
                            <p className="text-xl">Can you tell friend from (Generative AI) foe?</p>
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
                </Card>
            </motion.div>
        </div>
      );
}
