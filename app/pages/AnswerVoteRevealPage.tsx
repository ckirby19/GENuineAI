import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Brain, User, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Schema } from '@/amplify/data/resource'
import { GAME_TYPE, GameType, scoreIncrementAnswerCreator, scoreIncrementVoter } from '../model'

interface Props {
    username: string;
    gameMode: GameType | null;
    participants: Schema["Participant"]["type"][];
    answers: Schema["Answer"]["type"][];
    currentRound: Schema["Round"]["type"] | null;
    currentVotes: Schema["Vote"]["type"][];
    currentLobby: Schema["Lobby"]["type"];
    currentPrompt: Schema["Prompt"]["type"] | null;
    transitionToRound: (round: number) => void;    
}

export const AnswerVoteRevealPage = (props: Props) => {
    const [currentAnswerIndex, setCurrentAnswerIndex] = useState(0)
    const [revealStage, setRevealStage] = useState(0)
    const [voterUsernames, setVoterUsernames] = useState<string[]>([]);

    const currentAnswer = props.answers[currentAnswerIndex]

    useEffect(() => {    
      const timers = [
        setTimeout(() => setRevealStage(1), 1000), // Reveal votes
        setTimeout(() => setRevealStage(2), 2000), // Reveal submitter
        setTimeout(() => setRevealStage(3), 2500), // Reveal score addition
        setTimeout(() => {
          if (currentAnswerIndex < props.answers.length - 1) {
              setCurrentAnswerIndex(prev => prev + 1)
              setRevealStage(0)
          } 
          else {
              props.transitionToRound(props.currentLobby.currentRound! + 1)
          }
        }, 4000) // Move to next answer or end game
      ]
    
      return () => timers.forEach(clearTimeout)
    }, [currentAnswerIndex])

    useEffect(() => {
      async function fetchVoterUsernames() {
        if (!currentAnswer) return;
          
        const usernames = await Promise.all(
          props.currentVotes
            .filter(vote => vote.answerId === currentAnswer.id)
            .map(async vote => {
              const participant = await vote.participant();
              return participant.data?.username || 'Unknown';
            })
        );
        setVoterUsernames(usernames);
      }
  
      fetchVoterUsernames();
    }, [currentAnswerIndex]);

    if (props.answers.length === 0 || props.participants == null)
        return null;

    const currentAnswerSubmitter = props.participants.find(participant => participant.id === currentAnswer.participantId)

    const VotersGetScore = () =>
      (props.gameMode == GAME_TYPE.SINGLE_PLAYER && currentAnswer.isAiAnswer == false) ||
      (props.gameMode == GAME_TYPE.MULTI_PLAYER && currentAnswer.isAiAnswer == true);

    const AnswerCreatorGetsScore = () =>
      (props.gameMode == GAME_TYPE.SINGLE_PLAYER && currentAnswer.isAiAnswer == true) ||
      (props.gameMode == GAME_TYPE.MULTI_PLAYER && currentAnswer.isAiAnswer == false);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 from-background to-accent">
          <AnimatePresence mode="wait">
              <motion.div
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-2xl"
              >
                <Card className="w-full bg-muted neon-border">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Brain className="w-6 h-6 mr-2 text-[hsl(var(--neon-purple))]" />
                        Round {props.currentRound?.roundNumber ?? 0} Results
                      </span>
                      <span className="text-[hsl(var(--neon-green))]">
                        {currentAnswerIndex + 1} / {props.answers.length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl mb-4 neon-text">{props.currentPrompt?.text ?? ""}</p>
                    {currentAnswer && (
                      <div className="space-y-4">
                        <p className="text-2xl font-bold">{currentAnswer.text}</p>
                        <AnimatePresence>
                          {revealStage >= 1 && (
                            <motion.div
                              key="votes"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="flex items-center space-x-2"
                            >
                              <Users className="w-5 h-5 text-[hsl(var(--neon-blue))]" />
                              <span>Votes: {voterUsernames.join(", ") || "No votes"}</span>
                              {revealStage >= 3 &&
                              VotersGetScore() && (
                                <span className="ml-2 text-sm text-[hsl(var(--neon-green))]">
                                  +{scoreIncrementVoter}
                                </span>
                              )}
                            </motion.div>
                          )}
                          {revealStage >= 2 && (
                            <motion.div
                              key="submitter"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="flex items-center space-x-2"
                            >
                              <User className="w-5 h-5 text-[hsl(var(--neon-green))]" />
                              <span>Submitter: {currentAnswerSubmitter?.username}</span>
                              {currentAnswer.isAiAnswer && <Brain className="w-5 h-5 ml-2 text-[hsl(var(--neon-purple))]" />}
                              {revealStage >= 3 &&
                              AnswerCreatorGetsScore() && (
                                <span className="ml-2 text-sm text-[hsl(var(--neon-green))]">
                                  +{scoreIncrementAnswerCreator * voterUsernames.length}
                                </span>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
          </AnimatePresence>
        </div>
      )
}
