"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { GAME_STATUSES, numberOfRounds, ROUND_STATUSES, samplePrompts } from "./model";
import { HomePage } from "./components/HomePage";
import { LobbyCreation } from "./components/LobbyCreation";
import { WaitingRoom } from "./components/WaitingRoom";
import { ScoresInfo } from "./components/ScoresInfo";
import { AnswerEntryPage } from "./components/AnswerEntryPage";
import { VotingPage } from "./components/VotingPage";
import { GameEnd } from "./components/GameEnd";

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
      // Subscribe to participants
      const participantsSub = client.models.Participant.observeQuery({
        filter: { lobbyId: { eq: currentLobby.id } }
      }).subscribe({
        next: (data) => setParticipants([...data.items]),
      });

      // Subscribe to lobby updates
      const lobbySub = client.models.Lobby.observeQuery({
        filter: { id: { eq: currentLobby.id } }
      }).subscribe({
        next: (data) => {
          if (data.items.length > 0) {
            setCurrentLobby(data.items[0]);
          }
        },
      });

      return () => {
        participantsSub.unsubscribe();
        lobbySub.unsubscribe();
      };
    }
  }, [currentLobby, participants]);

  // Subscribe to current round and its prompt
  useEffect(() => {
    if (currentLobby?.id && currentLobby.status === GAME_STATUSES.STARTED && currentLobby.currentRound) {
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
  }, [currentLobby, currentRound]);

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
          console.log("Check current round status", currentRound?.status)
        }
      },
    });

    return () => {
      answerSub.unsubscribe();
    };
  }, [currentRound, participants])

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
      const shuffledPrompts = [...samplePrompts].sort(() => Math.random() - 0.5).slice(0, numberOfRounds);
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

  if (!isNameEntered) {
    return (
      <HomePage 
        username={username}
        setUsername={setUsername}
        isNameEntered={isNameEntered}
        setIsNameEntered={setIsNameEntered}  
      />
    )
  } 

  if (!currentLobby) {
    return (
      <LobbyCreation
        username={username}
        setIsNameEntered={setIsNameEntered}
        lobbyCode={lobbyCode}
        setLobbyCode={setLobbyCode}
        currentLobby={currentLobby}
        setCurrentLobby={setCurrentLobby}
      />
    );
  }

  // Lobby has been created, now waiting for for host to start game
  if (currentLobby.status === GAME_STATUSES.WAITING){
    return (
      <WaitingRoom 
        username={username}
        participants={participants}
        currentLobby={currentLobby}
        isHost={isHost}
        startGame={startGame}
      />
    )
  }

  // The host has started the game, we now begin the game
  if (currentLobby.status === GAME_STATUSES.STARTED){
    return (
      <main className="mobile-friendly">
        <div className="game-interface">
          <ScoresInfo participants={participants} />
          <div className="round-info">
            <h2>Round {currentLobby.currentRound} of {numberOfRounds}</h2>
            {currentPrompt && <h3>{currentPrompt.text}</h3>}
          </div>
          {currentRound?.status === ROUND_STATUSES.ANSWERING ? 
            <AnswerEntryPage
              username={username}
              userAnswer={userAnswer}
              setUserAnswer={setUserAnswer}
              participants={participants}
              answers={answers}
              currentRound={currentRound}
            /> : 
            <VotingPage
              username={username}
              participants={participants}
              answers={answers}
              currentRound={currentRound}
              currentLobby={currentLobby}
              setCurrentPrompt={setCurrentPrompt}
              setCurrentRound={setCurrentRound}
              setAnswers={setAnswers}
              setCurrentLobby={setCurrentLobby}
            />
          }
        </div>
      </main>
    )
  };

  if (currentLobby.status === GAME_STATUSES.COMPLETED){
    return (
      <GameEnd
        participants={participants}
        leaveLobby={leaveLobby} 
      />
    )
  }
}