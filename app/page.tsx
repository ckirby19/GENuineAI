"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { LOBBY_STATUSES, ROUND_STATUSES } from "./model";

const client = generateClient<Schema>();

export default function App() {
  const [username, setUsername] = useState("");
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [currentLobby, setCurrentLobby] = useState<Schema["Lobby"]["type"] | null>(null);
  const [participants, setParticipants] = useState<Schema["Participant"]["type"][]>([]);
  const [lobbyCode, setLobbyCode] = useState("");
  const [currentRound, setCurrentRound] = useState<Schema["Round"]["type"] | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<Schema["Prompt"]["type"] | null>(null);
  const [answers, setAnswers] = useState<Schema["Answer"]["type"][]>([]);
  const [userAnswer, setUserAnswer] = useState("");

  useEffect(() => {
    // Subscribe to participants updates when in a lobby
    if (currentLobby) {
      client.models.Participant.observeQuery({
        filter: { lobbyId: { eq: currentLobby.id } }
      }).subscribe({
        next: (data) => setParticipants([...data.items]),
      });

      // Subscribe to round updates
      client.models.Round.observeQuery({
        filter: { 
          and: [
            { lobbyId: { eq: currentLobby.id } },
            { roundNumber: { eq: currentLobby.currentRound ?? 0 } }
          ]
        }
      }).subscribe({
        next: async (data) => {
          if (data.items.length > 0) {
            const round = data.items[0];
            setCurrentRound(round);
            
            // Fetch prompt for current round
            const prompt = await client.models.Prompt.get({ id: round.promptId ?? "" });
            setCurrentPrompt(prompt.data);

            // Subscribe to answers for current round
            client.models.Answer.observeQuery({
              filter: { roundId: { eq: round.id } }
            }).subscribe({
              next: (answerData) => setAnswers([...answerData.items]),
            });
          }
        },
      });
    }
  }, [currentLobby]);

  async function createLobby() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const lobby = await client.models.Lobby.create({
      code,
      hostId: username,
      status: LOBBY_STATUSES.WAITING
    });

    await client.models.Participant.create({
      userId: username,
      username: username,
      lobbyId: lobby.data?.id,
      isHost: true
    });
    
    setCurrentLobby(lobby.data);
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
  }

  async function startGame() {
    if (currentLobby) {
      // Get 8 random active prompts
      const allPrompts = await client.models.Prompt.list({
        filter: { isActive: { eq: true } }
      });
      console.log(allPrompts)
      if (allPrompts.data.length < 8) {
        alert("Not enough prompts available. Please contact administrator.");
        return;
      }

      // Randomly select 8 prompts
      const shuffledPrompts = [...allPrompts.data].sort(() => Math.random() - 0.5).slice(0, 8);
      
      // Create first round
      const firstRound = await client.models.Round.create({
        lobbyId: currentLobby.id,
        promptId: shuffledPrompts[0].id,
        roundNumber: 1,
        status: ROUND_STATUSES.ANSWERING
      });

      // Update lobby status and current round
      await client.models.Lobby.update({
        id: currentLobby.id,
        status: LOBBY_STATUSES.STARTED,
        currentRound: 1
      });

      // Store remaining prompts in localStorage for future rounds
      localStorage.setItem(`gamePrompts_${currentLobby.id}`, 
        JSON.stringify(shuffledPrompts.slice(1).map(p => p.id)));
    }
  }

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsNameEntered(true);
    }
  };

  if (!isNameEntered) {
    return (
      <main className="mobile-friendly">
        <h1>GENuineAI</h1>
        <h2>The game where friends come together to trick each other into thinking they aren't human</h2>
        <form onSubmit={handleNameSubmit} className="name-form">
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <button type="submit">Continue</button>
        </form>
      </main>
    );
  }

  if (!currentLobby) {
    return (
      <main className="mobile-friendly">
        <h1>Welcome, {username}!</h1>
        <div className="lobby-actions">
          <button className="create-lobby" onClick={createLobby}>Create New Lobby</button>
          <div className="join-section">
            <input
              type="text"
              placeholder="Enter Lobby Code"
              value={lobbyCode}
              onChange={(e) => setLobbyCode(e.target.value)}
              maxLength={6}
            />
            <button onClick={joinLobby}>Join Lobby</button>
          </div>
        </div>
      </main>
    );
  }

  const isHost = participants.find(p => p.userId === username)?.isHost;

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

  async function submitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (currentRound && userAnswer.trim()) {
      const currentParticipant = participants.find(p => p.userId === username);
      if (currentParticipant) {
        await client.models.Answer.create({
          roundId: currentRound.id,
          participantId: currentParticipant.id,
          text: userAnswer
        });
        setUserAnswer("");
      }
    }
  }

  async function submitVote(answerId: string) {
    if (currentRound) {
      // Increment votes for the answer
      const answer = answers.find(a => a.id === answerId);
      if (answer) {
        await client.models.Answer.update({
          id: answerId,
          votes: (answer.votes || 0) + 1
        });

        // Check if all votes are in (one per participant except answer author)
        const totalVotes = answers.reduce((sum, a) => sum + (a.votes || 0), 0);
        if (totalVotes === participants.length - 1) {
          // Find winning answer
          const winningAnswer = answers.reduce((prev, curr) => 
            (curr.votes || 0) > (prev.votes || 0) ? curr : prev
          );

          // Update winner's score
          const winner = participants.find(p => p.id === winningAnswer.participantId);
          if (winner) {
            await client.models.Participant.update({
              id: winner.id,
              score: (winner.score || 0) + 1
            });
          }

          // Move to next round or end game
          if (currentLobby?.currentRound && currentLobby.currentRound < 8) {
            const nextPromptIds = JSON.parse(localStorage.getItem(`gamePrompts_${currentLobby.id}`) || "[]");
            const nextPromptId = nextPromptIds[currentLobby.currentRound - 1];

            // Create next round
            await client.models.Round.create({
              lobbyId: currentLobby.id,
              promptId: nextPromptId,
              roundNumber: currentLobby.currentRound + 1,
              status: ROUND_STATUSES.ANSWERING
            });

            // Update lobby
            await client.models.Lobby.update({
              id: currentLobby?.id ?? "",
              currentRound: currentLobby.currentRound + 1
            });
          } else {
            // End game
            await client.models.Lobby.update({
              id: currentLobby?.id ?? "",
              status: LOBBY_STATUSES.COMPLETED
            });
          }
        }
      }
    }
  }

  return (
    <main className="mobile-friendly">
      <h1>Lobby: {currentLobby.code}</h1>
      {currentLobby.status === LOBBY_STATUSES.WAITING ? (
        <>
          <div className="participants-list">
            <h2>Participants:</h2>
            <ul>
              {participants.map((participant) => (
                <li key={participant.id}>
                  {participant.username} {participant.isHost ? '(Host)' : ''}
                </li>
              ))}
            </ul>
          </div>
          {isHost ? (
            <button 
              className="start-game"
              onClick={startGame}
            >
              Start Game
            </button>
          ) : (
            <div className="waiting-message">
              Waiting for host to start game...
            </div>
          )}
        </>
      ) : currentLobby.status === LOBBY_STATUSES.STARTED ? (
        <div className="game-interface">
          <div className="score-board">
            <h2>Scores:</h2>
            <ul>
              {participants.map((participant) => (
                <li key={participant.id}>
                  {participant.username}: {participant.score || 0}
                </li>
              ))}
            </ul>
          </div>
          <div className="round-info">
            <h2>Round {currentLobby.currentRound} of 8</h2>
            {currentPrompt && <h3>{currentPrompt.text}</h3>}
          </div>
          {currentRound?.status === ROUND_STATUSES.ANSWERING ? (
            <div className="answer-phase">
              {!answers.some(a => a.participantId === participants.find(p => p.userId === username)?.id) ? (
                <form onSubmit={submitAnswer}>
                  <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Your answer..."
                    required
                  />
                  <button type="submit">Submit Answer</button>
                </form>
              ) : (
                <div>Waiting for other players to answer...</div>
              )}
              <div>Answers submitted: {answers.length} / {participants.length}</div>
            </div>
          ) : (
            <div className="voting-phase">
              {answers.map((answer) => {
                const isOwnAnswer = answer.participantId === participants.find(p => p.userId === username)?.id;
                return (
                  <div key={answer.id} className="answer-card">
                    <p>{answer.text}</p>
                    {!isOwnAnswer && (
                      <button 
                        onClick={() => submitVote(answer.id)}
                        disabled={answers.reduce((sum, a) => sum + (a.votes || 0), 0) >= participants.length - 1}
                      >
                        Vote for this answer
                      </button>
                    )}
                    <span>Votes: {answer.votes || 0}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="game-over">
          <h2>Game Over!</h2>
          <div className="final-scores">
            <h3>Final Scores:</h3>
            <ul>
              {[...participants]
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .map((participant) => (
                  <li key={participant.id}>
                    {participant.username}: {participant.score || 0}
                  </li>
                ))
              }
            </ul>
          </div>
        </div>
      )}
      <button className="leave-lobby" onClick={leaveLobby}>
        Leave Lobby
      </button>
    </main>
  );
}
