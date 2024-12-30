"use client";

import { useState, useEffect, FormEvent } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { GAME_STATUSES, numberOfRounds, ROUND_STATUSES, samplePrompts, scoreIncrementAI, scoreIncrementAnswerCreator, scoreIncrementVoter } from "./model";
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
  const [currentVotes, setCurrentVotes] = useState<Schema["Vote"]["type"][]>([]);
  const [currentAnswers, setCurrentAnswers] = useState<Schema["Answer"]["type"][]>([]);

  const isHost = participants.find(p => p.userId === username)?.isHost;
  
  // Subscribe to lobby updates
  useEffect(() => {
    if (currentLobby) {
      console.log("User has joined lobby");
      const lobbyStatusSub = client.models.Lobby.observeQuery({
        filter: { id: { eq: currentLobby.id } }
      }).subscribe({
        next: async (data) => {
          if (data.items.length > 0) {
            const updatedLobby = data.items[0];

            console.log("Lobby status updated", updatedLobby);
            setCurrentLobby(updatedLobby);

            // Participants
            const updatedPartis = (await updatedLobby.participants()).data;
            setParticipants([...updatedPartis]);
            console.log("Partis", updatedPartis);

            // Round
            const currentRoundNumber = (await updatedLobby.currentRound);
            if (currentRoundNumber == null || currentRoundNumber == 0) {
              return;
            }
            console.log("Current round number", currentRoundNumber);

            const rounds = (await updatedLobby.rounds()).data;
            console.log("Rounds", rounds);
            const updatedRound = rounds[currentRoundNumber - 1];
            setCurrentRound(updatedRound)
            console.log("Current round", updatedRound);

            // Prompt
            const prompt = (await updatedRound.prompt()).data
            setCurrentPrompt(prompt)
            console.log("Current prompt", prompt);

            // Answers
            const answers = (await updatedRound.answers()).data
            setCurrentAnswers([...answers]);
            console.log("Current answers", answers);

            // Votes
            const votes = (await updatedRound.votes()).data
            setCurrentVotes([...votes]);
            console.log("Current votes", votes);
          }
        },
      });

      return () => {
        lobbyStatusSub.unsubscribe();
      }
    }
  }, [currentLobby?.id]);

  async function startGame() {
        // const allPrompts = await client.models.Prompt.list({
    //   filter: { isActive: { eq: true } }
    // });
    if (!currentLobby) {
      console.log("Cannot start game when not in a lobby")
      return;
    }
    console.log("Starting game")

    if (samplePrompts.length < numberOfRounds) {
      alert("Not enough prompts available. Please contact administrator.");
      return;
    }

    const shuffledPrompts = [...samplePrompts].sort(() => Math.random() - 0.5).slice(0, numberOfRounds + 1);
    
    localStorage.setItem(`gamePrompts_${currentLobby.id}`, JSON.stringify(shuffledPrompts));

    transitionToRound(1);
  }

  async function createLobby() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const lobby = await client.models.Lobby.create({
      code,
      hostId: username,
      status: GAME_STATUSES.WAITING
    });
    
    // Create host participant
    await client.models.Participant.create({
      userId: username,
      username: username,
      lobbyId: lobby.data?.id,
      isHost: true
    });
    
    // Create AI participant
    await client.models.Participant.create({
      userId: "AI",
      username: "AI",
      lobbyId: lobby.data?.id,
      isHost: false,
      isAiParticipant: true
    });

    await client.models.Lobby.update({
      id: lobby.data?.id!
    });

    setCurrentLobby(lobby.data); // This will start the lobby sub
  }

  async function joinLobby() {
      const lobbies = await client.models.Lobby.list({
        filter: { code: { eq: lobbyCode.toUpperCase() } }
      });

      if (lobbies.data.length === 0) {
        alert("Lobby not found!");
        return;
      }

      const lobby = lobbies.data[0];
      
      // Check for existing participant with same name
      const existingParticipants = await client.models.Participant.list({
        filter: { 
          and: [
            { lobbyId: { eq: lobby.id } },
            { username: { eq: username } }
          ]
        }
      });

      if (existingParticipants.data.length > 0) {
        alert("This name is already taken in this lobby. Please choose another name.");
        setIsNameEntered(false); // Reset to name entry screen
        return;
      }

      await client.models.Participant.create({
        userId: username,
        username: username,
        lobbyId: lobby.id,
        isHost: false
      });

      const updatedLobby = await client.models.Lobby.update({
        id: lobby.id,
      })

      setCurrentLobby(updatedLobby.data);
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
      // setCurrentLobby(null);
      // setParticipants([]);
    }
  }

  async function transitionToRound(round: number){
    if (!currentLobby) {
      console.log("Cannot transition to round if not in a lobby")
      return;
    }

    if (round < numberOfRounds) {

      const storedPrompts = JSON.parse(localStorage.getItem(`gamePrompts_${currentLobby.id}`) || "[]");
      const nextPromptText = storedPrompts[round - 1];

      // Create next prompt
      const nextPrompt = await client.models.Prompt.create({
        text: nextPromptText
      });

      if (!nextPrompt.data?.id) {
        console.error("Failed to create next prompt");
        return;
      }

      const nextRound = await client.models.Round.create({
        lobbyId: currentLobby.id,
        promptId: nextPrompt.data.id,
        roundNumber: round,
      });

      if (!nextRound.data?.id) {
        console.error("Failed to create next round");
        return;
      }

      console.log(`Generating AI answer for round ${round} to prompt: ${nextPromptText}`)
      const response = `Generic AI Answer for round ${round}`;
      const errors = null

      // const { response, errors } = await client.queries.GenerateTextResponse({
      //   prompt: prompt.data.text!
      // });

      if (!errors && response) {
        const AiParticipant = participants.find(x => x.isAiParticipant);
        console.log("Has ai parti", AiParticipant)
        if (AiParticipant) {
          await client.models.Answer.create({
            roundId: nextRound.data.id,
            participantId: AiParticipant.id,
            text: response,
            isAiAnswer: true
          });
        }
      } else {
        console.log("Unable to generate AI answer to prompt:", errors);
        return;
      }

      // Update round so it has above answer and transitions to next UI
      client.models.Round.update({
        id: nextRound.data.id,
        status: ROUND_STATUSES.ANSWERING
      });

      // Update lobby
      await client.models.Lobby.update({
        id: currentLobby.id,
        status: GAME_STATUSES.STARTED,
        currentRound: round
      });

    }
    else{
      finishGame()
    }
  }

  async function finishGame() {
    await client.models.Lobby.update({
      id: currentLobby?.id ?? "",
      status: GAME_STATUSES.COMPLETED
    });
  }

  async function transitionToVoting(){
    if (!currentLobby) {
      console.log("Cannot transition to voting if not in a lobby")
      return;
    }

    // Update round status
    await client.models.Round.update({
      id: currentRound?.id!,
      status: ROUND_STATUSES.VOTING
    })

    // Update lobby
    await client.models.Lobby.update({
      id: currentLobby.id,
    })
  }

  async function transitionToScoring(){
    const aiParticipant = participants.find(x => x.isAiParticipant);
    
    currentVotes.forEach(async vote => {
      const answerVotedFor = (await vote.answer()).data;
      if (answerVotedFor){
        if (!answerVotedFor.isAiAnswer){
          // Award AI
          if (aiParticipant){
            console.log("Updating scores for AI", aiParticipant)
            aiParticipant.score = (aiParticipant.score ?? 0) + scoreIncrementAI
          }

          // Award Answer Creator
          const answerCreator = participants.find(p => p.id === answerVotedFor.participantId);
          if (answerCreator){
            console.log("Updating scores for answer creator", answerCreator)
            answerCreator.score = (answerCreator.score ?? 0) + scoreIncrementAnswerCreator
          }
        }
        else{
          // Award voter
          const voter = participants.find(p => p.id === vote.participantId);
          if (voter){
            console.log("Updating scores for voter", voter)
            voter.score = (voter.score ?? 0) + scoreIncrementVoter
          }
        }
      }
    })

    console.log("Check updated scores for participants", participants)
    participants.forEach(async p => {
      await client.models.Participant.update({
        id: p.id,
        score: p.score
      })
    })

    console.log("Finished updating scores, transitioning...")

    transitionToRound(currentLobby?.currentRound! + 1)
  }

  return (
    <MainPage
      username={username}
      isNameEntered={isNameEntered}
      lobbyCode={lobbyCode}
      currentLobby={currentLobby}
      participants={participants}
      isHost={isHost}
      userAnswer={userAnswer}
      answers={currentAnswers}
      currentRound={currentRound}
      currentPrompt={currentPrompt}
      currentVotes={currentVotes}
      setUsername={setUsername}
      setIsNameEntered={setIsNameEntered}
      setLobbyCode={setLobbyCode}
      setCurrentLobby={setCurrentLobby}
      setUserAnswer={setUserAnswer}
      // Custom Methods
      startGame={startGame}
      createLobby={createLobby}
      joinLobby={joinLobby}
      leaveLobby={leaveLobby}
      transitionToVoting={transitionToVoting}
      transitionToScoring={transitionToScoring}
    />
  )
}