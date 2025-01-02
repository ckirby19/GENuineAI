import { Schema } from "@/amplify/data/resource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateClient } from "aws-amplify/data";
import { Dispatch, SetStateAction, useState } from "react";
import { numberOfRounds } from "../model";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
    username: string;
    userAnswer: string;
    setUserAnswer: Dispatch<SetStateAction<string>>;
    participants: Schema["Participant"]["type"][];
    answers: Schema["Answer"]["type"][];
    currentRound: Schema["Round"]["type"] | null;
    currentLobby: Schema["Lobby"]["type"];
    currentPrompt: Schema["Prompt"]["type"] | null;
    transitionToVoting: () => void;
}

export const AnswerEntryPage = (props: Props) => {
    const client = generateClient<Schema>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function submitAnswer(e: React.FormEvent) {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
          if (props.currentRound && props.userAnswer.trim()) {
            const currentParticipant = props.participants.find(p => p.userId === props.username);
            if (currentParticipant) {
  
              await client.models.Answer.create({
                roundId: props.currentRound.id,
                participantId: currentParticipant.id,
                text: props.userAnswer
              });

              await client.models.Lobby.update({
                id: props.currentLobby.id
              })
  
              const round = await client.models.Round.get({
                id: props.currentRound.id
              })
  
              const answers = (await round.data!.answers()).data;
  
              if (answers.length === props.participants.length) {
                console.log("All answers submitted, moving to voting phase");
                props.transitionToVoting();
              }
            }
          }        
        } catch (error) {
          console.error("Error submitting answer:", error);
        } finally {
          props.setUserAnswer("");
          setIsSubmitting(false);
        }
      }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-accent">
        <Card className="w-full max-w-2xl bg-muted neon-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <h2 className="text mb-8 neon-text">Round {props.currentLobby.currentRound} of {numberOfRounds}</h2>
            </CardTitle>      
            {props.currentPrompt && 
              <h3 className="text mb-8 neon-text">{props.currentPrompt.text}</h3>
            }    
          </CardHeader>
          <CardContent>
          {!props.answers.some(a => a.participantId === props.participants.find(p => p.userId === props.username)?.id) ? (
            <form onSubmit={submitAnswer}>
              <Input
                type="text"
                value={props.userAnswer}
                onChange={(e) => props.setUserAnswer(e.target.value)}
                placeholder="Your answer..."
                required
              />
              <Button className="w-full neon-button" type="submit">
                Submit Answer
              </Button>
            </form>
          ) : (
            <p className="text-xl">
              Waiting for other players to answer...
            </p>
          )}
            <p className="text-xl">
              Answers submitted: {props.answers.length} / {props.participants.length}
            </p>
          </CardContent>
        </Card>
      </div>
      );
}