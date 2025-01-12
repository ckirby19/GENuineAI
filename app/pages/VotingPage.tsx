import { Schema } from "@/amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { useState } from "react";
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { NormaliseAnswer } from "../helpers";

interface Props {
    username: string;
    participants: Schema["Participant"]["type"][];
    answers: Schema["Answer"]["type"][];
    currentRound: Schema["Round"]["type"] | null;
    currentVotes: Schema["Vote"]["type"][];
    currentLobby: Schema["Lobby"]["type"];
    currentPrompt: Schema["Prompt"]["type"] | null;
}

export const VotingPage = (props: Props) => {
    const client = generateClient<Schema>();
    const [votedAnswerId, setVotedAnswerId] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState(false)
    const currentParticipant = props.participants.find(p => p.userId === props.username)

    async function submitVote() {
        if (props.currentRound && votedAnswerId !== null) {
          const answer = props.answers.find(a => a.id === votedAnswerId);
          if (answer) {
            if (currentParticipant){
              setHasVoted(true);
              const vote = await client.models.Vote.create({
                roundId: props.currentRound.id,
                participantId: currentParticipant.id,
                answerId: answer.id
              });

              if (!vote.data?.id) {
                console.error("Failed to create vote:", vote.errors);
                return;
              }

              await client.models.Round.update({
                id: props.currentRound.id
              })
              
              await client.models.Participant.update({
                id: currentParticipant.id
              })

              await client.models.Answer.update({
                id: answer.id
              })

              await client.models.Lobby.update({
                id: props.currentLobby.id
              })
            }
        }
      }
    }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 from-background to-accent">
          <Card className="w-full max-w-2xl bg-muted neon-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Brain className="w-6 h-6 mr-2 text-[hsl(var(--neon-purple))]" />
                  Round {props.currentRound?.roundNumber ?? 0}: Vote for the AI Answer
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-6 neon-text">{props.currentPrompt?.text ?? ""}</p>
              {!hasVoted ? (
                <RadioGroup value={votedAnswerId?.toString()} onValueChange={(value) => setVotedAnswerId(value)}>
                  {props.answers 
                      .filter(answer => answer.text != null && answer.participantId != currentParticipant?.id)
                      .map((answer) => (
                    <div key={answer.id} className="flex items-center space-x-2 mb-4">
                      <RadioGroupItem value={answer.id.toString()} id={`answer-${answer.id}`} className="border-[hsl(var(--neon-blue))]" />
                      <Label 
                        htmlFor={`answer-${answer.id}`} 
                        className="flex-grow p-3 rounded-md bg-accent hover:bg-accent/80 transition-colors cursor-pointer"
                      >
                        {NormaliseAnswer(answer.text!)}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-4"
                >
                  <div className="w-full bg-accent rounded-full h-4">
                    <motion.div
                      className="bg-[hsl(var(--neon-blue))] h-4 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: 
                        `${Math.min((props.currentVotes.length / props.participants.filter(x => !x.isAiParticipant).length) * 100, 100)}%` 
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p>{Math.min(props.currentVotes.length, props.participants.filter(x => !x.isAiParticipant).length)} out of {props.participants.filter(x => !x.isAiParticipant).length} players have voted</p>
                </motion.div>
              )}
            </CardContent>
            <CardFooter>
              {!hasVoted && (
                <Button 
                  className="w-full neon-button" 
                  onClick={() => submitVote()}
                  disabled={votedAnswerId === null}
                >
                  Submit Vote
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
    );
}