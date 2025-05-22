
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Control } from "react-hook-form";
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Star, User, UserCog, XCircle, Database, Link as LinkIcon, RefreshCw, ServerOff,
  FileText, Info, Headphones, LogOut, ChevronRight, Ticket as TicketIcon, Globe, Bell,
  ListChecks, Settings as SettingsIconLucide, PlusCircle, BarChart3, AlertTriangle,
  LayoutGrid, Trophy, Dice5, PlaySquare, FileJson, ShieldQuestion, Trash2, Gift, DollarSign, Save, CircleAlert, Grid2X2, Grid3X3, Zap, Calendar as CalendarIconLucide, Edit2,
  UploadCloud, Music2, ImageIcon as ImageIconLucide, Volume2, Music3, PlayCircleIcon, PauseCircleIcon, ArrowUpDown
} from 'lucide-react';
import NextImage from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import type { GeneratedBingoCard, BingoPrize, Game, AudioSetting, BingoBallSetting, UserProfile } from '@/types';
import { format, parse, setHours, setMinutes, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription as FormDesc, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  db,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  getDocs,
  getDoc,
  serverTimestamp,
  storage,
  storageRef,
  uploadBytesResumable,
  getDownloadURL,
  Timestamp,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  deleteFileStorage,
  deleteField,
  writeBatch,
} from "@/lib/firebase";
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Checkbox } from '@/components/ui/checkbox';


interface BingoAdminMenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  link?: string;
  action?: () => void;
}

interface BingoAdminMenuGroup {
  groupTitle?: string;
  items: BingoAdminMenuItem[];
  isBottomSection?: boolean;
}

const initialGameEventAudioSettings: Omit<AudioSetting, 'audioUrl' | 'fileName' | 'storagePath' | 'uploadedAt' | 'keyword' | 'associatedGiftId' | 'associatedGiftName' | 'createdBy'>[] = [
  { id: 'audioInicioPartida', type: 'gameEvent', eventName: 'Início da Partida', displayName: 'Início da Partida' },
  { id: 'audioPausada', type: 'gameEvent', eventName: 'Partida Pausada', displayName: 'Partida Pausada' },
  { id: 'audioContinuando', type: 'gameEvent', eventName: 'Partida Continuando', displayName: 'Partida Continuando' },
  { id: 'audioVencedor', type: 'gameEvent', eventName: 'Temos um Vencedor!', displayName: 'Temos um Vencedor!' },
  { id: 'audioFimPartida', type: 'gameEvent', eventName: 'Fim da Partida', displayName: 'Fim da Partida' },
];

const format90BallCardNumbersPreview = (numbers: (number | null)[][]): string => {
  if (!numbers || numbers.length === 0) return 'N/A';
  const firstRowNumbers = numbers[0]?.filter(n => n !== null).slice(0, 3).join(', ');
  return firstRowNumbers ? `${firstRowNumbers}...` : 'N/A';
};

const format75BallCardNumbersPreview = (numbers: (number | null)[][]): string => {
  if (!numbers || numbers.length === 0) return 'N/A';
  const firstRowPreview = numbers[0]?.filter(n => n !== null).slice(0,3).join(', ');
  return firstRowPreview ? `${firstRowPreview}...` : 'N/A';
};

const newKakoPrizeSchema = z.object({
  name: z.string().min(1, "Nome do prêmio é obrigatório."),
  imageUrl: z.string().url({ message: "URL da imagem inválida." }).optional().or(z.literal('')),
  imageFile: z.instanceof(FileList).optional().nullable()
    .refine(files => !files || files.length <= 1, "Apenas um arquivo de imagem é permitido.")
    .refine(files => !files || !files?.[0] || files?.[0]?.size <= 2 * 1024 * 1024, "Imagem muito grande (máx 2MB).")
    .refine(files => !files || !files?.[0] || files?.[0]?.type.startsWith("image/"), "O arquivo deve ser uma imagem."),
  kakoGiftId: z.string().optional(),
  valueDisplay: z.string().optional(),
  description: z.string().max(200, "Descrição muito longa (máx. 200 caracteres).").optional(),
});
type NewKakoPrizeFormValues = z.infer<typeof newKakoPrizeSchema>;

const newGameSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres.").max(100, "Título muito longo (máx. 100 caracteres)."),
  bingoType: z.enum(['75-ball', '90-ball'], { required_error: "Selecione o tipo de bingo." }),
  cardPrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? 0 : parseFloat(String(val)),
    z.number({ invalid_type_error: "Preço deve ser um número" }).min(0, "Preço deve ser zero ou maior.").optional().default(0)
  ),
  prizeType: z.enum(['kako_virtual', 'cash', 'other'], { required_error: "Selecione o tipo de prêmio."}),
  prizeKakoVirtualId: z.string().optional(),
  prizeCashAmount: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : parseFloat(String(val)),
    z.number({ invalid_type_error: "Valor deve ser um número" }).min(0, "Valor deve ser positivo.").optional()
  ),
  prizeDescription: z.string().min(1, "Descrição do prêmio é obrigatória.").max(250, "Descrição muito longa (máx. 250 caracteres)."),
  startTimeDate: z.date({ required_error: "Data de início é obrigatória." }),
  startTimeString: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Hora inválida. Use HH:MM.").min(1, "Hora de início é obrigatória."),
  notes: z.string().max(500, "Notas muito longas (máx. 500 caracteres).").optional(),
}).superRefine((data, ctx) => {
  if (data.prizeType === 'kako_virtual' && !data.prizeKakoVirtualId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Selecione um prêmio virtual Kako.",
      path: ['prizeKakoVirtualId'],
    });
  }
  if (data.prizeType === 'cash' && (data.prizeCashAmount === undefined || data.prizeCashAmount < 0) && !data.prizeDescription) {
     ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe o valor do prêmio em dinheiro ou uma descrição.",
      path: ['prizeCashAmount'],
    });
  }
   if (data.prizeType === 'other' && !data.prizeDescription) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Descrição é obrigatória para prêmios do tipo 'Outro'.",
      path: ['prizeDescription'],
    });
  }
});
type NewGameFormValues = z.infer<typeof newGameSchema>;

const interactionAudioSchema = z.object({
  displayName: z.string().min(1, "Nome do áudio é obrigatório.").max(50, "Nome muito longo."),
  keyword: z.string().min(1, "Palavra chave é obrigatória.").max(30, "Palavra chave muito longa."),
  associatedGiftId: z.string().optional(),
  audioFile: z.instanceof(FileList).refine(files => files?.length === 1, "Um arquivo de áudio é obrigatório.")
                 .refine(files => files?.[0]?.size <= 2 * 1024 * 1024, "Áudio muito grande (máx 2MB).")
                 .refine(files => files?.[0]?.type.startsWith("audio/"), "O arquivo deve ser um áudio."),
});
type InteractionAudioFormValues = z.infer<typeof interactionAudioSchema>;

const ballAssetSchema = z.object({
    assetFile: z.instanceof(FileList).refine(files => files?.length === 1, "Um arquivo é obrigatório.")
                   .refine(files => !files?.[0] || files?.[0]?.size <= 2 * 1024 * 1024, "Arquivo muito grande (máx 2MB).")
                   .refine(files => !files?.[0] || (files?.[0]?.type.startsWith("image/") || files?.[0]?.type.startsWith("audio/")), "O arquivo deve ser uma imagem ou áudio."),
});
type BallAssetFormValues = z.infer<typeof ballAssetSchema>;


// Helper function to generate a single 90-ball card
const generateSingle90BallCardNumbers = (): (number | null)[][] => {
  const card: (number | null)[][] = Array(3).fill(null).map(() => Array(9).fill(null));
  const numbersOnCard = new Set<number>(); // Tracks numbers for THIS card

  const getRandomNumberForColumn = (colIndex: number): number => {
    let num;
    let min, max_range_size;
    if (colIndex === 0) { min = 1; max_range_size = 9; } // 1-9
    else if (colIndex === 8) { min = 80; max_range_size = 11; } // 80-90
    else { min = colIndex * 10; max_range_size = 10; } // e.g., 10-19 for col 1, 20-29 for col 2

    let attempts = 0;
    do {
      num = min + Math.floor(Math.random() * max_range_size);
      attempts++;
      if (attempts > 100) { // Increased safeguard, though should rarely be hit
        console.warn(`High attempts for col ${colIndex}, min ${min}, range ${max_range_size}, current numbers:`, Array.from(numbersOnCard));
        // This indicates a potential issue with logic if it happens frequently
        throw new Error(`Could not generate unique number for column ${colIndex} after 100 attempts.`);
      }
    } while (numbersOnCard.has(num));

    numbersOnCard.add(num);
    return num;
  };

  // Determine 5 cells to fill in each row
  const cellsToFill: { r: number, c: number }[] = [];
  for (let r = 0; r < 3; r++) {
    const colsInThisRow = new Set<number>();
    while (colsInThisRow.size < 5) {
      colsInThisRow.add(Math.floor(Math.random() * 9));
    }
    Array.from(colsInThisRow).forEach(c => cellsToFill.push({ r, c }));
  }

  // Place numbers in determined cells, ensuring column constraints
  const tempNumbers: { r: number, c: number, val: number }[] = [];
  cellsToFill.forEach(cell => {
    tempNumbers.push({ r: cell.r, c: cell.c, val: getRandomNumberForColumn(cell.c) });
  });

  // Put numbers onto the card based on tempNumbers
  tempNumbers.forEach(item => {
    card[item.r][item.c] = item.val;
  });

  // Sort numbers within each column
  for (let c = 0; c < 9; c++) {
    const colValues: number[] = [];
    for (let r = 0; r < 3; r++) {
      if (card[r][c] !== null) {
        colValues.push(card[r][c] as number);
        card[r][c] = null; // Clear for re-population after sort
      }
    }
    colValues.sort((a, b) => a - b);

    let valueIdx = 0;
    for (let r = 0; r < 3; r++) {
      const wasChosen = tempNumbers.some(item => item.r === r && item.c === c);
      if (wasChosen && valueIdx < colValues.length) {
        card[r][c] = colValues[valueIdx++];
      }
    }
  }
  return card;
};


