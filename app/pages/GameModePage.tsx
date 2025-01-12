import { motion } from 'framer-motion'
import { Brain, Users, Bot, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { GAME_TYPE, GameType } from '../model'
import { Dispatch, SetStateAction } from 'react'

interface Props {
    setGameMode: Dispatch<SetStateAction<GameType | null>>;
}

export const GameModePage = (props: Props) => {
    const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 from-background to-accent">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl space-y-8"
      >
        {/* Title */}
        <div className="text-center space-y-2">
            <h1 className="text-5xl font-bold mb-8 text-center">GENuineAI</h1>
        </div>

        {/* Game Description */}
        <motion.div
          variants={item}
          initial="hidden"
          animate="show"
          className="text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-2">
            <Brain className="w-5 h-5 text-[hsl(var(--neon-blue))]" />
            <h2 className="text-lg font-semibold">How to Play</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            In both game modes, players receive creative prompts and must craft responses. 
            The goal is to write answers that are convincing enough to be mistaken for AI-generated content. 
            Score points by successfully deceiving others and correctly identifying AI-generated responses!
          </p>
        </motion.div>

        {/* Game Modes */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Single Player Mode */}
          <motion.div variants={item}>
            <Card className="bg-muted h-full neon-border hover:border-[hsl(var(--neon-purple))] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-6 h-6 text-[hsl(var(--neon-purple))]" />
                  Single Player
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Challenge yourself against AI models in a battle of creativity and deception.
                    </p>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      <li>Compete against 3 AI opponents</li>
                      <li>Earn points by tricking AI models into thinking your responses are AI</li>
                    </ul>
                    <p className="text-sm text-muted-foreground">
                        Can you trick AI into thinking you are AI too?
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full neon-button" onClick={() => props.setGameMode(GAME_TYPE.SINGLE_PLAYER)}>
                    <ArrowRight className="w-4 h-4 ml-2" /> Play Solo
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Multiplayer Mode */}
          <motion.div variants={item}>
            <Card className="bg-muted h-full neon-border hover:border-[hsl(var(--neon-green))] transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-[hsl(var(--neon-green))]" />
                  Multiplayer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Compete against friends and a single AI model in a multiplayer game of creativity.
                    </p>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      <li>Trick friends into thinking your responses are AI generated</li>
                      <li>Earn points by finding the AI answer</li>
                    </ul>
                    <p className="text-sm text-muted-foreground">
                        Can you tell friend from (Generative AI) foe?
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
              <Button className="w-full neon-button" onClick={() => props.setGameMode(GAME_TYPE.MULTI_PLAYER)}>
                    <ArrowRight className="w-4 h-4 ml-2" /> Play with Friends
               </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}