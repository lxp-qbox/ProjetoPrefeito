
import type { Game } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, DollarSign, TicketIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const getStatusVariant = (status: Game['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Live':
        return 'destructive';
      case 'Upcoming':
        return 'default';
      case 'Ended':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        <Image 
            src={`https://placehold.co/600x400.png?text=${encodeURIComponent(game.title)}`} 
            alt={game.title} 
            data-ai-hint="bingo card"
            width={600} 
            height={400} 
            className="rounded-t-lg aspect-video object-cover" // Changed rounded-t-md to rounded-t-lg
        />
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm p-6">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-xl font-semibold">{game.title}</CardTitle> {/* Smaller title */}
          <Badge variant={getStatusVariant(game.status)} className="text-xs whitespace-nowrap mt-1">{game.status}</Badge>
        </div>
        {game.description && <CardDescription className="text-sm text-muted-foreground mb-3">{game.description}</CardDescription>}
        
        <div className="space-y-2">
            <div className="flex items-center text-muted-foreground">
              <CalendarDays className="mr-2 h-4 w-4 text-primary" />
              <span>Starts: {new Date(game.startTime).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              <span>Time: {new Date(game.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {game.prize && (
              <div className="flex items-center text-muted-foreground">
                <DollarSign className="mr-2 h-4 w-4 text-primary" />
                <span>Prize: {game.prize}</span>
              </div>
            )}
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/games/${game.id}`}> {/* Ensure this path exists or adjust as needed */}
            <TicketIcon className="mr-2 h-4 w-4" />
            {game.status === 'Live' ? 'Join Game' : 'View Details'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
