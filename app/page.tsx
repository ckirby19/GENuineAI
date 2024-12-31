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
  
// Lobby subscription
useEffect(() => {
  if (currentLobby?.id) {
    const sub = client.models.Lobby.observeQuery({
      filter: { id: { eq: currentLobby.id } }
    }).subscribe({
      next: (data) => {
        if (data.items.length > 0) {
          setCurrentLobby(data.items[0]);
        }
        else {
          console.log("Lobby no longer exists");
          // Optional: Handle lobby deletion
          setCurrentLobby(null);
        }
      },
      error: (error) => {
        console.error("Error in lobby subscription:", error);
      }
    });
    return () => sub.unsubscribe();
  }
}, [currentLobby?.id]);

// Participants subscription
useEffect(() => {
  if (currentLobby?.id) {
    const sub = client.models.Participant.observeQuery({
      filter: { lobbyId: { eq: currentLobby.id } }
    }).subscribe({
      next: (data) => {
        setParticipants([...data.items]);
      },
      error: (error) => {
        console.error("Error in participants subscription:", error);
      }
    });
    return () => sub.unsubscribe();
  }
}, [currentLobby?.id]);

// Round subscription
useEffect(() => {
  if (currentLobby?.id) {
      const sub = client.models.Round.observeQuery({
        filter: { 
          and: [
            { lobbyId: { eq: currentLobby.id } },
            { roundNumber: { eq: currentLobby.currentRound! } }
          ]
        }
      }).subscribe({
      next: async (data) => {
        if (data.items.length > 0) {
          setCurrentRound(data.items[0]);

          // Also fetch and set the prompt when round updates
          const prompt = (await data.items[0].prompt()).data;
          setCurrentPrompt(prompt);
        }
      },
      error: (error) => {
        console.error("Error in round subscription:", error);
      }
    });
    return () => sub.unsubscribe();
  }
}, [currentLobby?.id, currentLobby?.currentRound]);

// Answers subscription
useEffect(() => {
  if (currentRound?.id) {
    const sub = client.models.Answer.observeQuery({
      filter: { roundId: { eq: currentRound.id } }
    }).subscribe({
      next: (data) => {
        setCurrentAnswers([...data.items]);
      },
      error: (error) => {
        console.error("Error in answers subscription:", error);
      }
    });
    return () => sub.unsubscribe();
  }
}, [currentRound?.id]);

// Votes subscription
useEffect(() => {
  if (currentRound?.id) {
    const sub = client.models.Vote.observeQuery({
      filter: { roundId: { eq: currentRound.id } }
    }).subscribe({
      next: (data) => {
        setCurrentVotes([...data.items]);
      },
      error: (error) => {
        console.error("Error in votes subscription:", error);
      }
    });
    return () => sub.unsubscribe();
  }
}, [currentRound?.id]);

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

    setCurrentLobby(lobby.data); // This will start the lobby sub
    
    // Trigger initial update to notify other subs
    await client.models.Lobby.update({
      id: lobby.data?.id!
    });
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

      setCurrentLobby(lobby); // This will start the lobby subscription
    
      // Trigger update to notify other clients
      await client.models.Lobby.update({
        id: lobby.id,
      })
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

    if (round <= numberOfRounds) {

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
    const updatedParticipants = [...participants]; // Create a new array to track score updates
    const aiParticipant = updatedParticipants.find(x => x.isAiParticipant);

    if (currentRound == null){
      console.log("Cannot transition to scoring if not in a round")
      return;
    }

    const votes = (await currentRound.votes()).data;

    if (votes == null){
      console.log("No votes found for round", currentRound?.id!)
      return;
    }

    for (const vote of votes){
      const answerVotedFor = (await vote.answer()).data;
      console.log("Got a vote for answer", vote, answerVotedFor);
      if (answerVotedFor){
        if (answerVotedFor.isAiAnswer){
          // Award voter
          const voter = updatedParticipants.find(p => p.id === vote.participantId);
          if (voter){
            console.log("Updating scores for voter", voter)
            voter.score = (voter.score ?? 0) + scoreIncrementVoter
          }
          else{
            console.log("No voter found for vote", vote)
          }
        }
        else{
            // Award AI
            if (aiParticipant){
              console.log("Updating scores for AI", aiParticipant)
              aiParticipant.score = (aiParticipant.score ?? 0) + scoreIncrementAI
            }
            else{
              console.log("No AI participant found")
            }

            // Award Answer Creator
            const answerCreator = updatedParticipants.find(p => p.id === answerVotedFor.participantId);
            if (answerCreator){
              console.log("Updating scores for answer creator", answerCreator)
              answerCreator.score = (answerCreator.score ?? 0) + scoreIncrementAnswerCreator
            }
            else{
              console.log("No answer creator found for answer", answerVotedFor)
            }
        }
      }
      else{
        console.log("No answer found for vote", vote)
      }
    }

    console.log("Check updated scores for participants", updatedParticipants)

    await Promise.all(updatedParticipants.map(participant => 
      client.models.Participant.update({
          id: participant.id,
          score: participant.score,
      })
    ));

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