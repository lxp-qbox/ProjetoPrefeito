
"use client";

import type { Game } from "@/types";
import { useState, useEffect } from "react";
import { ArrowLeft, Users, LayoutGrid, Clock, Trophy, ChevronDown, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Placeholder data for a single game
const gameData: Game = {
  id: "next-1",
  title: "Bingo Beneficente",
  startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
  status: "Aberta",
  participants: 24,
  generatedCards: 30,
  startTimeDisplay: "20:00",
  prize: "10K",
  countdownSeconds: 22, // Initial countdown
};

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

const StatItem: React.FC<StatItemProps> = ({ icon: Icon, label, value }) => (
  <div className="flex items-center space-x-3 p-3 bg-background rounded-lg shadow-sm">
    <div className="p-2 bg-primary/10 rounded-full">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-md">{value}</p>
    </div>
  </div>
);

type BingoCell = number | 'FREE';
type BingoGrid = BingoCell[][]; // Represents the 5x5 card, row by row

// Function to generate unique random numbers for a column
const generateColumnNumbers = (min: number, max: number, count: number): number[] => {
  const numbers = new Set<number>();
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(numbers).sort((a, b) => a - b); // Optional: sort numbers
};

const generateBingoCardData = (): BingoGrid => {
  const card: BingoGrid = Array(5).fill(null).map(() => Array(5).fill(0));
  const columns = {
    B: generateColumnNumbers(1, 15, 5),
    I: generateColumnNumbers(16, 30, 5),
    N: generateColumnNumbers(31, 45, 4), // 4 numbers for N, center is FREE
    G: generateColumnNumbers(46, 60, 5),
    O: generateColumnNumbers(61, 75, 5),
  };

  for (let row = 0; row < 5; row++) {
    card[row][0] = columns.B[row];
    card[row][1] = columns.I[row];
    if (row === 2) { // Center row
      card[row][2] = 'FREE';
      card[row][2] = columns.N[row < 2 ? row : row -1]; // place N numbers around FREE
    } else {
      card[row][2] = columns.N[row < 2 ? row : row -1];
    }
    card[row][3] = columns.G[row];
    card[row][4] = columns.O[row];
  }
   // Manually insert FREE space in the middle of N column (index 2)
  const nColNumbers = columns.N;
  card[0][2] = nColNumbers[0];
  card[1][2] = nColNumbers[1];
  card[2][2] = 'FREE';
  card[3][2] = nColNumbers[2];
  card[4][2] = nColNumbers[3];


  return card;
};


export default function BingoPlayPage({ params }: { params: { gameId: string } }) {
  const [game, setGame] = useState<Game>(gameData);
  const [countdown, setCountdown] = useState(game.countdownSeconds || 0);
  const [bingoCard, setBingoCard] = useState<BingoGrid | null>(null);
  const [cardGenerated, setCardGenerated] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleGetFreeCard = () => {
    const newCard = generateBingoCardData();
    setBingoCard(newCard);
    setCardGenerated(true);
  };

  const bingoLetters = ['B', 'I', 'N', 'G', 'O'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bingo">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-center flex-grow mr-8 sm:mr-0 truncate px-2">{game.title}</h1>
        <Badge variant={game.status === "Aberta" ? "default" : "secondary"} className="whitespace-nowrap">
          {game.status}
        </Badge>
      </div>

      {/* Game Information Card */}
      <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
        <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="bg-primary text-primary-foreground px-4 py-3 rounded-t-lg hover:no-underline hover:bg-primary/90 text-lg font-semibold flex justify-between items-center w-full">
                Informações da Partida
                <ChevronDown className="h-5 w-5 transition-transform duration-200 accordion-chevron" />
            </AccordionTrigger>
          <AccordionContent className="bg-card p-2 sm:p-4 rounded-b-lg shadow-md border border-t-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 mb-4">
              <StatItem icon={Users} label="Participantes" value={game.participants || 0} />
              <StatItem icon={LayoutGrid} label="Cartelas" value={`${game.generatedCards || 0} geradas`} />
              <StatItem icon={Clock} label="Início às" value={game.startTimeDisplay || "N/A"} />
              <StatItem icon={Trophy} label="Prêmio" value={game.prize || "N/A"} />
            </div>
            
            <div className="mt-4 p-4 bg-primary/5 rounded-lg flex items-center justify-between">
              <div>
                <p className="font-semibold text-primary">Contagem Regressiva</p>
                <p className="text-sm text-muted-foreground">
                  A partida poderá iniciar em {countdown > 0 ? `${countdown} segundo${countdown === 1 ? "" : "s"}` : "breve!"}
                </p>
              </div>
              <p className="text-5xl font-bold text-primary">{countdown > 0 ? countdown : "!"}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {!cardGenerated ? (
        <Card className="bg-muted/30 shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-semibold">Participe deste bingo!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
              Gere sua cartela grátis e participe deste bingo. Você poderá adquirir cartelas adicionais mais tarde.
            </p>
            <Button size="lg" className="w-full sm:w-auto" onClick={handleGetFreeCard}>Obter Cartela Grátis</Button>
          </CardContent>
        </Card>
      ) : bingoCard && (
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold text-primary">Sua Cartela de Bingo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="grid grid-cols-5 gap-1 mb-2 w-full max-w-sm">
              {bingoLetters.map((letter) => (
                <div key={letter} className="flex items-center justify-center h-10 bg-primary text-primary-foreground font-bold text-lg rounded-t-md">
                  {letter}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-px bg-border border border-border rounded-b-md w-full max-w-sm">
              {bingoCard.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`flex items-center justify-center h-14 sm:h-16 text-lg sm:text-xl font-medium border-border 
                                ${colIndex < 4 ? 'border-r' : ''} ${rowIndex < 4 ? 'border-b' : ''}
                                ${ (rowIndex % 2 === colIndex % 2) ? 'bg-card' : 'bg-muted/50' }
                                ${ cell === 'FREE' ? 'bg-accent text-accent-foreground' : '' }`}
                  >
                    {cell === 'FREE' ? <Star className="h-6 w-6" /> : cell}
                  </div>
                ))
              )}
            </div>
            <p className="text-muted-foreground mt-4 text-sm">Boa sorte!</p>
          </CardContent>
        </Card>
      )}
      <style jsx>{`
        .accordion-chevron {
            transition: transform 0.2s ease-in-out;
        }
        [data-state="open"] .accordion-chevron {
            transform: rotate(180deg);
        }
      `}</style>
    </div>
  );
}
