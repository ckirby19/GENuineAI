"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { GAME_STATUSES, numberOfRounds, ROUND_STATUSES, samplePrompts } from "./model";
import { MainPage } from "./components/MainPage";

const client = generateClient<Schema>();

export default function App() {
  const [username, setUsername] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [currentLobby, setCurrentLobby] = useState<Schema["Lobby"]["type"] | null>(null);
  const [participants, setParticipants] = useState<Schema["Participant"]["type"][]>([]);
  const [currentRound, setCurrentRound] = useState<Schema["Round"]["type"] | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<Schema["Prompt"]["type"] | null>(null);
  const [answers, setAnswers] = useState<Schema["Answer"]["type"][]>([]);

  const isHost = participants.find(p => p.userId === username)?.isHost;
  
  // Subscribe to participants updates when in a lobby
  useEffect(() => {
    if (currentLobby) {
      console.log("Subscribing to participants for lobby", currentLobby.id);
      const participantsSub = client.models.Participant.observeQuery({
        filter: { lobbyId: { eq: currentLobby.id } }
      }).subscribe({
        next: (data) => setParticipants([...data.items]),
      });

      const lobbyStatusSub = client.models.Lobby.observeQuery({
        filter: { id: { eq: currentLobby.id } }
      }).subscribe({
        next: (data) => {
          if (data.items.length > 0) {
            const updatedLobby = data.items[0];
            setCurrentLobby(updatedLobby);
            console.log("Lobby status updated", updatedLobby);
          }
        },
      });

      return () => {
        participantsSub.unsubscribe();
        lobbyStatusSub.unsubscribe();
      }
    }
  }, [currentLobby?.id]);

  // Subscribe to current round and its prompt
  useEffect(() => {
    if (currentLobby?.id && currentLobby.status === GAME_STATUSES.STARTED && currentLobby.currentRound) {
      console.log("Check current lobby", currentLobby)
      const roundSubscription = client.models.Round.observeQuery({
        filter: { 
          and: [
            { lobbyId: { eq: currentLobby.id } },
            { roundNumber: { eq: currentLobby.currentRound } }
          ]
        }
      }).subscribe({
        next: async (data) => {
          if (data.items.length > 0) {
            console.log("Round sub, check data:", data)
            const round = data.items[0];
            setCurrentRound(round);
            console.log("Set current round", currentRound)
            if (round.promptId) {
              const prompt = await client.models.Prompt.get({ id: round.promptId });
              if (prompt.data) {
                setCurrentPrompt(prompt.data);
                console.log("Set current prompt", currentPrompt)
              }
            }
          }
        },
      });

      return () => {
        roundSubscription.unsubscribe();
      };
    }
  }, [currentLobby?.status, currentLobby?.currentRound]);

  // Subscribe to answers for current round and manage answer state
  useEffect(() => {
    if (!currentRound?.id) {
      setAnswers([]);
      return;
    }
    const answerSub = client.models.Answer.observeQuery({
      filter: { roundId: { eq: currentRound.id } }
    }).subscribe({
      next: async (answerData) => {
        setAnswers([...answerData.items])
        // Automatically transition to voting when all answers are in
        if (answerData.items.length === participants.length && currentRound?.status === ROUND_STATUSES.ANSWERING) {
          const updatedRound = await client.models.Round.update({
            id: currentRound.id,
            status: ROUND_STATUSES.VOTING
          });
          if (updatedRound.data){
            setCurrentRound(updatedRound.data);
          }
        }
      },
    });

    return () => {
      answerSub.unsubscribe();
    };
  }, [currentRound?.answers])

  async function startGame() {
    if (currentLobby) {
      // const allPrompts = await client.models.Prompt.list({
      //   filter: { isActive: { eq: true } }
      // });
      if (samplePrompts.length < numberOfRounds) {
        alert("Not enough prompts available. Please contact administrator.");
        return;
      }

      // Randomly select prompts
      const shuffledPrompts = [...samplePrompts].sort(() => Math.random() - 0.5).slice(0, numberOfRounds + 1);
      // Create first prompt and round
      const firstPrompt = await client.models.Prompt.create({
        text: shuffledPrompts[0]
      });

      if (!firstPrompt.data?.id) {
        console.error("Failed to create prompt");
        return;
      }

      const firstRound = await client.models.Round.create({
        lobbyId: currentLobby.id,
        promptId: firstPrompt.data.id,
        roundNumber: 1,
        status: ROUND_STATUSES.ANSWERING
      });

      if (!firstRound.data?.id) {
        console.error("Failed to create round");
        return;
      }

      // Update lobby status and current round
      const updatedLobby = await client.models.Lobby.update({
        id: currentLobby.id,
        status: GAME_STATUSES.STARTED,
        currentRound: firstRound.data.roundNumber
      });

      // Set initial state
      setCurrentPrompt(firstPrompt.data);
      setCurrentRound(firstRound.data);
      setAnswers([]);
      setCurrentLobby(updatedLobby.data);

      // Store remaining prompts in localStorage for future rounds (excluding the first one)
      const remainingPrompts = shuffledPrompts.slice(1);
      localStorage.setItem(`gamePrompts_${currentLobby.id}`, 
        JSON.stringify(remainingPrompts));
    }
  }

  async function leaveLobby() {
    if (currentLobby) {
      const participant = participants.find(p => p.userId === username);
      if (participant) {
        await client.models.Participant.delete({ id: participant.id });
        if (isHost) {
          await client.models.Lobby.delete({ id: currentLobby.id });
        }
      }
      setCurrentLobby(null);
      setParticipants([]);
    }
  }

  return (
    <MainPage
      username={username}
      setUsername={setUsername}
      isNameEntered={isNameEntered}
      setIsNameEntered={setIsNameEntered}
      lobbyCode={lobbyCode}
      setLobbyCode={setLobbyCode}
      currentLobby={currentLobby}
      setCurrentLobby={setCurrentLobby}
      participants={participants}
      isHost={isHost}
      startGame={startGame}
      userAnswer={userAnswer}
      setUserAnswer={setUserAnswer}
      answers={answers}
      currentRound={currentRound}
      setCurrentRound={setCurrentRound}
      setCurrentPrompt={setCurrentPrompt}
      setAnswers={setAnswers}
      currentPrompt={currentPrompt}
      leaveLobby={leaveLobby}
    />
  )
}