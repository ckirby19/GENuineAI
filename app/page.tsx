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
  const [aiAnswer, setAiAnswer] = useState<string>("");
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [currentLobby, setCurrentLobby] = useState<Schema["Lobby"]["type"] | null>(null);
  const [participants, setParticipants] = useState<Schema["Participant"]["type"][]>([]);
  const [currentRound, setCurrentRound] = useState<Schema["Round"]["type"] | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<Schema["Prompt"]["type"] | null>(null);
  const [currentVotes, setCurrentVotes] = useState<Schema["Vote"]["type"][]>([]);
  const [answers, setAnswers] = useState<Schema["Answer"]["type"][]>([]);

  const isHost = participants.find(p => p.userId === username)?.isHost;
  
  // Subscribe to participants updates when in a lobby
  useEffect(() => {
    if (currentLobby) {
      console.log("LOBBY CHANGED");
      const participantsSub = client.models.Participant.observeQuery({
        filter: { lobbyId: { eq: currentLobby.id } }
      }).subscribe({
        next: (data) => setParticipants([...data.items]), 
        // The spread operator ( [...answerData.items]) creates a new array,
        // which is the recommended way to update state in React. 
        // It ensures that React detects the state change and triggers a re-render. 
        // If you just passed answerData.items directly, React might not detect the change if the array reference remains the same
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

  // Subscribe to current round and its prompt.
  useEffect(() => {
    if (currentLobby?.id && currentLobby.status === GAME_STATUSES.STARTED && currentLobby.currentRound) {
      console.log("ROUNDS: THIS SHOULD ONLY BE HERE WHEN LOBBY STATUS UPDATES TO STARTED OR ROUND UPDATES");
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
            console.log("Round status updated", round);
            setCurrentRound(round);

            if (round.promptId) {
              const prompt = await client.models.Prompt.get({ id: round.promptId });
              if (prompt.data) {
                setCurrentPrompt(prompt.data);
              }
            }
          }
        },
      });

      return () => {
        roundSubscription.unsubscribe();
      };
    }
  }, [currentLobby?.status, currentLobby?.id, currentLobby?.currentRound]);

  // Subscribe to updates to prompt (which occurs when new round starts)
  useEffect(() => {
    if (currentPrompt) {
      const promptSubscription = client.models.Prompt.observeQuery({
        filter: { id: { eq: currentPrompt?.id } }
      }).subscribe({
        next: async (promptData) => {
        // Add check to see if AI answer already exists for this round
        const roundAnswers = (await currentRound?.answers())?.data
        console.log("Check current answers in new round", roundAnswers)
        const existingAiAnswer = roundAnswers?.find(a => a.isAiAnswer);

        if (!existingAiAnswer){
          console.log(`Generating AI answer for round ${currentRound?.roundNumber} to prompt: ${promptData.items[0].text}`)
          const response = `Generic AI Answer for round ${currentRound?.roundNumber}`;
          const errors = null

          // const { response, errors } = await client.queries.GenerateTextResponse({
          //   prompt: prompt.data.text!
          // });

          if (!errors && response) {
            setAiAnswer(response);

            const AiParticipant = participants.find(x => x.isAiParticipant);
            if (AiParticipant) {
              await client.models.Answer.create({
                roundId: currentRound?.id,
                participantId: AiParticipant.id,
                text: response,
                isAiAnswer: true
              });
            }
          } else {
            console.log("Unable to generate AI answer to prompt:", errors);
          }
        }
        }
      })

      return () => {
        promptSubscription.unsubscribe();
      }
    }
  }, [currentPrompt?.id])

  // Subscribe to answers for current round and manage answer state
  useEffect(() => {
    if (!currentRound?.id) {
      console.log("Init empty answers")
      setAnswers([]);
      return;
    }

    console.log(`ANSWERS: THIS SHOULD ONLY BE HERE ON NEW ROUND ${currentRound.roundNumber}`);

    const answerSub = client.models.Answer.observeQuery({
      filter: { roundId: { eq: currentRound.id } }
    }).subscribe({
      next: async (answerData) => {
        setAnswers([...answerData.items])
        console.log(`${username}: Now have ${answerData.items.length} answers for round ${currentRound.roundNumber}: `, answerData)

        if (aiAnswer.length != 0
          && answerData.items.length === participants.length
          && currentRound?.status === ROUND_STATUSES.ANSWERING) {
            console.log(`Moving to voting state in round ${currentRound.roundNumber}`)

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
  }, [currentRound?.id])

  // Subscribe to votes for current round and manage scoring and transition to next round
  useEffect(() => {
    if (!currentRound?.id) {
      console.log("Init empty votes")
      setCurrentVotes([]);
      return;
    }
    console.log(`VOTES: THIS SHOULD ONLY BE HERE ON NEW ROUND ${currentRound.roundNumber}`);

    const votesSub = client.models.Vote.observeQuery({
      filter: { roundId: { eq: currentRound.id } }
    }).subscribe({
      next: async (votesData) => {
        setCurrentVotes([...votesData.items]) 
        console.log(`Now have ${votesData.items.length} votes: `, votesData.items)
        if (votesData.items.length === participants.filter(x => !x.isAiParticipant).length) {

          const aiParticipant = participants.find(x => x.isAiParticipant);

          votesData.items.forEach(async vote => {
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
          setParticipants([...participants])

          transitionToNextRound()
        }
      }
    });

    return () => {
      votesSub.unsubscribe();
    };
  }, [currentRound?.id])

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

  async function transitionToNextRound() {
    // Move to next round or end game
    if (currentLobby?.currentRound && currentLobby.currentRound < numberOfRounds) {
      // Clear states first to prevent race conditions
      console.log("CLEARING STATE");
      setCurrentPrompt(null);
      setCurrentRound(null);
      setAnswers([]);
      setCurrentVotes([]);
      setAiAnswer("");
      setUserAnswer("");
      

      const storedPrompts = JSON.parse(localStorage.getItem(`gamePrompts_${currentLobby.id}`) || "[]");
      const nextPromptText = storedPrompts[currentLobby.currentRound];

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
        roundNumber: currentLobby.currentRound + 1,
        status: ROUND_STATUSES.ANSWERING
      });

      if (!nextRound.data?.id) {
        console.error("Failed to create next round");
        return;
      }

      // Update lobby and reset state
      const updatedLobby = await client.models.Lobby.update({
        id: currentLobby.id,
        currentRound: currentLobby.currentRound + 1
      });

      console.log("RESETTING STATE");
      setCurrentPrompt(nextPrompt.data);
      setCurrentRound(nextRound.data);
      setCurrentLobby(updatedLobby.data);

    } else {
      // End game
      await client.models.Lobby.update({
        id: currentLobby?.id ?? "",
        status: GAME_STATUSES.COMPLETED
      });
    }
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
      answers={answers}
      currentRound={currentRound}
      currentPrompt={currentPrompt}
      currentVotes={currentVotes}
      setUsername={setUsername}
      setIsNameEntered={setIsNameEntered}
      setLobbyCode={setLobbyCode}
      setCurrentLobby={setCurrentLobby}
      setUserAnswer={setUserAnswer}
      setCurrentRound={setCurrentRound}
      // Custom Methods
      startGame={startGame}
      leaveLobby={leaveLobby}
    />
  )
}