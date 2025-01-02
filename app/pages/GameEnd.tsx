import { Schema } from "@/amplify/data/resource";
import { ScoresInfo } from "./ScoresInfo";
import { Button } from "@/components/ui/button";

interface Props {
    participants: Schema["Participant"]["type"][];
    leaveLobby: () => void;
}

export const GameEnd = (props: Props) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <h2 className="text-xl">Scores:</h2>
        <ScoresInfo participants={props.participants} />
        <Button className="w-full neon-button" onClick={props.leaveLobby}>
            Leave Lobby
        </Button>
      </div>
      );
}
