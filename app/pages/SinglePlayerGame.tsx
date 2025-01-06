import { HomePage } from "./HomePage";
import { GAME_STATUSES, GameType, ROUND_STATUSES } from "../model";
import { Dispatch, SetStateAction } from "react";
import { Schema } from "@/amplify/data/resource";
import { WaitingRoom } from "./WaitingRoom";
import { assert } from "console";
import { AnswerEntryPage } from "./AnswerEntryPage";
import { GameEnd } from "./GameEnd";
import { AnswerVoteRevealPage } from "./AnswerVoteRevealPage";
import { VotingPageAi } from "./VotingPageAi";

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
  transitionToSinglePlayerScoring: () => Promise<void>
}

export const SinglePlayerGame = (props: Props) => {
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

    if (props.currentLobby && props.currentLobby.status === GAME_STATUSES.WAITING){
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

    // No need to go to lobby creation screen, just:
    // Create all the prompts and rounds, 3 AI models, and start the game
    // Have the answer entry for the user
    // Once user adds their answer, we prompt all AI models to choose (New UI instead of voting page)
    // Show results
    if (props.currentLobby && props.currentLobby.status === GAME_STATUSES.STARTED){
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
          <VotingPageAi
            username={props.username}
            participants={props.participants}
            answers={props.answers}
            currentRound={props.currentRound}
            currentVotes={props.currentVotes}
            currentLobby={props.currentLobby}
            currentPrompt={props.currentPrompt}
            transitionToSinglePlayerScoring={props.transitionToSinglePlayerScoring}
          />
        )
      }
      else if (props.currentRound?.status === ROUND_STATUSES.SCORING){
        return (
          <AnswerVoteRevealPage
            username={props.username}
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

    if (props.currentLobby && props.currentLobby.status === GAME_STATUSES.COMPLETED){
      return (
        <GameEnd
          participants={props.participants}
          leaveLobby={props.leaveLobby} 
        />
      )
    }
}