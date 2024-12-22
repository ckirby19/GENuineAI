import { Schema } from "@/amplify/data/resource";
import { LobbyCreation } from "./LobbyCreation";
import { HomePage } from "./HomePage";
import { GAME_STATUSES, numberOfRounds } from "../model";
import { WaitingRoom } from "./WaitingRoom";
import { ScoresInfo } from "./ScoresInfo";
import { AnswerEntryPage } from "./AnswerEntryPage";
import { VotingPage } from "./VotingPage";
import { Dispatch, SetStateAction } from "react";
import { GameEnd } from "./GameEnd";

interface Props {
    username: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
    isNameEntered: boolean;
    setIsNameEntered: React.Dispatch<React.SetStateAction<boolean>>;
    lobbyCode: string;
    setLobbyCode: React.Dispatch<React.SetStateAction<string>>;
    currentLobby: Schema["Lobby"]["type"] | null
    setCurrentLobby: React.Dispatch<React.SetStateAction<Schema["Lobby"]["type"] | null>>;
    participants: Schema["Participant"]["type"][];
    isHost: boolean | null | undefined
    startGame: () => void;
    userAnswer: string;
    setUserAnswer: Dispatch<SetStateAction<string>>;
    answers: Schema["Answer"]["type"][];
    currentRound: Schema["Round"]["type"] | null;
    setCurrentRound: Dispatch<SetStateAction<Schema["Round"]["type"] | null>>;
    setCurrentPrompt: Dispatch<SetStateAction<Schema["Prompt"]["type"] | null>>;
    setAnswers: Dispatch<SetStateAction<Schema["Answer"]["type"][]>>;
    currentPrompt: Schema["Prompt"]["type"] | null;
    leaveLobby: () => void;
}

export const MainPage = (props: Props) => {
    if (!props.isNameEntered) {
        return (
          <HomePage 
            username={props.username}
            setUsername={props.setUsername}
            isNameEntered={props.isNameEntered}
            setIsNameEntered={props.setIsNameEntered}  
          />
        )
    } 

    if (!props.currentLobby) {
        return (
          <LobbyCreation
            username={props.username}
            setIsNameEntered={props.setIsNameEntered}
            lobbyCode={props.lobbyCode}
            setLobbyCode={props.setLobbyCode}
            currentLobby={props.currentLobby}
            setCurrentLobby={props.setCurrentLobby}
          />
        );
    }
    // Lobby has been created, now waiting for host to start game
    if (props.currentLobby.status === GAME_STATUSES.WAITING){
        console.log("Waiting for host to start game", props.participants)
        return (
        <WaitingRoom 
            username={props.username}
            participants={props.participants}
            currentLobby={props.currentLobby}
            isHost={props.isHost}
            startGame={props.startGame}
        />
        )
    }
    // The host has started the game, we now begin the game
    if (props.currentLobby.status === GAME_STATUSES.STARTED){
        return (
        <main className="mobile-friendly">
            <div className="game-interface">
            <ScoresInfo participants={props.participants} />
            <div className="round-info">
                <h2>Round {props.currentLobby.currentRound} of {numberOfRounds}</h2>
                {props.currentPrompt && <h3>{props.currentPrompt.text}</h3>}
            </div>
            {(props.answers.length != props.participants.length) ? 
                <AnswerEntryPage
                    username={props.username}
                    userAnswer={props.userAnswer}
                    setUserAnswer={props.setUserAnswer}
                    participants={props.participants}
                    answers={props.answers}
                    currentRound={props.currentRound}
                    setCurrentRound={props.setCurrentRound}
                    setCurrentPrompt={props.setCurrentPrompt}
                /> : 
                <VotingPage
                    username={props.username}
                    participants={props.participants}
                    answers={props.answers}
                    currentRound={props.currentRound}
                    currentLobby={props.currentLobby}
                    setCurrentPrompt={props.setCurrentPrompt}
                    setCurrentRound={props.setCurrentRound}
                    setAnswers={props.setAnswers}
                    setCurrentLobby={props.setCurrentLobby}
                />
            }
            </div>
        </main>
        )
    };

    if (props.currentLobby.status === GAME_STATUSES.COMPLETED){
    return (
      <GameEnd
        participants={props.participants}
        leaveLobby={props.leaveLobby} 
      />
    )
  }
}