
import type { SuggestedUser } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const placeholderSuggestions: SuggestedUser[] = [
  { id: "user1", name: "Lidia", handle: "@LidiaConta", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "woman portrait" },
  { id: "user2", name: "Gleison🇪🇪", handle: "@gleisonsoarees", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "man avatar" },
  { id: "user3", name: "Emojipedia", handle: "@Emojipedia", avatarUrl: "https://placehold.co/40x40.png", dataAiHint: "emoji face" },
];

export function WhoToFollowWidget() {
  return (
    <Card className="bg-muted border-none rounded-xl">
      <CardHeader className="p-4">
        <CardTitle className="text-xl font-bold">Quem seguir</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {placeholderSuggestions.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-card/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint={user.dataAiHint || "user avatar"} />
                  <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm text-foreground hover:underline">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.handle}</p>
                </div>
              </div>
              <Button variant="default" className="rounded-full bg-foreground text-background hover:bg-foreground/90 h-8 px-4 text-xs font-semibold">
                Seguir
              </Button>
            </div>
          ))}
        </div>
        <div className="p-4">
            <Button variant="link" className="p-0 text-sm text-primary hover:no-underline hover:text-primary/80">Mostrar mais</Button>
        </div>
      </CardContent>
    </Card>
  );
}
