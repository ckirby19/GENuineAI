'use client'

import { useState, useEffect, SetStateAction, Dispatch } from 'react'
import { motion } from 'framer-motion'
import { Brain, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { DrawingCanvas } from './DrawingCanvas'
import { Schema } from '@/amplify/data/resource'
import { numberOfRounds } from '@/app/model'
import { generateClient } from 'aws-amplify/api'

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

export const DrawingAnswerEntryPage = (props: Props) => {
  const client = generateClient<Schema>();
  const [isDrawing, setIsDrawing] = useState(true)
  const [timeLeft, setTimeLeft] = useState(60)

  useEffect(() => {
    if (timeLeft > 0 && isDrawing) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && isDrawing) {
      handleSaveDrawing('timeout')
    }
  }, [timeLeft, isDrawing])

  async function handleSaveDrawing(imageData: string) {
    console.log('Drawing saved:', imageData)
    setIsDrawing(false)
    try {
      if (props.currentRound && props.userAnswer.trim()) {
        const currentParticipant = props.participants.find(p => p.userId === props.username);
        if (currentParticipant) {

          await client.models.Answer.create({
            roundId: props.currentRound.id,
            participantId: currentParticipant.id,
            drawing: props.userAnswer
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
            <span className="flex items-center">
              <Brain className="w-6 h-6 mr-2 text-[hsl(var(--neon-purple))]" />
              <h2 className="text mb-8 neon-text text-center">Prompt: {props.currentPrompt.text}</h2>
            </span>
          }
          <span className="flex items-center text-[hsl(var(--neon-green))]">
            <Clock className="w-5 h-5 mr-1" />
            {timeLeft}s
          </span>    
        </CardHeader>
        <CardContent>
          {isDrawing ? (
            <DrawingCanvas onSave={handleSaveDrawing} />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <p className="text-lg font-semibold text-[hsl(var(--neon-green))]">Your drawing has been submitted!</p>
              <p>
                Waiting for {props.participants.length - props.answers.length} other player(s) to answer
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}