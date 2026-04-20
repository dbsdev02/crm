import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Award, Trophy, Medal } from "lucide-react";
import { api } from "@/lib/api";

const Credits = () => {
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["credits-leaderboard"],
    queryFn: () => api.get<any[]>("/credits/leaderboard"),
  });
  const rankIcons = [Trophy, Medal, Award];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Credits & Points</h1>
        <p className="text-muted-foreground">Staff performance leaderboard</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(leaderboard as any[]).slice(0, 3).map((member: any, idx: number) => {
          const Icon = rankIcons[idx] || Award;
          return (
            <Card key={member.user_id} className={idx === 0 ? "border-primary" : ""}>
              <CardContent className="pt-6 text-center space-y-3">
                <Icon className={`h-8 w-8 mx-auto ${idx === 0 ? "text-warning" : idx === 1 ? "text-muted-foreground" : "text-warning/60"}`} />
                <Avatar className="h-14 w-14 mx-auto">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {member.name?.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-2xl font-bold">{member.points} pts</p>
                  <p className="text-sm text-muted-foreground">{member.credits} credits</p>
                </div>
                <Button variant="outline" size="sm">Redeem Credits</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Full Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(leaderboard as any[]).map((member: any, idx: number) => (
              <div key={member.user_id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <span className="text-lg font-bold text-muted-foreground w-8">#{idx + 1}</span>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {member.name?.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1"><p className="text-sm font-medium">{member.name}</p></div>
                <Badge variant="secondary">{member.points} pts</Badge>
                <Badge variant="outline">{member.credits} credits</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Credits;
