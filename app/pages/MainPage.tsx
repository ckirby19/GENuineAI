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
    setUsername: Dispatch<SetStateAction<string>>;
    isNameEntered: boolean;
    setIsNameEntered: Dispatch<SetStateAction<boolean>>;
    lobbyCode: string;
    setLobbyCode: Dispatch<SetStateAction<string>>;
    currentLobby: Schema["Lobby"]["type"] | null
    participants: Schema["Participant"]["type"][];
    isHost: boolean | null | undefined
    userAnswer: string;
    setUserAnswer: Dispatch<SetStateAction<string>>;
    answers: Schema["Answer"]["type"][];
    currentRound: Schema["Round"]["type"] | null;
    currentPrompt: Schema["Prompt"]["type"] | null;
    currentVotes: Schema["Vote"]["type"][];
    startGame: () => void;
    createLobby: () => void;
    joinLobby: () => void;
    leaveLobby: () => void;
    transitionToScoring: () => void;
    transitionToVoting: () => void;
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
            lobbyCode={props.lobbyCode}
            setLobbyCode={props.setLobbyCode}
            createLobby={props.createLobby}
            joinLobby={props.joinLobby}
          />
        );
    }
    // Lobby has been created, waiting for users to join it
    if (props.currentLobby.status === GAME_STATUSES.WAITING){
        return (
        <WaitingRoom 
            username={props.username}
            participants={props.participants}
            currentLobby={props.currentLobby}
            isHost={props.isHost}
            startGame={props.startGame}
            leaveLobby={props.leaveLobby}
        />
        )
    }
    // The host has started the game
    if (props.currentLobby.status === GAME_STATUSES.STARTED){
        return (
        <div className="mobile-friendly">
            <div className="game-interface">
            <ScoresInfo 
              participants={props.participants} 
            />
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
                    currentLobby={props.currentLobby}
                    transitionToVoting={props.transitionToVoting}
                /> : 
                <VotingPage
                    username={props.username}
                    participants={props.participants}
                    answers={props.answers}
                    currentRound={props.currentRound}
                    currentVotes={props.currentVotes}
                    currentLobby={props.currentLobby}
                    transitionToScoring={props.transitionToScoring}
                />
            }
            </div>
        </div>
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