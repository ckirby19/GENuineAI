"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./app.css";
import { GAME_STATUSES, GAME_TYPE, GameType, numberOfRounds, ROUND_STATUSES, scoreIncrementAI, scoreIncrementAnswerCreator, scoreIncrementVoter } from "./model";
import { MultiPlayerGame } from "./pages/MultiPlayerGame";
import { getPrompts } from "./getPrompts";
import { GameModePage } from "./pages/GameModePage";
import { SinglePlayerGame } from "./pages/SinglePlayerGame";
import { NormaliseAnswer } from "./helpers";

const client = generateClient<Schema>();

export default function App() {
  const [username, setUsername] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [gameMode, setGameMode] = useState<GameType | null>(null);
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
            console.log("Lobby updated:", data.items[0])
            setCurrentLobby(data.items[0]);
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
            console.log("Round updated:", data.items[0])
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
  }, [currentLobby?.currentRound]);

  // Answers subscription
  useEffect(() => {
    if (currentRound?.id && currentLobby?.id) {
      const sub = client.models.Answer.observeQuery({
        filter: { roundId: { eq: currentRound.id } }
      }).subscribe({
        next: (data) => {
          setCurrentAnswers([...data.items]);
          console.log("Answers updated:", data.items);
          if (data.items.length >= participants.length && currentRound.status == ROUND_STATUSES.ANSWERING) {
            if (gameMode == GAME_TYPE.SINGLE_PLAYER) {
              console.log("Transitioning to single player voting")
              transitionToSinglePlayerVoting(data.items);
            }
            if (gameMode == GAME_TYPE.MULTI_PLAYER) {
              console.log("Transitioning to multi player voting")
              transitionToMultiPlayerVoting();
            }
          }
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
          console.log("Votes updated:", data.items);
          if (data.items.length >= participants.filter(x => !x.isAiParticipant).length && ROUND_STATUSES.VOTING){
            // Single-player transition is done manually
            if (gameMode == GAME_TYPE.MULTI_PLAYER) {
              console.log("Transitioning to multi player scoring")
              transitionToMultiPlayerScoring();
            }
          }
        },
        error: (error) => {
          console.error("Error in votes subscription:", error);
        }
      });
      return () => sub.unsubscribe();
    }
  }, [currentRound?.id]);

  async function startGame() {
    if (!currentLobby) {
      console.log("Cannot start game when not in a lobby")
      return;
    }
    
    transitionToRound(1);
  }

  async function createLobby(aiModels: string[]) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const lobby = await client.models.Lobby.create({
      code,
      hostId: username,
      status: GAME_STATUSES.WAITING,
      gameType: gameMode
    });
    
    // Create host participant
    await client.models.Participant.create({
      userId: username,
      username: username,
      lobbyId: lobby.data?.id,
      isHost: true
    });

    setCurrentLobby(lobby.data); // This will start the lobby sub

    let allPrompts = await getPrompts(numberOfRounds)
    if (!allPrompts){
      console.error("Failed to create prompts");
      return;
    }

    if (!lobby.data?.id) {
      console.error("Failed to create lobby");
      return;
    }

    const aiParticipants = [];
    
    const numberOfAiModels = aiModels.length;

    for (let modelNum = 0; modelNum < numberOfAiModels; modelNum++) {
      let aiModelName = aiModels[modelNum];
      let aiParticipant = await client.models.Participant.create({
        userId: `${aiModelName}`,
        username: `AI-${aiModelName.split(".")[0]}`,
        lobbyId: lobby.data.id,
        isHost: false,
        isAiParticipant: true
      });

      aiParticipants.push(aiParticipant);
    }

    const genericResponse = "no response from model";
    for (let i = 0; i < numberOfRounds; i++) {
      let promptText = allPrompts[i];

      // Create next prompt
      let nextPrompt = await client.models.Prompt.create({
        text: promptText
      });

      if (!nextPrompt.data?.id) {
        console.error("Failed to create next prompt");
        return;
      }

      let nextRound = await client.models.Round.create({
        lobbyId: lobby.data.id,
        promptId: nextPrompt.data.id,
        roundNumber: i + 1,
        status: ROUND_STATUSES.ANSWERING
      });

      if (!nextRound.data){
        console.error("Failed to create next round");
        return;
      }

      // Create all rounds with these prompts
      for (let j = 0; j < numberOfAiModels; j++) {
        let aiParticipant = aiParticipants[j];
        let aiModelName = aiModels[j];

        if (!aiParticipant.data?.id){
          console.error("Failed to create ai participant");
          return;
        }

        let { data, errors } = await client.queries.GenerateTextResponse({
          prompt: nextPrompt.data.text!,
          model: aiModelName
        });

        if (errors) {
          console.log("Errors from model:", aiModelName, errors);
        }

        let formattedAnswer;
        if (!data){
          console.log("Model returned badly formatted response", aiModelName);
          formattedAnswer = genericResponse 
        }
        else{
          let normalisedAnswer = NormaliseAnswer(data)
          formattedAnswer = normalisedAnswer === '' ? genericResponse : normalisedAnswer;
        }

        await client.models.Answer.create({
          roundId: nextRound.data.id,
          participantId: aiParticipant.data.id,
          text: formattedAnswer,
          isAiAnswer: true
        });

        await client.models.Round.update({
          id: nextRound.data.id,
        });
      }
    }
  
    
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

      setCurrentLobby(lobby);
    
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
      resetState();
    }
  }

  function resetState(){
    setUsername('');
    setLobbyCode('');
    setUserAnswer('');
    setGameMode(null);
    setIsNameEntered(false);
    setCurrentLobby(null);
    setParticipants([]);
    setCurrentRound(null);
    setCurrentPrompt(null);
    setCurrentVotes([]);
    setCurrentAnswers([]);
  }

  async function transitionToRound(round: number){
    if (!currentLobby) {
      console.log("Cannot transition to round if not in a lobby")
      return;
    }

    if (round <= numberOfRounds) {
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

  async function transitionToMultiPlayerVoting(){
    if (!currentLobby) {
      console.log("Cannot transition to voting if not in a lobby")
      return;
    }

    if (!currentRound) {
      console.log("Cannot transition to voting if not in a round")
      return;
    }

    if (currentRound.status != ROUND_STATUSES.ANSWERING){
      console.log("Cannot transition to voting if not answering")
      return;
    }

    // Update round status
    await client.models.Round.update({
      id: currentRound.id,
      status: ROUND_STATUSES.VOTING
    })

    // Update lobby
    // await client.models.Lobby.update({
    //   id: currentLobby.id,
    // })
  }

  async function transitionToSinglePlayerVoting(allAnswers: Schema["Answer"]["type"][]){
    if (!currentLobby) {
      console.log("Cannot transition to voting if not in a lobby")
      return;
    }

    if (!currentRound) {
      console.log("Cannot transition to voting if not in a round")
      return;
    }

    let prompt = (await currentRound.prompt()).data;

    if (!prompt?.text) {
      console.log("Cannot transition to voting if there is no prompt")
      return;
    }

    // Update round status
    await client.models.Round.update({
      id: currentRound.id,
      status: ROUND_STATUSES.VOTING
    })

    // Update lobby
    await client.models.Lobby.update({
      id: currentLobby.id,
    })

    const aiParticipants = participants.filter(x => x.isAiParticipant);
    const stringsToFind = ["1", "2", "3"]

    for (let i=0; i<aiParticipants.length; i++){
      let aiParti = aiParticipants[i];
      let filteredAnswers = allAnswers.filter(x => x.text != null && x.participantId != aiParti.id);

      let formattedAnswersPrompt = filteredAnswers
        .map((answer, index) => `(${index + 1}) ${NormaliseAnswer(answer.text!)}`).join('\n');
      
      let { data, errors } = await client.queries.PickHumanResponse({
        originalPrompt: prompt.text,
        answers: formattedAnswersPrompt,
        model: aiParti.userId!
      });

      if (errors) {
        console.log("Errors from model:", aiParti.username, errors);
      }

      data = data == null ? "1" : data

      let found = stringsToFind.find(num => data.includes(num));
    
      // If found, convert to number, otherwise return null
      let chosenAnswer = found ? parseInt(found) : null;

      if (chosenAnswer == null){
        console.log("AI voter did not respond correctly", data)
      }

      // Create vote
      await client.models.Vote.create({
        roundId: currentRound?.id!,
        participantId: aiParti.id,
        answerId: filteredAnswers[(chosenAnswer ?? 1) - 1].id
      });
    }

    await client.models.Round.update({
      id: currentRound.id,
      status: ROUND_STATUSES.VOTING
    })

    // Update lobby
    await client.models.Lobby.update({
      id: currentLobby.id,
    })
  }

  async function transitionToMultiPlayerScoring(){
    if (currentLobby == null) {
      console.log("Cannot transition to scoring if not in a lobby")
      return;
    }

    if (currentRound == null){
      console.log("Cannot transition to scoring if not in a round")
      return;
    }
    if (currentRound.status != ROUND_STATUSES.VOTING){
      console.log("Cannot transition to scoring if not in voting stage", currentRound.status)
    }

    const updatedParticipants = [...participants]; // Create a new array to track score updates
    const aiParticipant = updatedParticipants.find(x => x.isAiParticipant);
    const votes = (await currentRound.votes()).data;

    if (votes == null){
      console.log("No votes found for round", currentRound?.id!)
      return;
    }

    for (const vote of votes){
      const answerVotedFor = (await vote.answer()).data;
      if (answerVotedFor){
        if (answerVotedFor.isAiAnswer){
          // Award voter
          let voter = updatedParticipants.find(p => p.id === vote.participantId);
          if (voter){
            voter.score = (voter.score ?? 0) + scoreIncrementVoter
          }
          else{
            console.log("No voter found for vote", vote)
          }
        }
        else{
            // Award AI
            if (aiParticipant){
              aiParticipant.score = (aiParticipant.score ?? 0) + scoreIncrementAI
            }
            else{
              console.log("No AI participant found")
            }

            // Award Answer Creator
            let answerCreator = updatedParticipants.find(p => p.id === answerVotedFor.participantId);
            if (answerCreator){
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

    await Promise.all(updatedParticipants.map(participant => 
      client.models.Participant.update({
          id: participant.id,
          score: participant.score,
      })
    ));

    // Update round status
    await client.models.Round.update({
      id: currentRound?.id!,
      status: ROUND_STATUSES.SCORING
    })

    // Update lobby
    await client.models.Lobby.update({
      id: currentLobby.id,
    })
  }

  async function transitionToSinglePlayerScoring(){
    if (currentLobby == null) {
      console.log("Cannot transition to scoring if not in a lobby")
      return;
    }

    if (currentRound == null){
      console.log("Cannot transition to scoring if not in a round")
      return;
    }

    const updatedParticipants = [...participants]; // Create a new array to track score updates
    const humanParticipant = updatedParticipants.find(x => !x.isAiParticipant);
    const votes = (await currentRound.votes()).data;

    if (votes == null){
      console.log("No votes found for round", currentRound?.id!)
      return;
    }

    for (const vote of votes){
      let answerVotedFor = (await vote.answer()).data;
      if (answerVotedFor){
        if (!answerVotedFor.isAiAnswer){
          // Ai voted for human answer
          let voter = updatedParticipants.find(p => p.id === vote.participantId);
          if (voter){
            voter.score = (voter.score ?? 0) + scoreIncrementVoter
          }
          else{
            console.log("No voter found for vote", vote)
          }
        }
        else{
            // AI voted for AI answer, reward human and answer creator
            if (humanParticipant){
              humanParticipant.score = (humanParticipant.score ?? 0) + (scoreIncrementAI)
            }
            else{
              console.log("No AI participant found")
            }

            // Award Answer Creator
            let answerCreator = updatedParticipants.find(p => p.id === answerVotedFor.participantId);
            if (answerCreator){
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

    await Promise.all(updatedParticipants.map(participant => 
      client.models.Participant.update({
          id: participant.id,
          score: participant.score,
      })
    ));

    // Update round status
    await client.models.Round.update({
      id: currentRound?.id!,
      status: ROUND_STATUSES.SCORING
    })

    // Update lobby
    await client.models.Lobby.update({
      id: currentLobby.id,
    })
  }

  if (!gameMode) {
    return (
      <GameModePage 
        setGameMode={setGameMode}
      />
    ) 
  }
  if (gameMode === GAME_TYPE.MULTI_PLAYER){
    return (
      <MultiPlayerGame
        username={username}
        isNameEntered={isNameEntered}
        lobbyCode={lobbyCode}
        currentLobby={currentLobby}
        participants={participants}
        gameMode = {gameMode}
        isHost={isHost}
        userAnswer={userAnswer}
        answers={currentAnswers}
        currentRound={currentRound}
        currentPrompt={currentPrompt}
        currentVotes={currentVotes}
        setGameMode={setGameMode}
        setUsername={setUsername}
        setIsNameEntered={setIsNameEntered}
        setLobbyCode={setLobbyCode}
        setUserAnswer={setUserAnswer}
        // Custom Methods
        startGame={startGame}
        createLobby={createLobby}
        joinLobby={joinLobby}
        leaveLobby={leaveLobby}
        transitionToRound={transitionToRound}
      />
    )
  }
  else if (gameMode === GAME_TYPE.SINGLE_PLAYER){
    return (
      <SinglePlayerGame
        username={username}
        isNameEntered={isNameEntered}
        lobbyCode={lobbyCode}
        currentLobby={currentLobby}
        participants={participants}
        gameMode = {gameMode}
        isHost={isHost}
        userAnswer={userAnswer}
        answers={currentAnswers}
        currentRound={currentRound}
        currentPrompt={currentPrompt}
        currentVotes={currentVotes}
        setGameMode={setGameMode}
        setUsername={setUsername}
        setIsNameEntered={setIsNameEntered}
        setLobbyCode={setLobbyCode}
        setUserAnswer={setUserAnswer}
        // Custom Methods
        startGame={startGame}
        createLobby={createLobby}
        joinLobby={joinLobby}
        leaveLobby={leaveLobby}
        transitionToRound={transitionToRound}
        transitionToSinglePlayerScoring={transitionToSinglePlayerScoring}
      />
    )
  }

}