import { Schema } from "@/amplify/data/resource";
import { Card, CardContent } from "@/components/ui/card"

interface Props {
  participants: Schema["Participant"]["type"][];
}

export const ScoresInfo = (props: Props) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8 w-full max-w-4xl">
              {[...props.participants]
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .map((participant) => (
                  <Card className="bg-muted neon-border">
                    <CardContent>
                      {participant.username}: {participant.score || 0}
                    </CardContent>
                  </Card>
              ))}
          </div>
     </div>
      );
}
