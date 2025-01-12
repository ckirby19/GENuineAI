import { Schema } from "@/amplify/data/resource";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Brain, Activity, Eye, X } from 'lucide-react'
import { NormaliseAnswer } from "../helpers";

interface Props {
    username: string;
    participants: Schema["Participant"]["type"][];
    answers: Schema["Answer"]["type"][];
    currentRound: Schema["Round"]["type"] | null;
    currentVotes: Schema["Vote"]["type"][];
    currentLobby: Schema["Lobby"]["type"];
    currentPrompt: Schema["Prompt"]["type"] | null;
    transitionToSinglePlayerScoring: () => Promise<void>
}

export const VotingPageAi = (props: Props) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 from-background to-accent">
        <Card className="w-full max-w-2xl bg-muted neon-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Brain className="w-6 h-6 mr-2 text-[hsl(var(--neon-purple))]" />
                AI Players are Voting
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Display the prompt and answers */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold neon-text">
                {props.currentPrompt?.text}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {props.answers
                  .filter(answer => answer.text != null)
                  .map((answer) => (
                    <div
                      key={answer.id}
                      className="p-3 rounded-lg bg-accent/50 text-sm"
                    >
                      {NormaliseAnswer(answer.text!)}
                    </div>
                ))}
              </div>
            </div>
            {/* AI Players voting status */}
            <div className="space-y-4">
              {props.participants.filter(x => x.isAiParticipant).map((ai) => (
                props.currentVotes.filter(x => x.participantId == ai.id).length != 0 && (
                  <motion.div
                    key={ai.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/30"
                  >
                    <span className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-[hsl(var(--neon-blue))]" />
                      {ai.username}
                    </span>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[hsl(var(--neon-green))] text-sm"
                    >
                      Vote submitted
                    </motion.span>
                  </motion.div>
                )
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full neon-button"
              onClick={props.transitionToSinglePlayerScoring}
              disabled={!(props.currentVotes.length == props.participants.filter(x => x.isAiParticipant).length)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Reveal AI Votes
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
}