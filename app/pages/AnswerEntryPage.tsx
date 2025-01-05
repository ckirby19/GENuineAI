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

              await client.models.Round.update({
                id: props.currentRound.id
              });

              await client.models.Lobby.update({
                id: props.currentLobby.id
              });
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
            <CardTitle>
              <h2 className="text mb-8 neon-text text-center">Round {props.currentLobby.currentRound} of {numberOfRounds}</h2>
            </CardTitle>      
            {props.currentPrompt && 
              <h2 className="text mb-8 neon-text text-center">Prompt: {props.currentPrompt.text}</h2>
            }    
          </CardHeader>
          <CardContent>
          {!props.answers.some(a => a.participantId === props.participants.find(p => p.userId === props.username)?.id) ? (
            <form onSubmit={submitAnswer} className="flex flex-col gap-4">
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
              Waiting for {props.participants.length - props.answers.length} other player(s) to answer
            </p>
          )}
          </CardContent>
        </Card>
      </div>
    );
}