export default function AdminBingoAdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);
  const ballAssetFileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<string>('bingoPartidas');

  const [generated90BallCards, setGenerated90BallCards] = useState<GeneratedBingoCard[]>([]);
  const [isLoading90BallCards, setIsLoading90BallCards] = useState(true);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [cardsToGenerateCount, setCardsToGenerateCount] = useState<string>("100");

  const [generated75BallCards, setGenerated75BallCards] = useState<GeneratedBingoCard[]>([]);
  const [isLoading75BallCards, setIsLoading75BallCards] = useState(true);

  const [selectedCardForDetails, setSelectedCardForDetails] = useState<GeneratedBingoCard | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmDeleteAll90BallCardsDialogOpen, setIsConfirmDeleteAll90BallCardsDialogOpen] = useState(false);
  const [isConfirmDeleteAll75BallCardsDialogOpen, setIsConfirmDeleteAll75BallCardsDialogOpen] = useState(false);
  const [isDeleting90BallCards, setIsDeleting90BallCards] = useState(false);
  const [isDeleting75BallCards, setIsDeleting75BallCards] = useState(false);


  const [kakoPrizes, setKakoPrizes] = useState<BingoPrize[]>([]);
  const [isLoadingKakoPrizes, setIsLoadingKakoPrizes] = useState(true);
  const [isAddKakoPrizeDialogOpen, setIsAddKakoPrizeDialogOpen] = useState(false);
  const [prizeImageUploadProgress, setPrizeImageUploadProgress] = useState<number | null>(null);

  const [bingoGames, setBingoGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isCreateGameDialogOpen, setIsCreateGameDialogOpen] = useState(false);
  const [availableKakoPrizesForGameForm, setAvailableKakoPrizesForGameForm] = useState<BingoPrize[]>([]);
  const [isLoadingKakoPrizesForGameForm, setIsLoadingKakoPrizesForGameForm] = useState(false);

  const [gameEventAudioSettings, setGameEventAudioSettings] = useState<AudioSetting[]>(
    initialGameEventAudioSettings.map(s => ({ ...s, type: 'gameEvent', eventName: s.displayName } as AudioSetting))
  );
  const [interactionAudioSettings, setInteractionAudioSettings] = useState<AudioSetting[]>([]);
  const [isLoadingAudios, setIsLoadingAudios] = useState(false);
  const [isUploadAudioDialogOpen, setIsUploadAudioDialogOpen] = useState(false);
  const [currentAudioSettingToEdit, setCurrentAudioSettingToEdit] = useState<AudioSetting | null>(null);
  const [isAddInteractionAudioDialogOpen, setIsAddInteractionAudioDialogOpen] = useState(false);

  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [audioUploadProgress, setAudioUploadProgress] = useState<number | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const [bingoBallSettings, setBingoBallSettings] = useState<BingoBallSetting[]>(
    Array.from({ length: 90 }, (_, i) => ({ ballNumber: i + 1 }))
  );
  const [isLoadingBallSettings, setIsLoadingBallSettings] = useState(false);
  const [isUploadBallAssetDialogOpen, setIsUploadBallAssetDialogOpen] = useState(false);
  const [currentBallEditing, setCurrentBallEditing] = useState<BingoBallSetting | null>(null);
  const [assetTypeToUpload, setAssetTypeToUpload] = useState<'image' | 'audio' | null>(null);
  const [selectedBallAssetFile, setSelectedBallAssetFile] = useState<File | null>(null);
  const [ballAssetUploadProgress, setBallAssetUploadProgress] = useState<number | null>(null);
  const [isUploadingBallAsset, setIsUploadingBallAsset] = useState(false);

  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [currentPlayingAudioId, setCurrentPlayingAudioId] = useState<string | null>(null);

  const playAudio = (audioUrl?: string, audioId?: string) => {
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
      if (currentPlayingAudioId === audioId && audioId) {
        setCurrentPlayingAudioId(null);
        return;
      }
    }
    if (audioUrl && audioId) {
      const newPlayer = audioPlayer || new Audio();
      newPlayer.src = audioUrl;
      newPlayer.play().catch(e => console.error("Error playing audio:", e));
      setAudioPlayer(newPlayer);
      setCurrentPlayingAudioId(audioId);

      const onEndOrPause = () => {
        if (newPlayer.paused || newPlayer.ended) {
             if (currentPlayingAudioId === audioId) {
                setCurrentPlayingAudioId(null);
             }
        }
        newPlayer.removeEventListener('ended', onEndOrPause);
        newPlayer.removeEventListener('pause', onEndOrPause);
      };
      newPlayer.addEventListener('ended', onEndOrPause);
      newPlayer.addEventListener('pause', onEndOrPause);
    }
  };

  useEffect(() => {
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
      }
    };
  }, [audioPlayer]);


  const bingoSpecificMenuGroups: BingoAdminMenuGroup[] = [
    {
      groupTitle: "GERENCIAMENTO DE JOGOS",
      items: [
        { id: "bingoPartidas", title: "Partidas", icon: ListChecks, link: "#bingoPartidas" },
        { id: "bingoGanhadores", title: "Ganhadores", icon: Trophy, link: "#bingoGanhadores" },
        { id: "bingoBolasSorteadas", title: "Bolas Sorteadas", icon: Dice5, link: "#bingoBolasSorteadas" },
        { id: "bingoTelaSorteio", title: "Tela de Sorteio", icon: PlaySquare, link: "#bingoTelaSorteio" },
      ],
    },
    {
      groupTitle: "CARTELAS",
      items: [
        { id: "bingoCartelas75", title: "Cartelas Bingo 75", icon: LayoutGrid, link: "#bingoCartelas75" },
        { id: "bingoCartelas90", title: "Cartelas Bingo 90", icon: LayoutGrid, link: "#bingoCartelas90" },
      ],
    },
    {
      groupTitle: "PREMIOS",
      items: [
        { id: "bingoPremiosKako", title: "Prêmios Kako Live", icon: Gift, link: "#bingoPremiosKako" },
        { id: "bingoPremiosDinheiro", title: "Prêmios em Dinheiro", icon: DollarSign, link: "#bingoPremiosDinheiro" },
      ],
    },
    {
      groupTitle: "CONFIGURAÇÕES",
      items: [
        { id: "bingoBolasConfig", title: "Bolas do Bingo", icon: SettingsIconLucide, link: "#bingoBolasConfig" },
        { id: "bingoAudiosPartida", title: "Áudios da Partida", icon: Volume2, link: "#bingoAudiosPartida" },
        { id: "bingoAudiosInteracao", title: "Áudios de Interação", icon: Music3, link: "#bingoAudiosInteracao" },
      ],
    }
  ];

  const gameForm = useForm<NewGameFormValues>({
    resolver: zodResolver(newGameSchema),
    defaultValues: {
      title: "",
      bingoType: undefined,
      cardPrice: 0,
      prizeType: undefined,
      prizeKakoVirtualId: "",
      prizeCashAmount: undefined,
      prizeDescription: "",
      startTimeDate: undefined,
      startTimeString: "00:00",
      notes: "",
    },
  });
  const watchedPrizeType = gameForm.watch("prizeType");

  const kakoPrizeForm = useForm<NewKakoPrizeFormValues>({
    resolver: zodResolver(newKakoPrizeSchema),
    defaultValues: {
      name: "",
      imageUrl: "",
      imageFile: null,
      kakoGiftId: "",
      valueDisplay: "",
      description: "",
    },
  });

  const interactionAudioForm = useForm<InteractionAudioFormValues>({
    resolver: zodResolver(interactionAudioSchema),
    defaultValues: {
      displayName: "",
      keyword: "",
      associatedGiftId: "",
      audioFile: undefined,
    },
  });

  const ballAssetForm = useForm<BallAssetFormValues>({
      resolver: zodResolver(ballAssetSchema),
      defaultValues: {
          assetFile: undefined,
      },
  });

  const fetchGenerated90BallCards = useCallback(async () => {
    setIsLoading90BallCards(true);
    try {
      const cardsCollectionRef = collection(db, "bingoGeneratedCards90");
      const q = query(cardsCollectionRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedCards: GeneratedBingoCard[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedCards.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          usageHistory: (data.usageHistory || []).map((uh: any) => ({ ...uh, timestamp: uh.timestamp instanceof Timestamp ? uh.timestamp.toDate() : new Date(uh.timestamp) })),
          awardsHistory: (data.awardsHistory || []).map((ah: any) => ({ ...ah, timestamp: ah.timestamp instanceof Timestamp ? ah.timestamp.toDate() : new Date(ah.timestamp) })),
        } as GeneratedBingoCard);
      });
      setGenerated90BallCards(fetchedCards);
    } catch (error) {
      console.error("Erro ao buscar cartelas de 90 bolas:", error);
      toast({ title: "Erro ao Carregar Cartelas (90)", description: "Não foi possível carregar a lista de cartelas.", variant: "destructive" });
    } finally {
      setIsLoading90BallCards(false);
    }
  }, [toast]);

  const fetchGenerated75BallCards = useCallback(async () => {
    setIsLoading75BallCards(true);
    try {
      const cardsCollectionRef = collection(db, "bingoGeneratedCards75");
      const q = query(cardsCollectionRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedCards: GeneratedBingoCard[] = [];
      querySnapshot.forEach((docSnap) => {
         const data = docSnap.data();
        fetchedCards.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          usageHistory: (data.usageHistory || []).map((uh: any) => ({ ...uh, timestamp: uh.timestamp instanceof Timestamp ? uh.timestamp.toDate() : new Date(uh.timestamp) })),
          awardsHistory: (data.awardsHistory || []).map((ah: any) => ({ ...ah, timestamp: ah.timestamp instanceof Timestamp ? ah.timestamp.toDate() : new Date(ah.timestamp) })),
        } as GeneratedBingoCard);
      });
      setGenerated75BallCards(fetchedCards);
    } catch (error) {
      console.error("Erro ao buscar cartelas de 75 bolas:", error);
      toast({ title: "Erro ao Carregar Cartelas (75)", description: "Não foi possível carregar a lista de cartelas.", variant: "destructive" });
    } finally {
      setIsLoading75BallCards(false);
    }
  }, [toast]);


  const fetchKakoPrizes = useCallback(async (forGameForm: boolean = false) => {
    if (forGameForm) setIsLoadingKakoPrizesForGameForm(true);
    else setIsLoadingKakoPrizes(true);

    try {
      const prizesCollectionRef = collection(db, "bingoPrizes");
      const q = query(prizesCollectionRef, where("type", "==", "kako_virtual"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedPrizes: BingoPrize[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedPrizes.push({ id: docSnap.id, ...docSnap.data() } as BingoPrize);
      });
      if (forGameForm) setAvailableKakoPrizesForGameForm(fetchedPrizes);
      else setKakoPrizes(fetchedPrizes);
    } catch (error) {
      console.error("Erro ao buscar prêmios Kako Live:", error);
      toast({ title: "Erro ao Carregar Prêmios", description: "Não foi possível carregar a lista de prêmios.", variant: "destructive" });
    } finally {
      if (forGameForm) setIsLoadingKakoPrizesForGameForm(false);
      else setIsLoadingKakoPrizes(false);
    }
  }, [toast]);

  const fetchBingoGames = useCallback(async () => {
    setIsLoadingGames(true);
    try {
      const gamesCollectionRef = collection(db, "bingoGames");
      const q = query(gamesCollectionRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedGames: Game[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedGames.push({
          id: docSnap.id,
          ...data,
          startTime: data.startTime instanceof Timestamp ? data.startTime.toDate() : new Date(data.startTime),
           createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
        } as Game);
      });
      setBingoGames(fetchedGames);
    } catch (error) {
      console.error("Erro ao buscar partidas de bingo:", error);
      toast({ title: "Erro ao Carregar Partidas", description: "Não foi possível carregar a lista de partidas.", variant: "destructive" });
    } finally {
      setIsLoadingGames(false);
    }
  }, [toast]);

  const fetchGameEventAudios = useCallback(async () => {
    setIsLoadingAudios(true);
    const settingsPromises = initialGameEventAudioSettings.map(async (initialSetting) => {
      const docRef = doc(db, "bingoAudioSettings", initialSetting.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...initialSetting, ...docSnap.data(), type: 'gameEvent' } as AudioSetting;
      }
      return { ...initialSetting, type: 'gameEvent' } as AudioSetting;
    });
    try {
      const fetchedSettings = await Promise.all(settingsPromises);
      setGameEventAudioSettings(fetchedSettings);
    } catch (error) {
      console.error("Erro ao buscar áudios de eventos:", error);
      toast({ title: "Erro ao Carregar Áudios", description: "Não foi possível buscar os áudios dos eventos.", variant: "destructive" });
    } finally {
      setIsLoadingAudios(false);
    }
  }, [toast]);

  const fetchInteractionAudios = useCallback(async () => {
    setIsLoadingAudios(true);
    try {
      const audiosCollectionRef = collection(db, "bingoInteractionAudios");
      const q = query(audiosCollectionRef, orderBy("uploadedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedAudios: AudioSetting[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let associatedGiftName = "";
        if (data.associatedGiftId) {
            const prize = kakoPrizes.find(p => p.id === data.associatedGiftId) || availableKakoPrizesForGameForm.find(p => p.id === data.associatedGiftId);
            if (prize) associatedGiftName = prize.name;
        }
        fetchedAudios.push({
            id: docSnap.id,
            ...data,
            type: 'interaction',
            associatedGiftName: associatedGiftName || undefined,
             uploadedAt: data.uploadedAt instanceof Timestamp ? data.uploadedAt.toDate() : new Date(data.uploadedAt),
        } as AudioSetting);
      });
      setInteractionAudioSettings(fetchedAudios);
    } catch (error) {
      console.error("Erro ao buscar áudios de interação:", error);
      toast({ title: "Erro ao Carregar Áudios", description: "Não foi possível buscar os áudios de interação.", variant: "destructive" });
    } finally {
      setIsLoadingAudios(false);
    }
  }, [toast, kakoPrizes, availableKakoPrizesForGameForm]);

  const fetchBingoBallSettings = useCallback(async () => {
    setIsLoadingBallSettings(true);
    const settingsPromises = Array.from({ length: 90 }, (_, i) => i + 1).map(async (ballNum) => {
        const docRef = doc(db, "bingoBallConfigurations", ballNum.toString());
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
             const data = docSnap.data();
            return {
                ballNumber: ballNum,
                ...data,
                lastUpdatedAt: data.lastUpdatedAt instanceof Timestamp ? data.lastUpdatedAt.toDate() : new Date(data.lastUpdatedAt)
            } as BingoBallSetting;
        }
        return { ballNumber: ballNum } as BingoBallSetting;
    });
    try {
        const fetchedSettings = await Promise.all(settingsPromises);
        setBingoBallSettings(fetchedSettings);
    } catch (error) {
        console.error("Erro ao buscar configurações das bolas:", error);
        toast({ title: "Erro ao Carregar Bolas", description: "Não foi possível buscar as configurações das bolas.", variant: "destructive" });
    } finally {
        setIsLoadingBallSettings(false);
    }
  }, [toast]);

  useEffect(() => {
    if (activeTab === 'bingoPremiosKako' || activeTab === 'bingoAudiosInteracao') {
      fetchKakoPrizes(false);
    }
    if (activeTab === 'bingoPartidas' || activeTab === 'bingoAudiosInteracao') {
      fetchKakoPrizes(true);
    }
    if (activeTab === 'bingoPartidas') fetchBingoGames();
    if (activeTab === 'bingoCartelas90') fetchGenerated90BallCards();
    if (activeTab === 'bingoCartelas75') fetchGenerated75BallCards();
    if (activeTab === 'bingoAudiosPartida') fetchGameEventAudios();
    if (activeTab === 'bingoAudiosInteracao') fetchInteractionAudios();
    if (activeTab === 'bingoBolasConfig') fetchBingoBallSettings();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleGenerateCards = async (count: number) => {
    if (!currentUser?.uid) {
      toast({ title: "Erro de Autenticação", description: "Você precisa estar logado.", variant: "destructive" });
      return;
    }
    setIsGeneratingCards(true);
    try {
      const cardsCollectionRef = collection(db, "bingoGeneratedCards90");
      let currentBatch = writeBatch(db);
      let operationsInBatch = 0;
      console.log(`Iniciando geração de ${count} cartelas.`);

      for (let i = 0; i < count; i++) {
        const cardNumbers = generateSingle90BallCardNumbers();
        console.log(`Cartela ${i + 1} gerada:`, cardNumbers);
        const newCardRef = doc(cardsCollectionRef); // Auto-generate ID for Firestore
        const newCardData: Omit<GeneratedBingoCard, 'id'> = {
          cardNumbers,
          creatorId: currentUser.uid,
          createdAt: serverTimestamp(),
          usageHistory: [],
          timesAwarded: 0,
          awardsHistory: [],
        };
        currentBatch.set(newCardRef, newCardData);
        operationsInBatch++;

        if (operationsInBatch >= 499) { // Firestore batch limit is 500 operations
          console.log(`Commitando batch com ${operationsInBatch} operações.`);
          await currentBatch.commit();
          console.log("Batch commitado com sucesso.");
          currentBatch = writeBatch(db);
          operationsInBatch = 0;
        }
      }
      if (operationsInBatch > 0) {
        console.log(`Commitando batch final com ${operationsInBatch} operações.`);
        await currentBatch.commit();
        console.log("Batch final commitado com sucesso.");
      }

      toast({ title: "Cartelas Geradas!", description: `${count} novas cartelas de 90 bolas foram geradas e salvas no banco de dados.` });
      fetchGenerated90BallCards(); // Refresh the list from DB
    } catch (error) {
      console.error("Erro ao gerar cartelas:", error);
      toast({ title: "Erro ao Gerar Cartelas", description: `Não foi possível gerar as cartelas. Erro: ${error instanceof Error ? error.message : String(error)}`, variant: "destructive" });
    } finally {
      setIsGeneratingCards(false);
    }
  };


  const handleAudioFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
        if (event.target.files[0].size > 2 * 1024 * 1024) {
            toast({ title: "Arquivo Muito Grande", description: "O arquivo de áudio deve ter no máximo 2MB.", variant: "destructive" });
            setSelectedAudioFile(null);
            if (audioFileInputRef.current) audioFileInputRef.current.value = "";
            return;
        }
        setSelectedAudioFile(event.target.files[0]);
    } else {
        setSelectedAudioFile(null);
    }
  };

  const handleOpenUploadAudioDialog = (setting: AudioSetting | null, isNewInteraction: boolean = false) => {
    interactionAudioForm.reset({ displayName: "", keyword: "", associatedGiftId: "", audioFile: undefined });
    setSelectedAudioFile(null);
    if (audioFileInputRef.current) audioFileInputRef.current.value = "";

    if (isNewInteraction) {
        setCurrentAudioSettingToEdit(null);
        setIsAddInteractionAudioDialogOpen(true);
        setIsUploadAudioDialogOpen(false);
    } else {
        setCurrentAudioSettingToEdit(setting);
        if(setting?.type === 'interaction') {
            interactionAudioForm.reset({
                displayName: setting.displayName,
                keyword: setting.keyword || "",
                associatedGiftId: setting.associatedGiftId || "",
                audioFile: undefined
            });
            setIsAddInteractionAudioDialogOpen(true);
            setIsUploadAudioDialogOpen(false);
        } else { // Game Event Audio
            setIsAddInteractionAudioDialogOpen(false);
            setIsUploadAudioDialogOpen(true);
        }
    }
  };

  const handleOpenBallAssetDialog = (ball: BingoBallSetting, assetType: 'image' | 'audio') => {
    ballAssetForm.reset();
    setSelectedBallAssetFile(null);
    if (ballAssetFileInputRef.current) ballAssetFileInputRef.current.value = "";
    setCurrentBallEditing(ball);
    setAssetTypeToUpload(assetType);
    setIsUploadBallAssetDialogOpen(true);
  };

 const onSubmitBallAsset = async (data: BallAssetFormValues) => {
      if (!currentBallEditing || !assetTypeToUpload || !data.assetFile || data.assetFile.length === 0) {
          toast({ title: "Erro", description: "Informações incompletas para upload.", variant: "destructive" });
          return;
      }
      const fileToUpload = data.assetFile[0];
      setIsUploadingBallAsset(true);
      setBallAssetUploadProgress(0);

      const sanitizedFileName = fileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileExtension = fileToUpload.name.substring(fileToUpload.name.lastIndexOf('.') + 1).toLowerCase();
      const standardizedFileName = `${currentBallEditing.ballNumber}.${fileExtension}`;
      const newStoragePath = `bingoBalls/${currentBallEditing.ballNumber}/${assetTypeToUpload}/${standardizedFileName}`;

      let oldStoragePathToDelete: string | undefined = undefined;
      if (assetTypeToUpload === 'image') oldStoragePathToDelete = currentBallEditing.imageStoragePath;
      else if (assetTypeToUpload === 'audio') oldStoragePathToDelete = currentBallEditing.audioStoragePath;

      if (oldStoragePathToDelete) {
          try {
              await deleteFileStorage(storageRef(storage, oldStoragePathToDelete));
          } catch (delError: any) {
              if (delError.code !== 'storage/object-not-found') console.warn("Erro ao deletar asset antigo:", delError);
          }
      }

      try {
          const fileStorageRef = storageRef(storage, newStoragePath);
          const uploadTask = uploadBytesResumable(fileStorageRef, fileToUpload);

          const downloadURL = await new Promise<string>((resolve, reject) => {
              uploadTask.on('state_changed',
                  (snapshot) => setBallAssetUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                  (error) => reject(error),
                  async () => { try { resolve(await getDownloadURL(uploadTask.snapshot.ref)); } catch (e) { reject(e); } }
              );
          });

          const assetDataToSave: Partial<BingoBallSetting> = { lastUpdatedAt: serverTimestamp() };
          if (assetTypeToUpload === 'image') {
              assetDataToSave.imageUrl = downloadURL;
              assetDataToSave.imageStoragePath = newStoragePath;
          } else {
              assetDataToSave.audioUrl = downloadURL;
              assetDataToSave.audioStoragePath = newStoragePath;
          }

          const docRef = doc(db, "bingoBallConfigurations", currentBallEditing.ballNumber.toString());
          await setDoc(docRef, { ballNumber: currentBallEditing.ballNumber, ...assetDataToSave }, { merge: true });

          setBingoBallSettings(prev => prev.map(b =>
              b.ballNumber === currentBallEditing!.ballNumber ? { ...b, ...assetDataToSave, lastUpdatedAt: new Date() } : b
          ));

          toast({ title: "Asset Salvo!", description: `${assetTypeToUpload === 'image' ? 'Imagem' : 'Áudio'} para bola ${currentBallEditing.ballNumber} salvo.` });
          setIsUploadBallAssetDialogOpen(false);
      } catch (error: any) {
          console.error("Erro ao salvar asset da bola:", error);
          toast({ title: "Erro ao Salvar Asset", description: error.message || "Erro desconhecido.", variant: "destructive" });
      } finally {
          setIsUploadingBallAsset(false);
          setBallAssetUploadProgress(null);
      }
  };

  const handleRemoveBallAsset = async (ballNumber: number, assetType: 'image' | 'audio') => {
    if (!currentUser?.uid) return;
    const ballSetting = bingoBallSettings.find(b => b.ballNumber === ballNumber);
    if (!ballSetting) return;

    const storagePathToRemove = assetType === 'image' ? ballSetting.imageStoragePath : ballSetting.audioStoragePath;

    try {
        if (storagePathToRemove) {
            await deleteFileStorage(storageRef(storage, storagePathToRemove));
        }
        const docRef = doc(db, "bingoBallConfigurations", ballNumber.toString());
        const updateData: Partial<BingoBallSetting> & { lastUpdatedAt: any } = { lastUpdatedAt: serverTimestamp() };

        if (assetType === 'image') {
            updateData.imageUrl = deleteField() as unknown as undefined;
            updateData.imageStoragePath = deleteField() as unknown as undefined;
        } else {
            updateData.audioUrl = deleteField() as unknown as undefined;
            updateData.audioStoragePath = deleteField() as unknown as undefined;
        }
        await updateDoc(docRef, updateData);

        setBingoBallSettings(prev => prev.map(b =>
            b.ballNumber === ballNumber ? {
                ...b,
                imageUrl: assetType === 'image' ? undefined : b.imageUrl,
                imageStoragePath: assetType === 'image' ? undefined : b.imageStoragePath,
                audioUrl: assetType === 'audio' ? undefined : b.audioUrl,
                audioStoragePath: assetType === 'audio' ? undefined : b.audioStoragePath,
                lastUpdatedAt: new Date()
            } : b
        ));
        toast({ title: "Asset Removido", description: `${assetType === 'image' ? 'Imagem' : 'Áudio'} da bola ${ballNumber} removido.` });
    } catch (error: any) {
        console.error(`Erro ao remover asset da bola ${ballNumber}:`, error);
        toast({ title: "Erro ao Remover Asset", description: error.message || "Erro desconhecido.", variant: "destructive" });
    }
  };


  const onSubmitNewGame = async (values: NewGameFormValues) => {
    if (!currentUser?.uid) {
      toast({ title: "Erro de Autenticação", description: "Você precisa estar logado.", variant: "destructive" });
      return;
    }

    const [hours, minutes] = values.startTimeString.split(':').map(Number);
    let combinedStartTime = setHours(values.startTimeDate, hours);
    combinedStartTime = setMinutes(combinedStartTime, minutes);

    if (!isValid(combinedStartTime)) {
      toast({ title: "Data/Hora Inválida", description: "A data ou hora de início fornecida não é válida.", variant: "destructive" });
      return;
    }

    try {
      const newGameData: Omit<Game, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any, startTime: any } = {
        title: values.title,
        bingoType: values.bingoType,
        cardPrice: values.cardPrice || 0,
        prizeType: values.prizeType,
        prizeKakoVirtualId: values.prizeType === 'kako_virtual' ? values.prizeKakoVirtualId : undefined,
        prizeCashAmount: values.prizeType === 'cash' ? values.prizeCashAmount : undefined,
        prizeDescription: values.prizeDescription,
        startTime: Timestamp.fromDate(combinedStartTime),
        status: 'planejada',
        notes: values.notes || '',
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        participantsCount: 0,
        cardsSold: 0,
        totalRevenue: 0,
        drawnBalls: [],
      };

      await addDoc(collection(db, "bingoGames"), newGameData);
      toast({ title: "Partida Criada!", description: `A partida '${values.title}' foi criada com sucesso.` });
      setIsCreateGameDialogOpen(false);
      gameForm.reset();
      fetchBingoGames();
    } catch (error) {
      console.error("Erro ao criar partida:", error);
      toast({ title: "Erro ao Criar Partida", description: "Não foi possível salvar a nova partida.", variant: "destructive" });
    }
  };

  const onSubmitNewKakoPrize = async (values: NewKakoPrizeFormValues) => {
    if (!currentUser) {
        toast({ title: "Erro de Autenticação", description: "Você precisa estar logado para adicionar prêmios.", variant: "destructive"});
        return;
    }
    let prizeImageUrl = values.imageUrl;
    let storagePath: string | undefined = undefined;

    try {
      if (values.imageFile && values.imageFile.length > 0) {
        const file = values.imageFile[0];
        if (!file) {
          toast({ title: "Arquivo Inválido", description: "Nenhum arquivo selecionado para upload.", variant: "destructive" });
          return;
        }
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `bingoPrizesImages/${Date.now()}-${sanitizedFileName}`;
        const fileStorageRef = storageRef(storage, filePath);

        setPrizeImageUploadProgress(0);
        const uploadTask = uploadBytesResumable(fileStorageRef, file);

        const uploadedUrlAndPath = await new Promise<{url: string, path: string}>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => setPrizeImageUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            (error) => { console.error("Upload failed:", error); reject(error); },
            async () => { try { const url = await getDownloadURL(uploadTask.snapshot.ref); resolve({ url, path: filePath }); } catch (error) { console.error("Failed to get download URL", error); reject(error); } }
          );
        });
        prizeImageUrl = uploadedUrlAndPath.url;
        storagePath = uploadedUrlAndPath.path;
      } else if (!values.imageUrl) {
         toast({ title: "Informação Faltando", description: "Forneça uma URL da imagem ou um arquivo para upload.", variant: "destructive"});
         return;
      }

      const newPrizeData: Omit<BingoPrize, 'id' | 'createdAt' | 'updatedAt'| 'createdBy'> & { createdAt: any, updatedAt: any, storagePath?: string, createdBy: string } = {
          name: values.name,
          imageUrl: prizeImageUrl || undefined,
          storagePath: storagePath,
          kakoGiftId: values.kakoGiftId || undefined,
          valueDisplay: values.valueDisplay || undefined,
          description: values.description || undefined,
          type: 'kako_virtual',
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: currentUser.uid,
      };
      await addDoc(collection(db, "bingoPrizes"), newPrizeData);

      toast({ title: "Prêmio Cadastrado!", description: `O prêmio '${values.name}' foi salvo com sucesso.` });
      setIsAddKakoPrizeDialogOpen(false);
      kakoPrizeForm.reset();
      fetchKakoPrizes(false);
    } catch (error) {
        console.error("Erro ao cadastrar prêmio Kako Live:", error);
        toast({ title: "Erro ao Cadastrar", description: "Não foi possível salvar o prêmio. Tente novamente.", variant: "destructive" });
    } finally {
      setPrizeImageUploadProgress(null);
    }
  };

  const handleSaveAudio = async (data?: InteractionAudioFormValues) => {
    if (!currentUser?.uid) {
        toast({ title: "Erro de Autenticação", variant: "destructive"});
        return;
    }
    if (isUploadingAudio) return;
    setIsUploadingAudio(true);
    setAudioUploadProgress(0);

    const isInteractionAudio = !!data || (currentAudioSettingToEdit?.type === 'interaction');
    const fileToUpload = isInteractionAudio ? data?.audioFile?.[0] : selectedAudioFile;
    let audioDisplayNameForToast = isInteractionAudio ? data?.displayName : currentAudioSettingToEdit?.displayName;

    if (!fileToUpload) {
        toast({ title: "Nenhum Arquivo Selecionado", description: "Por favor, selecione um arquivo de áudio.", variant: "destructive" });
        setIsUploadingAudio(false);
        setAudioUploadProgress(null);
        return;
    }
     if (!audioDisplayNameForToast && isInteractionAudio && !currentAudioSettingToEdit) {
        toast({ title: "Nome do Áudio Obrigatório", description: "Por favor, defina um nome para o novo áudio de interação.", variant: "destructive" });
        setIsUploadingAudio(false);
        setAudioUploadProgress(null);
        return;
    }

    const sanitizedSelectedFileName = fileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    let newStoragePath = '';
    let firestoreCollectionName = '';
    let firestoreDocId: string | undefined = undefined;
    let oldStoragePathToDelete: string | undefined = undefined;

    let audioDataToSave: Partial<AudioSetting> & { uploadedAt?: any; type: 'gameEvent' | 'interaction'; displayName?: string; id?: string, createdBy?: string, eventName?: string };


    if (isInteractionAudio && data) {
        firestoreCollectionName = 'bingoInteractionAudios';
        newStoragePath = `bingoAudios/interaction/${Date.now()}_${sanitizedSelectedFileName}`;
        firestoreDocId = currentAudioSettingToEdit?.id;
        oldStoragePathToDelete = currentAudioSettingToEdit?.storagePath;
        audioDataToSave = {
            displayName: data.displayName,
            keyword: data.keyword,
            associatedGiftId: data.associatedGiftId || undefined,
            audioUrl: '',
            fileName: sanitizedSelectedFileName,
            storagePath: newStoragePath,
            type: 'interaction',
            uploadedAt: serverTimestamp(),
            createdBy: currentUser.uid,
        };
        const prize = availableKakoPrizesForGameForm.find(p => p.id === data.associatedGiftId);
        if (prize) audioDataToSave.associatedGiftName = prize.name;

    } else if (currentAudioSettingToEdit && currentAudioSettingToEdit.type === 'gameEvent') {
        firestoreCollectionName = 'bingoAudioSettings';
        firestoreDocId = currentAudioSettingToEdit.id;
        newStoragePath = `bingoAudios/partida/${firestoreDocId}/${sanitizedSelectedFileName}`;
        oldStoragePathToDelete = currentAudioSettingToEdit.storagePath;
        audioDisplayNameForToast = currentAudioSettingToEdit.displayName;
        audioDataToSave = {
            id: currentAudioSettingToEdit.id,
            type: 'gameEvent',
            displayName: currentAudioSettingToEdit.displayName,
            eventName: currentAudioSettingToEdit.eventName || currentAudioSettingToEdit.displayName, // Ensure eventName is populated
            audioUrl: '',
            fileName: sanitizedSelectedFileName,
            storagePath: newStoragePath,
            uploadedAt: serverTimestamp(),
        };
    } else {
        toast({ title: "Erro de Configuração", description: "Contexto de salvamento de áudio inválido.", variant: "destructive" });
        setIsUploadingAudio(false);
        setAudioUploadProgress(null);
        return;
    }

    if (oldStoragePathToDelete && fileToUpload) {
        try {
            await deleteFileStorage(storageRef(storage, oldStoragePathToDelete));
        } catch (delError: any) {
            if (delError.code !== 'storage/object-not-found') console.warn("Erro ao deletar áudio antigo do Storage (prosseguindo com upload):", delError);
        }
    }

    try {
        const fileStorageRef = storageRef(storage, newStoragePath);
        const uploadTask = uploadBytesResumable(fileStorageRef, fileToUpload);

        const downloadURL = await new Promise<string>((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => setAudioUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                (error) => { console.error("Audio upload error:", error); reject(error);},
                async () => { try { resolve(await getDownloadURL(uploadTask.snapshot.ref)); } catch (e) { console.error("Get DL URL error:", e); reject(e);} }
            );
        });
        audioDataToSave.audioUrl = downloadURL;
        audioDataToSave.storagePath = newStoragePath;

        if (isInteractionAudio) {
            if (firestoreDocId) { // Editing existing interaction audio
                 await setDoc(doc(db, firestoreCollectionName, firestoreDocId), audioDataToSave, { merge: true });
                 setInteractionAudioSettings(prev => prev.map(s => s.id === firestoreDocId ? {...s, ...audioDataToSave, uploadedAt: new Date()} as AudioSetting : s));
            } else { // Adding new interaction audio
                const docRef = await addDoc(collection(db, firestoreCollectionName), audioDataToSave);
                setInteractionAudioSettings(prev => [{...audioDataToSave, id: docRef.id, uploadedAt: new Date()} as AudioSetting, ...prev ]);
            }
        } else if (currentAudioSettingToEdit && currentAudioSettingToEdit.type === 'gameEvent' && firestoreDocId) { // Game Event Audio
            await setDoc(doc(db, firestoreCollectionName, firestoreDocId), audioDataToSave, { merge: true });
             setGameEventAudioSettings(prev => prev.map(s => s.id === firestoreDocId ? {...s, ...audioDataToSave, uploadedAt: new Date()} as AudioSetting : s));
        }

        toast({ title: "Áudio Salvo!", description: `O áudio '${audioDisplayNameForToast}' foi salvo com sucesso.` });
        setIsUploadAudioDialogOpen(false);
        setIsAddInteractionAudioDialogOpen(false);
        setSelectedAudioFile(null);
        if (audioFileInputRef.current) audioFileInputRef.current.value = "";
        setCurrentAudioSettingToEdit(null);
        interactionAudioForm.reset();

    } catch (error: any) {
        console.error("Erro ao salvar áudio:", error);
        toast({ title: "Erro ao Salvar Áudio", description: `${error.message || "Erro desconhecido."} (Código: ${error.code || 'N/A'})`, variant: "destructive" });
    } finally {
        setIsUploadingAudio(false);
        setAudioUploadProgress(null);
    }
};

