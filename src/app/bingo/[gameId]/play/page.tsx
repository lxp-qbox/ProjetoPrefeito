
"use client";

import type { Game } from "@/types";
import { useState, useEffect } from "react";
import { ArrowLeft, Users, LayoutGrid, Clock, Trophy, ChevronDown } from "lucide-react";
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
  title: "Bingo Beneficente (90 Bolas)",
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

type BingoCell = number | null; // null represents a blank space for 90-ball
type BingoGrid = BingoCell[][]; // Represents the 3x9 card for 90-ball

const generateBingoCardData = (): BingoGrid => {
  const card: BingoGrid = Array(3).fill(null).map(() => Array(9).fill(null));
  const numbersOnCard = new Set<number>();

  // Helper to generate a unique random number for a specific column
  const getRandomNumberForColumn = (colIndex: number): number => {
    let num;
    let min, max_range_size;

    if (colIndex === 0) { // Col 1: 1-9
      min = 1; max_range_size = 9;
    } else if (colIndex === 8) { // Col 9: 80-90
      min = 80; max_range_size = 11;
    } else { // Cols 2-8: e.g. 10-19, 20-29, ...
      min = colIndex * 10; max_range_size = 10;
    }

    // Ensure the number is within the exact column decade for cols 1-8 (0-indexed)
    // For col 0: 1-9. For col 1: 10-19... For col 8: 80-90
    if (colIndex > 0 && colIndex < 8) { // Adjust min for standard decades 10-19, 20-29, etc.
        min = colIndex * 10; 
    }
    
    let attempts = 0;
    do {
      num = min + Math.floor(Math.random() * max_range_size);
      // Ensure 80-90 for last column (index 8)
      if (colIndex === 8 && num > 90) num = 80 + Math.floor(Math.random() * 11);
      // Ensure 1-9 for first column (index 0)
      if (colIndex === 0 && (num < 1 || num > 9)) num = 1 + Math.floor(Math.random()*9);

      attempts++;
      if (attempts > 50) throw new Error("Could not generate unique number for column."); // Failsafe
    } while (numbersOnCard.has(num));
    
    numbersOnCard.add(num);
    return num;
  };

  // Step 1: For each row, decide which 5 columns will have numbers.
  const cellsToFill: { r: number, c: number }[] = [];
  for (let r = 0; r < 3; r++) {
    const colsInThisRow = new Set<number>();
    while (colsInThisRow.size < 5) {
      colsInThisRow.add(Math.floor(Math.random() * 9));
    }
    Array.from(colsInThisRow).forEach(c => cellsToFill.push({ r, c }));
  }

  // Step 2: Assign numbers to these 15 chosen cells.
  const tempNumbers: { r: number, c: number, val: number }[] = [];
  cellsToFill.forEach(cell => {
    tempNumbers.push({ r: cell.r, c: cell.c, val: getRandomNumberForColumn(cell.c) });
  });

  // Step 3: Populate the card and sort numbers within each column.
  tempNumbers.forEach(item => {
    card[item.r][item.c] = item.val;
  });

  for (let c = 0; c < 9; c++) {
    const colValues: number[] = [];
    // Extract numbers from column
    for (let r = 0; r < 3; r++) {
      if (card[r][c] !== null) {
        colValues.push(card[r][c] as number);
        card[r][c] = null; // Clear for re-insertion
      }
    }
    colValues.sort((a, b) => a - b); // Sort them

    // Put sorted numbers back into the original cells that had numbers
    let valueIdx = 0;
    for (let r = 0; r < 3; r++) {
      // Check if this cell was originally chosen to have a number for this column
      const wasChosen = tempNumbers.some(item => item.r === r && item.c === c);
      if (wasChosen && valueIdx < colValues.length) {
        card[r][c] = colValues[valueIdx++];
      }
    }
  }
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
            <CardTitle className="text-xl font-semibold text-primary">Sua Cartela de Bingo (90 Bolas)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="grid grid-cols-9 gap-px bg-border border border-border rounded-md w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl overflow-x-auto p-1">
              {bingoCard.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`flex items-center justify-center h-10 sm:h-12 text-sm sm:text-base font-medium border-border 
                                ${colIndex < 8 ? 'border-r' : ''} ${rowIndex < 2 ? 'border-b' : ''}
                                ${ (rowIndex % 2 === colIndex % 2) ? 'bg-card' : 'bg-muted/50' }
                                ${ cell === null ? 'bg-background/30' : '' }`} // Style blank cells
                  >
                    {cell !== null ? cell : ""}
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

