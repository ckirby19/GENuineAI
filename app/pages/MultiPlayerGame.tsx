import { Schema } from "@/amplify/data/resource";
import { LobbyCreation } from "./LobbyCreation";
import { HomePage } from "./HomePage";
import { GAME_STATUSES, GameType, ROUND_STATUSES } from "../model";
import { WaitingRoom } from "./WaitingRoom";
import { AnswerEntryPage } from "./AnswerEntryPage";
import { VotingPage } from "./VotingPage";
import { Dispatch, SetStateAction } from "react";
import { GameEnd } from "./GameEnd";
import { AnswerVoteRevealPage } from "./AnswerVoteRevealPage";

interface Props {
    username: string;
    setUsername: Dispatch<SetStateAction<string>>;
    isNameEntered: boolean;
    setIsNameEntered: Dispatch<SetStateAction<boolean>>;
    gameMode: GameType | null;
    setGameMode: Dispatch<SetStateAction<GameType | null>>
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
    createLobby: (numberOfAiModels: number) => void;
    joinLobby: () => void;
    leaveLobby: () => void;
    transitionToRound: (round: number) => void;
}

export const MultiPlayerGame = (props: Props) => {
    if (!props.isNameEntered) {
        return (
          <HomePage 
            username={props.username}
            setUsername={props.setUsername}
            isNameEntered={props.isNameEntered}
            setIsNameEntered={props.setIsNameEntered}  
            setGameMode={props.setGameMode}
            gameMode={props.gameMode}
            createLobby={props.createLobby}
          />
        ) 
    }

    if (!props.currentLobby) {
        return (
          <LobbyCreation
            username={props.username}
            lobbyCode={props.lobbyCode}
            setIsNameEntered={props.setIsNameEntered}  
            setLobbyCode={props.setLobbyCode}
            createLobby={props.createLobby}
            joinLobby={props.joinLobby}
          />
        );
    }

    if (props.currentLobby.status === GAME_STATUSES.WAITING){
        return (
          <WaitingRoom 
            username={props.username}
            participants={props.participants}
            currentLobby={props.currentLobby}
            isHost={props.isHost}
            startGame={props.startGame}
            leaveLobby={props.leaveLobby}
            gameMode={props.gameMode}
          />
        )
    }
    
    if (props.currentLobby.status === GAME_STATUSES.STARTED){
      if (props.currentRound?.status === ROUND_STATUSES.ANSWERING){
        return (
          <AnswerEntryPage
            username={props.username}
            userAnswer={props.userAnswer}
            setUserAnswer={props.setUserAnswer}
            participants={props.participants}
            answers={props.answers}
            currentRound={props.currentRound}
            currentLobby={props.currentLobby}
            currentPrompt={props.currentPrompt}
          />
        )
      }
      else if (props.currentRound?.status === ROUND_STATUSES.VOTING){
        return (
          <VotingPage
            username={props.username}
            participants={props.participants}
            answers={props.answers}
            currentRound={props.currentRound}
            currentVotes={props.currentVotes}
            currentLobby={props.currentLobby}
            currentPrompt={props.currentPrompt}
          />
        )
      }
      else if (props.currentRound?.status === ROUND_STATUSES.SCORING){
        return (
          <AnswerVoteRevealPage
            username={props.username}
            gameMode={props.gameMode}
            participants={props.participants}
            answers={props.answers}
            currentRound={props.currentRound}
            currentVotes={props.currentVotes}
            currentLobby={props.currentLobby}
            currentPrompt={props.currentPrompt}
            transitionToRound={props.transitionToRound}
          />
        )
      }
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