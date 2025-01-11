import { Schema } from "@/amplify/data/resource";
import { ROUND_STATUSES } from "../../model";
import { AnswerEntryPage } from "./AnswerEntryPage";
import { VotingPage } from "./VotingPage";
import { Dispatch, SetStateAction } from "react";
import { AnswerVoteRevealPage } from "../AnswerVoteRevealPage";

interface Props {
    username: string;
    currentLobby: Schema["Lobby"]["type"]
    participants: Schema["Participant"]["type"][];
    userAnswer: string;
    setUserAnswer: Dispatch<SetStateAction<string>>;
    answers: Schema["Answer"]["type"][];
    currentRound: Schema["Round"]["type"] | null;
    currentPrompt: Schema["Prompt"]["type"] | null;
    currentVotes: Schema["Vote"]["type"][];
    transitionToRound: (round: number) => void;
}

export const TextGame = (props: Props) => {
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
}