const handleRemoveAudio = async (setting: AudioSetting) => {
    if (!currentUser?.uid || !setting.id) return;

    const confirmDelete = window.confirm(`Tem certeza que deseja remover o áudio "${setting.displayName}"?`);
    if (!confirmDelete) return;

    try {
        if (setting.storagePath) {
            await deleteFileStorage(storageRef(storage, setting.storagePath));
        }
        if (setting.type === 'gameEvent') {
            await setDoc(doc(db, "bingoAudioSettings", setting.id), {
                id: setting.id,
                displayName: setting.displayName,
                type: 'gameEvent',
                eventName: setting.eventName || setting.displayName,
                audioUrl: deleteField(),
                fileName: deleteField(),
                storagePath: deleteField(),
                uploadedAt: serverTimestamp(),
            }, { merge: true });
            setGameEventAudioSettings(prev => prev.map(s => s.id === setting.id ? { ...s, audioUrl: undefined, fileName: undefined, storagePath: undefined, uploadedAt: new Date() } as AudioSetting : s));
        } else if (setting.type === 'interaction') {
            await deleteDoc(doc(db, "bingoInteractionAudios", setting.id));
            setInteractionAudioSettings(prev => prev.filter(s => s.id !== setting.id));
        }
        toast({ title: "Áudio Removido", description: `Áudio "${setting.displayName}" removido com sucesso.` });
    } catch (error: any) {
        console.error("Erro ao remover áudio:", error);
        toast({ title: "Erro ao Remover Áudio", description: error.message || "Erro desconhecido.", variant: "destructive" });
    }
};

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const validTab = bingoSpecificMenuGroups.flatMap(g => g.items).find(item => item.id === hash);
    if (validTab) {
      setActiveTab(hash);
    } else if (bingoSpecificMenuGroups.length > 0 && bingoSpecificMenuGroups[0].items.length > 0) {
        const firstItemId = bingoSpecificMenuGroups[0].items[0].id;
        setActiveTab(firstItemId);
        if (pathname === '/admin/bingo-admin' && (window.location.hash === '' || window.location.hash === '#')) {
            router.replace(`/admin/bingo-admin#${firstItemId}`, { scroll: false });
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleMenuClick = (item: BingoAdminMenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.link && item.link.startsWith("#")) {
      const newTabId = item.link.substring(1);
      setActiveTab(newTabId);
      router.push(`/admin/bingo-admin#${newTabId}`, { scroll: false });
    } else if (item.link) {
        router.push(item.link);
    }
  };

  const handleViewCardDetails = (card: GeneratedBingoCard) => {
    setSelectedCardForDetails(card);
    setIsDetailModalOpen(true);
  };

 const handleConfirmDeleteAll90BallCards = async () => {
    setIsDeleting90BallCards(true);
    try {
      const cardsCollectionRef = collection(db, "bingoGeneratedCards90");
      const querySnapshot = await getDocs(cardsCollectionRef);
      if (querySnapshot.empty) {
        toast({ title: "Nenhuma Cartela para Apagar", description: "Não há cartelas de 90 bolas no banco de dados." });
        return;
      }
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
      setGenerated90BallCards([]);
      toast({title: "Cartelas Apagadas", description: "Todas as cartelas de 90 bolas foram removidas do banco de dados."});
    } catch (error) {
      console.error("Erro ao apagar cartelas de 90 bolas:", error);
      toast({ title: "Erro ao Apagar", description: "Não foi possível apagar as cartelas.", variant: "destructive" });
    } finally {
      setIsConfirmDeleteAll90BallCardsDialogOpen(false);
      setIsDeleting90BallCards(false);
    }
  };

  const handleConfirmDeleteAll75BallCards = async () => {
    setIsDeleting75BallCards(true);
    try {
      const cardsCollectionRef = collection(db, "bingoGeneratedCards75");
      const querySnapshot = await getDocs(cardsCollectionRef);
      if (querySnapshot.empty) {
        toast({ title: "Nenhuma Cartela para Apagar", description: "Não há cartelas de 75 bolas no banco de dados." });
        return;
      }
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
      setGenerated75BallCards([]);
      toast({title: "Cartelas Apagadas", description: "Todas as cartelas de 75 bolas foram removidas do banco de dados."});
    } catch (error) {
      console.error("Erro ao apagar cartelas de 75 bolas:", error);
      toast({ title: "Erro ao Apagar", description: "Não foi possível apagar as cartelas.", variant: "destructive" });
    } finally {
      setIsConfirmDeleteAll75BallCardsDialogOpen(false);
      setIsDeleting75BallCards(false);
    }
  };


  const renderBingoAdminContent = () => {
    switch (activeTab) {
      case 'bingoPartidas':
        return (
          <div className="space-y-6 p-6 bg-background h-full">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <TicketIcon className="mr-2 h-6 w-6 text-primary" />
                    Gerenciamento de Partidas
                  </CardTitle>
                  <CardDescription>
                    Crie, visualize e gerencie todos os aspectos dos jogos de bingo.
                  </CardDescription>
                </div>
                <Dialog open={isCreateGameDialogOpen} onOpenChange={setIsCreateGameDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" /> Criar Nova Partida
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Criar Nova Partida de Bingo</DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes para configurar uma nova partida.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...gameForm}>
                      <form onSubmit={gameForm.handleSubmit(onSubmitNewGame)} className="space-y-4 py-2 pb-4">
                        <FormField
                          control={gameForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título da Partida</FormLabel>
                              <FormControl><Input placeholder="Ex: Bingo da Sorte Semanal" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={gameForm.control}
                          name="bingoType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Bingo</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="90-ball">90 Bolas</SelectItem>
                                  <SelectItem value="75-ball">75 Bolas</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={gameForm.control}
                          name="cardPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preço da Cartela (0 para grátis)</FormLabel>
                              <FormControl><Input type="number" step="0.01" placeholder="Ex: 5.00" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={gameForm.control}
                          name="prizeType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Prêmio</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo de prêmio" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="kako_virtual">Prêmio Virtual Kako</SelectItem>
                                  <SelectItem value="cash">Dinheiro</SelectItem>
                                  <SelectItem value="other">Outro (Descrever)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {watchedPrizeType === 'kako_virtual' && (
                          <FormField
                            control={gameForm.control}
                            name="prizeKakoVirtualId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prêmio Virtual Kako</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingKakoPrizesForGameForm}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={isLoadingKakoPrizesForGameForm ? "Carregando prêmios..." : "Selecione um prêmio Kako"} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {availableKakoPrizesForGameForm.map(prize => (
                                      <SelectItem key={prize.id!} value={prize.id!}>{prize.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        {watchedPrizeType === 'cash' && (
                           <FormField
                            control={gameForm.control}
                            name="prizeCashAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Valor do Prêmio em Dinheiro (R$)</FormLabel>
                                <FormControl><Input type="number" step="0.01" placeholder="Ex: 100.00" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <FormField
                          control={gameForm.control}
                          name="prizeDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição Detalhada do Prêmio</FormLabel>
                              <FormControl><Textarea placeholder="Ex: PIX de R$100 + Presente Surpresa" {...field} rows={3}/></FormControl>
                              <FormDesc>Para prêmios 'Outro', esta é a descrição principal. Para outros tipos, pode ser um complemento.</FormDesc>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                            control={gameForm.control}
                            name="startTimeDate"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>Data de Início</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, "PPP", { locale: ptBR })
                                        ) : (
                                            <span>Escolha uma data</span>
                                        )}
                                        <CalendarIconLucide className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                          control={gameForm.control}
                          name="startTimeString"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hora de Início (HH:MM)</FormLabel>
                              <FormControl><Input type="time" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={gameForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notas (Opcional)</FormLabel>
                              <FormControl><Textarea placeholder="Observações internas sobre a partida..." {...field} rows={2}/></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <DialogFooter>
                          <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                          <Button type="submit" disabled={gameForm.formState.isSubmitting}>
                            {gameForm.formState.isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Partida
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingGames ? (
                   <div className="flex justify-center items-center h-32"><LoadingSpinner size="md" /><p className="ml-2 text-muted-foreground">Carregando partidas...</p></div>
                ) : bingoGames.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Nenhuma partida de bingo cadastrada ainda.</p>
                ) : (
                  <ScrollArea className="h-[calc(100vh-350px)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead>Prêmio</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bingoGames.map((game) => (
                        <TableRow key={game.id}>
                          <TableCell className="font-medium">{game.title}</TableCell>
                          <TableCell>{game.bingoType === '75-ball' ? '75 Bolas' : '90 Bolas'}</TableCell>
                          <TableCell className="text-right">R$ {game.cardPrice?.toFixed(2) ?? '0.00'}</TableCell>
                          <TableCell className="max-w-xs truncate" title={game.prizeDescription}>{game.prizeDescription}</TableCell>
                          <TableCell>{game.startTime ? format(new Date(game.startTime), "dd/MM/yy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                          <TableCell><Badge variant={game.status === 'planejada' ? 'default' : game.status === 'ativa' ? 'destructive' : 'secondary'} className="capitalize">{game.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({title: "Editar Partida", description:"Funcionalidade em desenvolvimento."})}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'bingoCartelas75':
        return (
          <div className="space-y-6 p-6 bg-background h-full">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LayoutGrid className="mr-2 h-6 w-6 text-primary" />
                  Cartelas de Bingo 75 Bolas Geradas
                </CardTitle>
                <CardDescription>
                  Visualize informações sobre as cartelas de bingo de 75 bolas geradas no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsConfirmDeleteAll75BallCardsDialogOpen(true)}
                    disabled={generated75BallCards.length === 0 || isDeleting75BallCards}
                  >
                    {isDeleting75BallCards ? <LoadingSpinner size="sm" className="mr-2"/> : <Trash2 className="mr-2 h-4 w-4" />}
                    Apagar Todas (75 Bolas - DB)
                  </Button>
                </div>
                 {isLoading75BallCards ? (
                   <div className="flex justify-center items-center h-32"><LoadingSpinner size="md" /><p className="ml-2 text-muted-foreground">Carregando cartelas de 75 bolas...</p></div>
                ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID da Cartela</TableHead>
                        <TableHead>Números (Início)</TableHead>
                        <TableHead>ID do Criador</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead className="text-center">Usos</TableHead>
                        <TableHead className="text-center">Premiada</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generated75BallCards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center h-24">
                            Nenhuma cartela de 75 bolas gerada encontrada.
                          </TableCell>
                        </TableRow>
                      ) : (
                        generated75BallCards.map((card) => (
                          <TableRow key={card.id}>
                            <TableCell className="font-mono text-xs">{card.id}</TableCell>
                            <TableCell className="text-xs">{format75BallCardNumbersPreview(card.cardNumbers)}</TableCell>
                            <TableCell className="text-xs">{card.creatorId}</TableCell>
                            <TableCell>{card.createdAt instanceof Date ? format(card.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                            <TableCell className="text-center">{card.usageHistory.length}</TableCell>
                            <TableCell className="text-center">{card.timesAwarded > 0 ? `${card.timesAwarded}x` : 'Não'}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleViewCardDetails(card)} disabled={!card.cardNumbers || card.cardNumbers.length !== 5}>
                                <FileJson className="mr-1.5 h-3 w-3" /> Ver Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'bingoCartelas90':
        return (
          <div className="space-y-6 p-6 bg-background h-full">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LayoutGrid className="mr-2 h-6 w-6 text-primary" />
                  Cartelas de Bingo 90 Bolas Geradas
                </CardTitle>
                <CardDescription>
                  Visualize informações sobre as cartelas de bingo de 90 bolas geradas e salvas no banco de dados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <Select value={cardsToGenerateCount} onValueChange={setCardsToGenerateCount}>
                        <SelectTrigger className="w-[180px] h-9 text-xs">
                            <SelectValue placeholder="Qtd. para gerar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="100">Gerar 100</SelectItem>
                            <SelectItem value="500">Gerar 500</SelectItem>
                            <SelectItem value="1000">Gerar 1000</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        size="sm"
                        onClick={() => handleGenerateCards(parseInt(cardsToGenerateCount, 10))}
                        disabled={isGeneratingCards}
                    >
                        {isGeneratingCards ? <LoadingSpinner size="sm" className="mr-2"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Gerar Cartelas
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsConfirmDeleteAll90BallCardsDialogOpen(true)}
                    disabled={generated90BallCards.length === 0 || isDeleting90BallCards}
                  >
                    {isDeleting90BallCards ? <LoadingSpinner size="sm" className="mr-2"/> : <Trash2 className="mr-2 h-4 w-4" />}
                    Apagar Todas (90 Bolas - DB)
                  </Button>
                </div>
                {isLoading90BallCards ? (
                   <div className="flex justify-center items-center h-32"><LoadingSpinner size="md" /><p className="ml-2 text-muted-foreground">Carregando cartelas de 90 bolas...</p></div>
                ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID da Cartela</TableHead>
                        <TableHead>Números (Início)</TableHead>
                        <TableHead>ID do Criador</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead className="text-center">Usos</TableHead>
                        <TableHead className="text-center">Premiada</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generated90BallCards.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center h-24">
                            Nenhuma cartela de 90 bolas gerada encontrada no banco de dados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        generated90BallCards.map((card) => (
                          <TableRow key={card.id}>
                            <TableCell className="font-mono text-xs">{card.id}</TableCell>
                            <TableCell className="text-xs">{format90BallCardNumbersPreview(card.cardNumbers)}</TableCell>
                            <TableCell className="text-xs">{card.creatorId}</TableCell>
                            <TableCell>{card.createdAt instanceof Date ? format(card.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                            <TableCell className="text-center">{card.usageHistory.length}</TableCell>
                            <TableCell className="text-center">{card.timesAwarded > 0 ? `${card.timesAwarded}x` : 'Não'}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleViewCardDetails(card)} disabled={!card.cardNumbers || card.cardNumbers.length !== 3}>
                                <FileJson className="mr-1.5 h-3 w-3" /> Ver Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'bingoPremiosKako':
        return (
            <div className="space-y-6 p-6 bg-background h-full">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center">
                            <Gift className="mr-2 h-6 w-6 text-primary" />
                            Gerenciamento de Prêmios - Kako Live
                        </CardTitle>
                        <CardDescription>
                            Cadastre e visualize prêmios virtuais do Kako Live para os jogos de bingo.
                        </CardDescription>
                    </div>
                    <Dialog open={isAddKakoPrizeDialogOpen} onOpenChange={(open) => {
                        setIsAddKakoPrizeDialogOpen(open);
                        if(!open) {
                            kakoPrizeForm.reset();
                            setPrizeImageUploadProgress(null);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Prêmio
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Adicionar Novo Prêmio Kako Live</DialogTitle>
                                <DialogDescription>
                                    Preencha os detalhes do novo prêmio virtual.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...kakoPrizeForm}>
                                <form onSubmit={kakoPrizeForm.handleSubmit(onSubmitNewKakoPrize)} className="space-y-4 py-2 pb-4">
                                    <FormField
                                        control={kakoPrizeForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Prêmio</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Coroa de Diamantes Kako" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={kakoPrizeForm.control}
                                        name="imageFile"
                                        render={({ field: { onChange, value, ...rest } }) => (
                                            <FormItem>
                                                <FormLabel>Arquivo da Imagem (Opcional, máx 2MB)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                          const files = e.target.files;
                                                          if (files && files[0] && files[0].size > 2 * 1024 * 1024) {
                                                              kakoPrizeForm.setError("imageFile", {type: "manual", message: "Imagem muito grande (máx 2MB)."});
                                                              onChange(null);
                                                          } else if (files && files[0] && !files[0].type.startsWith("image/")) {
                                                              kakoPrizeForm.setError("imageFile", {type: "manual", message: "O arquivo deve ser uma imagem."});
                                                              onChange(null);
                                                          } else {
                                                              kakoPrizeForm.clearErrors("imageFile");
                                                              onChange(files);
                                                          }
                                                        }}
                                                        {...rest} // Spread remaining field props
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {prizeImageUploadProgress !== null && (
                                      <div className="space-y-1">
                                        <Label className="text-xs">Progresso do Upload:</Label>
                                        <Progress value={prizeImageUploadProgress} className="h-2" />
                                        <p className="text-xs text-muted-foreground text-center">{Math.round(prizeImageUploadProgress)}%</p>
                                      </div>
                                    )}
                                    <FormField
                                        control={kakoPrizeForm.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>OU URL da Imagem do Prêmio (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} />
                                                </FormControl>
                                                <FormDesc>Use se não for fazer upload de um arquivo.</FormDesc>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={kakoPrizeForm.control}
                                        name="kakoGiftId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ID do Presente Kako (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: 10000 (ID do Kako)" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={kakoPrizeForm.control}
                                        name="valueDisplay"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Valor de Exibição (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: 10.000 Diamantes" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={kakoPrizeForm.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Descrição (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Descreva brevemente o prêmio..." {...field} rows={3}/>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" variant="outline">Cancelar</Button>
                                        </DialogClose>
                                        <Button type="submit" disabled={kakoPrizeForm.formState.isSubmitting || prizeImageUploadProgress !== null}>
                                            {(kakoPrizeForm.formState.isSubmitting || prizeImageUploadProgress !== null) ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                                            Salvar Prêmio
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {isLoadingKakoPrizes ? (
                        <div className="flex justify-center items-center h-32">
                            <LoadingSpinner size="md" />
                            <p className="ml-2 text-muted-foreground">Carregando prêmios...</p>
                        </div>
                    ) : kakoPrizes.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">Nenhum prêmio Kako Live cadastrado.</p>
                    ) : (
                        <ScrollArea className="h-[calc(100vh-350px)]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Imagem</TableHead>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>ID Kako</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Descrição</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {kakoPrizes.map((prize) => (
                                        <TableRow key={prize.id}>
                                            <TableCell>
                                                {prize.imageUrl ? (
                                                    <NextImage src={prize.imageUrl} alt={prize.name} width={40} height={40} className="rounded-md object-contain" data-ai-hint="prize icon" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs">Sem Img</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{prize.name}</TableCell>
                                            <TableCell className="text-xs">{prize.kakoGiftId || "N/A"}</TableCell>
                                            <TableCell className="text-xs">{prize.valueDisplay || "N/A"}</TableCell>
                                            <TableCell className="text-xs max-w-xs truncate" title={prize.description || undefined}>{prize.description || "N/A"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
            </div>
        );
      case 'bingoPremiosDinheiro':
         return (
          <div className="space-y-6 p-6 bg-background h-full">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-6 w-6 text-primary" />
                  Gerenciamento de Prêmios - Dinheiro
                </CardTitle>
                <CardDescription>
                  Defina e administre prêmios em dinheiro para diferentes tipos de bingo e classificações. (Em Desenvolvimento)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Mais detalhes e funcionalidades serão adicionados aqui em breve.</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'bingoGanhadores':
        return (
          <div className="space-y-6 p-6 bg-background h-full">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-6 w-6 text-primary" />
                  Registro de Ganhadores
                </CardTitle>
                <CardDescription>
                  Gerencie e visualize o histórico de ganhadores dos jogos de bingo. (Em Desenvolvimento)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Mais detalhes e funcionalidades serão adicionados aqui em breve.</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'bingoBolasSorteadas':
        return (
          <div className="space-y-6 p-6 bg-background h-full">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Dice5 className="mr-2 h-6 w-6 text-primary" />
                  Histórico de Bolas Sorteadas
                </CardTitle>
                <CardDescription>
                  Acesse o registro de todas as bolas sorteadas em cada partida. (Em Desenvolvimento)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Mais detalhes e funcionalidades serão adicionados aqui em breve.</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'bingoTelaSorteio':
        return (
          <div className="space-y-6 p-6 bg-background h-full">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PlaySquare className="mr-2 h-6 w-6 text-primary" />
                  Interface da Tela de Sorteio
                </CardTitle>
                <CardDescription>
                  Visualize e controle uma tela de sorteio em tempo real para diferentes tipos de bingo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="bingo90" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bingo90" className="flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4"/> Bingo 90 Bolas
                    </TabsTrigger>
                    <TabsTrigger value="bingo75" className="flex items-center gap-2">
                      <Grid2X2 className="h-4 w-4"/> Bingo 75 Bolas
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="bingo90" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tela de Sorteio - 90 Bolas</CardTitle>
                        <CardDescription>Interface para o sorteio de bingo de 90 bolas.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 border rounded-lg bg-muted/30 min-h-[200px] flex flex-col items-center justify-center">
                           <Zap className="h-12 w-12 text-primary mb-2" />
                           <p className="text-muted-foreground">Exibição da bola sorteada, grade de números marcados, etc.</p>
                           <p className="text-xs text-muted-foreground mt-1">(Funcionalidade em desenvolvimento)</p>
                        </div>
                        <div className="flex justify-around items-center pt-4 border-t">
                            <Button variant="outline"><Dice5 className="mr-2 h-4 w-4" />Sortear Próxima</Button>
                            <Button variant="destructive"><CircleAlert className="mr-2 h-4 w-4"/>Resetar Jogo</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="bingo75" className="mt-4">
                     <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tela de Sorteio - 75 Bolas</CardTitle>
                        <CardDescription>Interface para o sorteio de bingo de 75 bolas (B-I-N-G-O).</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 border rounded-lg bg-muted/30 min-h-[200px] flex flex-col items-center justify-center">
                            <Zap className="h-12 w-12 text-primary mb-2" />
                           <p className="text-muted-foreground">Exibição da bola sorteada, grade de números marcados, etc.</p>
                           <p className="text-xs text-muted-foreground mt-1">(Funcionalidade em desenvolvimento)</p>
                        </div>
                        <div className="flex justify-around items-center pt-4 border-t">
                            <Button variant="outline"><Dice5 className="mr-2 h-4 w-4" />Sortear Próxima</Button>
                            <Button variant="destructive"><CircleAlert className="mr-2 h-4 w-4"/>Resetar Jogo</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        );
      case 'bingoBolasConfig':
        return (
          <div className="space-y-6 p-6 bg-background h-full">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SettingsIconLucide className="mr-2 h-6 w-6 text-primary" />
                  Configuração das Bolas (1-90)
                </CardTitle>
                <CardDescription>
                  Personalize o áudio e a imagem para cada bola de bingo.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-250px)] overflow-y-auto">
                  <div className="space-y-3 pr-2">
                    {bingoBallSettings.sort((a,b) => a.ballNumber - b.ballNumber).map((ballSetting) => (
                      <div key={ballSetting.ballNumber} className="flex items-center justify-between p-3 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center">
                          <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center text-sm font-semibold mr-3">
                            {String(ballSetting.ballNumber).padStart(2, '0')}
                          </div>
                          <span className="font-medium">Bola {String(ballSetting.ballNumber).padStart(2, '0')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs overflow-hidden">
                            {ballSetting.imageUrl ? (
                                <NextImage src={ballSetting.imageUrl} alt={`Bola ${ballSetting.ballNumber}`} width={40} height={40} className="object-contain" data-ai-hint="bingo ball" />
                            ) : (
                                <ImageIconLucide className="h-5 w-5" />
                            )}
                          </div>
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleOpenBallAssetDialog(ballSetting, 'image')}>
                            <UploadCloud className="mr-1.5 h-3 w-3" /> Imagem
                          </Button>
                          {ballSetting.imageStoragePath && (
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveBallAsset(ballSetting.ballNumber, 'image')}>
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          )}

                          {ballSetting.audioUrl ? (
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => playAudio(ballSetting.audioUrl, `ball-${ballSetting.ballNumber}`)}>
                                  {currentPlayingAudioId === `ball-${ballSetting.ballNumber}` ? <PauseCircleIcon className="h-4 w-4"/> : <PlayCircleIcon className="h-4 w-4" />}
                              </Button>
                          ) : (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled>
                                  <PlayCircleIcon className="h-4 w-4 opacity-50"/>
                              </Button>
                          )}
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleOpenBallAssetDialog(ballSetting, 'audio')}>
                             <Music2 className="mr-1.5 h-3 w-3" /> Áudio
                          </Button>
                           {ballSetting.audioStoragePath && (
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveBallAsset(ballSetting.ballNumber, 'audio')}>
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
              </CardContent>
            </Card>
            <Dialog open={isUploadBallAssetDialogOpen} onOpenChange={(open) => {
                setIsUploadBallAssetDialogOpen(open);
                if (!open) {
                    ballAssetForm.reset();
                    setSelectedBallAssetFile(null);
                    if (ballAssetFileInputRef.current) ballAssetFileInputRef.current.value = "";
                    setCurrentBallEditing(null);
                    setAssetTypeToUpload(null);
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {currentBallEditing ? `Configurar ${assetTypeToUpload === 'image' ? 'Imagem' : 'Áudio'} para Bola ${currentBallEditing.ballNumber}` : "Upload de Asset"}
                        </DialogTitle>
                        <DialogDescription>
                            Selecione um arquivo de {assetTypeToUpload === 'image' ? 'imagem (JPG, PNG, GIF)' : 'áudio (MP3, WAV)'}. Máximo 2MB.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...ballAssetForm}>
                        <form onSubmit={ballAssetForm.handleSubmit(onSubmitBallAsset)} className="space-y-4 py-2 pb-4">
                             <FormField
                                control={ballAssetForm.control}
                                name="assetFile"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Arquivo</FormLabel>
                                    <FormControl>
                                    <Input
                                        type="file"
                                        accept={assetTypeToUpload === 'image' ? "image/*" : "audio/*"}
                                        onChange={(e) => {
                                            const files = e.target.files;
                                            if (files && files.length > 0) {
                                                if (files[0].size > 2 * 1024 * 1024) {
                                                    ballAssetForm.setError("assetFile", { type: "manual", message: "Arquivo muito grande (máx 2MB)." });
                                                    field.onChange(null);
                                                    setSelectedBallAssetFile(null);
                                                } else {
                                                    const fileTypeValid = assetTypeToUpload === 'image' ? files[0].type.startsWith("image/") : files[0].type.startsWith("audio/");
                                                    if (!fileTypeValid) {
                                                        ballAssetForm.setError("assetFile", { type: "manual", message: assetTypeToUpload === 'image' ? "O arquivo deve ser uma imagem." : "O arquivo deve ser um áudio."});
                                                        field.onChange(null);
                                                        setSelectedBallAssetFile(null);
                                                    } else {
                                                        ballAssetForm.clearErrors("assetFile");
                                                        field.onChange(files);
                                                        setSelectedBallAssetFile(files[0]);
                                                    }
                                                }
                                            } else {
                                                field.onChange(null);
                                                setSelectedBallAssetFile(null);
                                            }
                                        }}
                                        ref={el => {
                                            field.ref(el);
                                            if (ballAssetFileInputRef && typeof ballAssetFileInputRef === 'object') {
                                                ballAssetFileInputRef.current = el;
                                            }
                                        }}
                                        name={field.name}
                                        onBlur={field.onBlur}
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            {ballAssetUploadProgress !== null && (
                            <div className="space-y-1">
                                <Label className="text-xs">Progresso do Upload:</Label>
                                <Progress value={ballAssetUploadProgress} className="h-2" />
                                <p className="text-xs text-muted-foreground text-center">{Math.round(ballAssetUploadProgress)}%</p>
                            </div>
                            )}
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                                <Button type="submit" disabled={isUploadingBallAsset || !ballAssetForm.formState.isValid || !selectedBallAssetFile}>
                                    {isUploadingBallAsset ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                                    Enviar
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
          </div>
        );
      case 'bingoAudiosPartida':
        return (
          <div className="space-y-6 p-6 bg-background h-full">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Volume2 className="mr-2 h-6 w-6 text-primary" />
                  Gerenciamento de Áudios da Partida
                </CardTitle>
                <CardDescription>
                  Defina os áudios para eventos chave da partida de bingo.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-250px)] overflow-y-auto">
                <div className="space-y-3 pr-2">
                  {gameEventAudioSettings.map((audioEvent) => (
                    <div key={audioEvent.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{audioEvent.displayName}</span>
                        <p className="text-xs text-muted-foreground truncate" title={audioEvent.fileName || "Nenhum áudio definido"}>
                            {audioEvent.fileName || "Nenhum áudio definido"}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                        {audioEvent.audioUrl && (
                             <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => playAudio(audioEvent.audioUrl, audioEvent.id)}>
                                {currentPlayingAudioId === audioEvent.id ? <PauseCircleIcon className="h-4 w-4"/> : <PlayCircleIcon className="h-4 w-4" />}
                            </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleOpenUploadAudioDialog(audioEvent, false)}>
                           <UploadCloud className="mr-1.5 h-3 w-3" /> Upload
                        </Button>
                         {audioEvent.storagePath && (
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveAudio(audioEvent)}>
                             <Trash2 className="h-4 w-4" />
                           </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Dialog open={isUploadAudioDialogOpen || isAddInteractionAudioDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsUploadAudioDialogOpen(false);
                    setIsAddInteractionAudioDialogOpen(false);
                    setCurrentAudioSettingToEdit(null);
                    setSelectedAudioFile(null);
                    if (audioFileInputRef.current) audioFileInputRef.current.value = "";
                    interactionAudioForm.reset();
                } else {
                    if (isAddInteractionAudioDialogOpen && currentAudioSettingToEdit && currentAudioSettingToEdit.type === 'interaction') {
                        interactionAudioForm.reset({
                            displayName: currentAudioSettingToEdit.displayName,
                            keyword: currentAudioSettingToEdit.keyword || "",
                            associatedGiftId: currentAudioSettingToEdit.associatedGiftId || "",
                            audioFile: undefined
                        });
                    } else if (isAddInteractionAudioDialogOpen && !currentAudioSettingToEdit) {
                        interactionAudioForm.reset();
                    }
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {isAddInteractionAudioDialogOpen
                                ? (currentAudioSettingToEdit ? `Editar Áudio: ${currentAudioSettingToEdit.displayName}` : "Adicionar Novo Áudio de Interação")
                                : `Configurar Áudio para: ${currentAudioSettingToEdit?.displayName || 'Evento'}`
                            }
                        </DialogTitle>
                        <DialogDescription>
                            Selecione um arquivo de áudio (MP3, WAV, etc.). Máximo 2MB.
                        </DialogDescription>
                    </DialogHeader>
                    {isAddInteractionAudioDialogOpen ? (
                        <Form {...interactionAudioForm}>
                            <form onSubmit={interactionAudioForm.handleSubmit(handleSaveAudio)} className="space-y-4 py-2 pb-4">
                                <FormField control={interactionAudioForm.control} name="displayName" render={({ field }) => (
                                    <FormItem><FormLabel>Nome do Áudio</FormLabel><FormControl><Input placeholder="Ex: Aplausos Curtos" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={interactionAudioForm.control} name="keyword" render={({ field }) => (
                                    <FormItem><FormLabel>Palavra Chave</FormLabel><FormControl><Input placeholder="Ex: !aplauso" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={interactionAudioForm.control} name="associatedGiftId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Presente Associado (Opcional)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""} disabled={isLoadingKakoPrizesForGameForm}>
                                            <FormControl><SelectTrigger><SelectValue placeholder={isLoadingKakoPrizesForGameForm ? "Carregando..." : "Nenhum presente"} /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="">Nenhum</SelectItem>
                                                {availableKakoPrizesForGameForm.map(prize => (
                                                    <SelectItem key={prize.id!} value={prize.id!}>{prize.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={interactionAudioForm.control} name="audioFile"
                                  render={({ field: { onChange: rhfOnChange, value, name: rhfName, ref: rhfRef, ...rhfRest } }) => (
                                  <FormItem>
                                      <FormLabel>Arquivo de Áudio (máx 2MB)</FormLabel>
                                      <FormControl>
                                          <Input
                                            type="file" accept="audio/*"
                                            onChange={(e) => {
                                                const files = e.target.files;
                                                if (files && files.length > 0) {
                                                    if (files[0].size > 2 * 1024 * 1024) {
                                                        interactionAudioForm.setError("audioFile", { type: "manual", message: "Arquivo muito grande (máx 2MB)." });
                                                        rhfOnChange(null);
                                                    } else if (!files[0].type.startsWith("audio/")) {
                                                        interactionAudioForm.setError("audioFile", { type: "manual", message: "O arquivo deve ser um áudio."});
                                                        rhfOnChange(null);
                                                    } else {
                                                        interactionAudioForm.clearErrors("audioFile");
                                                        rhfOnChange(files);
                                                    }
                                                } else {
                                                    rhfOnChange(null);
                                                }
                                                handleAudioFileSelect(e);
                                            }}
                                            ref={el => {
                                                if (typeof rhfRef === 'function') rhfRef(el);
                                                // @ts-ignore
                                                else if (rhfRef) rhfRef.current = el;
                                                if (audioFileInputRef && typeof audioFileInputRef === 'object') {
                                                  audioFileInputRef.current = el;
                                                }
                                            }}
                                            name={rhfName}
                                            {...rhfRest}
                                          />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                                )}/>
                                {audioUploadProgress !== null && (
                                  <div className="space-y-1"><Label className="text-xs">Progresso:</Label><Progress value={audioUploadProgress} className="h-2" /><p className="text-xs text-muted-foreground text-center">{Math.round(audioUploadProgress)}%</p></div>
                                )}
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                                    <Button
                                        type="submit"
                                        disabled={
                                            isUploadingAudio ||
                                            !interactionAudioForm.formState.isValid ||
                                            (!interactionAudioForm.getValues('audioFile')?.[0] && !(currentAudioSettingToEdit?.type === 'interaction' && currentAudioSettingToEdit?.audioUrl))
                                        }
                                    >
                                        {isUploadingAudio ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}Salvar Áudio
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    ) : isUploadAudioDialogOpen ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveAudio(); }} className="space-y-4 py-2 pb-4">
                            <div className="space-y-1">
                                <Label htmlFor="gameEventAudioFileDirect">Arquivo de Áudio (máx 2MB)</Label>
                                <Input id="gameEventAudioFileDirect" type="file" accept="audio/*" ref={audioFileInputRef} onChange={handleAudioFileSelect} />
                                {selectedAudioFile && <p className="text-xs text-muted-foreground mt-1">Selecionado: {selectedAudioFile.name}</p>}
                            </div>
                            {audioUploadProgress !== null && (
                                <div className="space-y-1"><Label className="text-xs">Progresso:</Label><Progress value={audioUploadProgress} className="h-2" /><p className="text-xs text-muted-foreground text-center">{Math.round(audioUploadProgress)}%</p></div>
                            )}
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                                <Button
                                    type="submit"
                                    disabled={isUploadingAudio || (!selectedAudioFile && !currentAudioSettingToEdit?.audioUrl) }
                                >
                                    {isUploadingAudio ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}Salvar Áudio
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : null}
                </DialogContent>
            </Dialog>
          </div>
        );
    case 'bingoAudiosInteracao':
        return (
          <div className="space-y-6 p-6 bg-background h-full">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <Music3 className="mr-2 h-6 w-6 text-primary" />
                    Gerenciamento de Áudios de Interação
                  </CardTitle>
                  <CardDescription>
                    Cadastre áudios que podem ser acionados por palavras-chave no chat, opcionalmente vinculados a presentes.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenUploadAudioDialog(null, true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Áudio
                </Button>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-250px)] overflow-y-auto">
                {isLoadingAudios ? (
                    <div className="flex justify-center items-center h-32"><LoadingSpinner /> <p className="ml-2 text-muted-foreground">Carregando áudios...</p></div>
                ) : interactionAudioSettings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Nenhum áudio de interação cadastrado.</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Palavra Chave</TableHead><TableHead>Presente Associado</TableHead><TableHead>Arquivo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {interactionAudioSettings.map((audio) => (
                        <TableRow key={audio.id}>
                          <TableCell className="font-medium">{audio.displayName}</TableCell>
                          <TableCell className="font-mono text-xs">{audio.keyword}</TableCell>
                          <TableCell className="text-xs">{audio.associatedGiftName || 'Nenhum'}</TableCell>
                          <TableCell className="text-xs truncate max-w-xs" title={audio.fileName}>{audio.fileName || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {audio.audioUrl && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => playAudio(audio.audioUrl, audio.id)}>
                                  {currentPlayingAudioId === audio.id ? <PauseCircleIcon className="h-4 w-4"/> : <PlayCircleIcon className="h-4 w-4" />}
                                </Button>
                              )}
                               <Button variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => {
                                    const fullSetting = interactionAudioSettings.find(s => s.id === audio.id);
                                    if (fullSetting) {
                                        handleOpenUploadAudioDialog(fullSetting, true);
                                    }
                                }}>
                                  <Edit2 className="h-4 w-4" />
                               </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleRemoveAudio(audio)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        );
      default:
        const currentItem = bingoSpecificMenuGroups.flatMap(g => g.items).find(i => i.id === activeTab);
        return (
            <div className="space-y-6 p-6 bg-background h-full">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {currentItem && currentItem.icon ? <currentItem.icon className="mr-2 h-6 w-6 text-primary" /> : <TicketIcon className="mr-2 h-6 w-6 text-primary" />}
                    {currentItem?.title || "Gerenciamento de Bingo"}
                  </CardTitle>
                  <CardDescription>
                    Selecione uma opção no menu para ver mais detalhes ou gerenciar aspectos específicos do bingo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Bem-vindo à administração de bingo. Escolha uma seção no menu lateral.</p>
                </CardContent>
              </Card>
            </div>
          );
    }
  };

  return (
    <>
    <div className="flex flex-col md:flex-row h-full gap-0 overflow-hidden">
      <nav className="md:w-72 lg:w-80 flex-shrink-0 border-r bg-muted/40 h-full overflow-y-auto p-4 space-y-4">
        {bingoSpecificMenuGroups.map((group, groupIndex) => (
          <div key={group.groupTitle || `bingo-admin-group-${groupIndex}`} className={cn(group.isBottomSection && "mt-auto pt-4 border-t")}>
            {group.groupTitle && (
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                {group.groupTitle}
              </h2>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full text-left h-auto text-sm font-normal rounded-md transition-all",
                      isActive
                        ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                        : "text-card-foreground hover:bg-card/80 bg-card shadow-sm hover:text-card-foreground",
                      "justify-between py-3 px-3"
                    )}
                    onClick={() => handleMenuClick(item)}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                      <span>{item.title}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <main className="flex-1 h-full overflow-y-auto">
        {renderBingoAdminContent()}
      </main>
    </div>
    {selectedCardForDetails && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl">Detalhes da Cartela: <span className="font-mono text-primary">{selectedCardForDetails.id}</span></DialogTitle>
              <DialogDescription>
                Informações completas da cartela de bingo selecionada.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(80vh-100px)] pr-4">
              <div className="space-y-6 py-4">

                {selectedCardForDetails.cardNumbers.length === 3 && selectedCardForDetails.cardNumbers[0].length === 9 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Visualização da Cartela (90 Bolas)</h3>
                    <div className="grid grid-cols-9 gap-0 bg-primary/10 border-2 border-primary rounded-lg p-0.5 w-full max-w-md mx-auto">
                      {selectedCardForDetails.cardNumbers.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                          <div
                            key={`detail-card-90-${rowIndex}-${colIndex}`}
                            className={cn(
                              "flex items-center justify-center h-12 text-lg font-semibold",
                              cell === null ? 'bg-primary/10' : 'bg-card text-primary'
                            )}
                          >
                            {cell !== null ? cell : ""}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
                 {selectedCardForDetails.cardNumbers.length === 5 && selectedCardForDetails.cardNumbers[0].length === 5 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Visualização da Cartela (75 Bolas)</h3>
                        <div className="grid grid-cols-5 gap-0 bg-primary/10 border-2 border-primary rounded-lg p-0.5 w-full max-w-xs mx-auto mb-2">
                          {['B', 'I', 'N', 'G', 'O'].map(letter => (
                            <div key={`header-${letter}`} className="flex items-center justify-center h-8 text-sm font-bold text-primary">
                              {letter}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-5 gap-0 bg-primary/10 border-2 border-primary rounded-lg p-0.5 w-full max-w-xs mx-auto">
                          {selectedCardForDetails.cardNumbers.map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                              <div
                                key={`detail-card-75-${rowIndex}-${colIndex}`}
                                className={cn(
                                  "flex items-center justify-center h-12 text-lg font-semibold",
                                  cell === null ? 'bg-yellow-300 text-yellow-700' : 'bg-card text-primary'
                                )}
                              >
                                {cell !== null ? cell : <Star className="h-5 w-5 text-yellow-600" />}
                              </div>
                            ))
                          )}
                        </div>
                    </div>
                 )}


                <Card>
                  <CardHeader><CardTitle className="text-md">Informações Básicas</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p><strong>ID do Criador:</strong> {selectedCardForDetails.creatorId}</p>
                    <p><strong>Data de Criação:</strong> {selectedCardForDetails.createdAt instanceof Date ? format(selectedCardForDetails.createdAt, "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : 'N/A'}</p>
                    <p><strong>Total de Vezes Premiada:</strong> {selectedCardForDetails.timesAwarded}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-md">Histórico de Uso ({selectedCardForDetails.usageHistory.length})</CardTitle></CardHeader>
                  <CardContent>
                    {selectedCardForDetails.usageHistory.length > 0 ? (
                      <div className="rounded-md border overflow-x-auto max-h-60">
                        <Table className="text-xs">
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID do Jogo</TableHead>
                              <TableHead>ID do Usuário</TableHead>
                              <TableHead>Data/Hora</TableHead>
                              <TableHead>Foi Ganhador?</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedCardForDetails.usageHistory.map((usage, index) => (
                              <TableRow key={`usage-${index}`}>
                                <TableCell>{usage.gameId}</TableCell>
                                <TableCell>{usage.userId}</TableCell>
                                <TableCell>{usage.timestamp instanceof Date ? format(usage.timestamp, "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                                <TableCell>{usage.isWinner ? "Sim" : "Não"}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum histórico de uso registrado.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-md">Histórico de Prêmios ({selectedCardForDetails.awardsHistory.length})</CardTitle></CardHeader>
                  <CardContent>
                    {selectedCardForDetails.awardsHistory.length > 0 ? (
                      <div className="rounded-md border overflow-x-auto max-h-60">
                        <Table className="text-xs">
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID do Jogo</TableHead>
                              <TableHead>ID do Ganhador</TableHead>
                              <TableHead>Data/Hora do Prêmio</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedCardForDetails.awardsHistory.map((award, index) => (
                              <TableRow key={`award-${index}`}>
                                <TableCell>{award.gameId}</TableCell>
                                <TableCell>{award.userId}</TableCell>
                                <TableCell>{award.timestamp instanceof Date ? format(award.timestamp, "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum prêmio registrado para esta cartela.</p>
                    )}
                  </CardContent>
                </Card>

              </div>
            </ScrollArea>
            <DialogFooter className="pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Fechar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isConfirmDeleteAll90BallCardsDialogOpen} onOpenChange={setIsConfirmDeleteAll90BallCardsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitleComponent>Confirmar Exclusão (90 Bolas)</AlertDialogTitleComponent>
            <AlertDialogDescription>
              Você tem certeza que deseja apagar TODAS as cartelas de 90 bolas geradas do banco de dados?
              Esta ação removerá os dados do banco de dados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDeleteAll90BallCardsDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAll90BallCards}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeleting90BallCards}
            >
               {isDeleting90BallCards ? <LoadingSpinner size="sm" className="mr-2"/> : null}
              Apagar Tudo (90 Bolas - DB)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmDeleteAll75BallCardsDialogOpen} onOpenChange={setIsConfirmDeleteAll75BallCardsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitleComponent>Confirmar Exclusão (75 Bolas)</AlertDialogTitleComponent>
            <AlertDialogDescription>
              Você tem certeza que deseja apagar TODAS as cartelas de 75 bolas geradas do banco de dados?
              Esta ação removerá os dados do banco de dados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDeleteAll75BallCardsDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAll75BallCards}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeleting75BallCards}
            >
              {isDeleting75BallCards ? <LoadingSpinner size="sm" className="mr-2"/> : null}
              Apagar Tudo (75 Bolas - DB)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    