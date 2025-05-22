
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Star, User, UserCog, XCircle, Database, Link as LinkIcon, RefreshCw, ServerOff,
  FileText, Info, Headphones, LogOut, ChevronRight, Ticket as TicketIcon, Globe, Bell,
  ListChecks, Settings as SettingsIconLucide, PlusCircle, BarChart3, AlertTriangle,
  LayoutGrid, Trophy, Dice5, PlaySquare, FileJson, ShieldQuestion, Trash2, Gift, DollarSign, Save, CircleAlert, Grid2X2, Grid3X3, Zap, Calendar as CalendarIcon, Edit2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { GeneratedBingoCard, CardUsageInstance, AwardInstance, BingoPrize, Game } from '@/types';
import { format, parse, setHours, setMinutes, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import NextImage from 'next/image';
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
import { db, collection, query, where, orderBy, addDoc, getDocs, serverTimestamp, storage, storageRef, uploadBytesResumable, getDownloadURL, Timestamp, doc, updateDoc } from "@/lib/firebase"; 
import LoadingSpinner from '@/components/ui/loading-spinner';


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

const placeholderGenerated90BallCards: GeneratedBingoCard[] = [
  {
    id: 'card-90-001',
    cardNumbers: [
      [5, null, 30, null, 49, null, 61, null, 81],
      [8, 17, null, 32, null, 53, null, 70, 89],
      [null, 19, 22, null, 42, null, 55, null, 84]
    ],
    creatorId: 'user-creator-123',
    createdAt: new Date(),
    usageHistory: [
      { userId: 'player123', gameId: 'game789', timestamp: new Date(), isWinner: false },
      { userId: 'player456', gameId: 'gameXYZ', timestamp: new Date(Date.now() - 3600000), isWinner: true },
    ],
    timesAwarded: 1,
    awardsHistory: [
      { gameId: 'gameXYZ', userId: 'player456', timestamp: new Date(Date.now() - 3600000) }
    ]
  },
];

const placeholderGenerated75BallCards: GeneratedBingoCard[] = [
  {
    id: 'card-75-001',
    cardNumbers: [
      [1, 16, 31, 46, 61],
      [5, 20, 35, 50, 65],
      [10, 25, null, 55, 70], 
      [12, 28, 40, 58, 72],
      [15, 30, 45, 60, 75]
    ],
    creatorId: 'user-creator-75A',
    createdAt: new Date(Date.now() - 172800000), 
    usageHistory: [
      { userId: 'playerABC', gameId: 'game75-1', timestamp: new Date(), isWinner: false },
    ],
    timesAwarded: 0,
    awardsHistory: []
  },
];

const format90BallCardNumbersPreview = (numbers: (number | null)[][]): string => {
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
  if (data.prizeType === 'cash' && !data.prizeCashAmount && !data.prizeDescription) {
     ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe o valor do prêmio em dinheiro ou uma descrição.",
      path: ['prizeCashAmount'], // Or prizeDescription, depending on desired focus
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


export default function AdminBingoAdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useAuth(); 
  const { toast } = useToast();

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
    }
  ];

  const [activeTab, setActiveTab] = useState<string>('bingoPartidas');
  const [generated90BallCards, setGenerated90BallCards] = useState<GeneratedBingoCard[]>(placeholderGenerated90BallCards);
  const [generated75BallCards, setGenerated75BallCards] = useState<GeneratedBingoCard[]>(placeholderGenerated75BallCards);

  const [selectedCardForDetails, setSelectedCardForDetails] = useState<GeneratedBingoCard | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmDeleteAll90BallCardsDialogOpen, setIsConfirmDeleteAll90BallCardsDialogOpen] = useState(false);
  const [isConfirmDeleteAll75BallCardsDialogOpen, setIsConfirmDeleteAll75BallCardsDialogOpen] = useState(false);

  const [kakoPrizes, setKakoPrizes] = useState<BingoPrize[]>([]);
  const [isLoadingKakoPrizes, setIsLoadingKakoPrizes] = useState(true);
  const [isAddKakoPrizeDialogOpen, setIsAddKakoPrizeDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const [bingoGames, setBingoGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isCreateGameDialogOpen, setIsCreateGameDialogOpen] = useState(false);
  const [availableKakoPrizes, setAvailableKakoPrizes] = useState<BingoPrize[]>([]);
  const [isLoadingKakoPrizesForGameForm, setIsLoadingKakoPrizesForGameForm] = useState(false);


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

  const fetchKakoPrizes = useCallback(async (forGameForm: boolean = false) => {
    if (forGameForm) {
      setIsLoadingKakoPrizesForGameForm(true);
    } else {
      setIsLoadingKakoPrizes(true);
    }
    try {
      const prizesCollectionRef = collection(db, "bingoPrizes");
      const q = query(prizesCollectionRef, where("type", "==", "kako_virtual"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedPrizes: BingoPrize[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedPrizes.push({ id: docSnap.id, ...docSnap.data() } as BingoPrize);
      });
      if (forGameForm) {
        setAvailableKakoPrizes(fetchedPrizes);
      } else {
        setKakoPrizes(fetchedPrizes);
      }
    } catch (error) {
      console.error("Erro ao buscar prêmios Kako Live:", error);
      toast({ title: "Erro ao Carregar Prêmios", description: "Não foi possível carregar a lista de prêmios Kako Live.", variant: "destructive" });
    } finally {
      if (forGameForm) {
        setIsLoadingKakoPrizesForGameForm(false);
      } else {
        setIsLoadingKakoPrizes(false);
      }
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
          // Ensure startTime is converted to Date if it's a Firestore Timestamp
          startTime: data.startTime instanceof Timestamp ? data.startTime.toDate() : new Date(data.startTime),
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

  useEffect(() => {
    if (activeTab === 'bingoPremiosKako') {
      fetchKakoPrizes(false);
    }
    if (activeTab === 'bingoPartidas') {
      fetchBingoGames();
      fetchKakoPrizes(true); // Fetch for the form when partidas tab is active
    }
  }, [activeTab, fetchKakoPrizes, fetchBingoGames]);

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

    try {
      if (values.imageFile && values.imageFile.length > 0) {
        const file = values.imageFile[0];
        if (!file) {
          toast({ title: "Arquivo Inválido", description: "Nenhum arquivo selecionado para upload.", variant: "destructive" });
          return;
        }
        const filePath = `bingoPrizesImages/${Date.now()}-${file.name}`;
        const fileStorageRef = storageRef(storage, filePath);
        
        setUploadProgress(0);
        const uploadTask = uploadBytesResumable(fileStorageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error("Upload failed:", error);
              toast({ title: "Falha no Upload", description: "Não foi possível carregar a imagem.", variant: "destructive" });
              setUploadProgress(null);
              reject(error);
            },
            async () => {
              try {
                prizeImageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                setUploadProgress(null);
                resolve();
              } catch (error) {
                console.error("Failed to get download URL", error);
                toast({ title: "Falha ao Obter URL", description: "Não foi possível obter o link da imagem.", variant: "destructive" });
                setUploadProgress(null);
                reject(error);
              }
            }
          );
        });
      }

      const newPrizeData: Omit<BingoPrize, 'id' | 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        name: values.name,
        imageUrl: prizeImageUrl || undefined,
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
      toast({
        title: "Prêmio Cadastrado!",
        description: `O prêmio '${values.name}' foi salvo com sucesso.`,
      });
      setIsAddKakoPrizeDialogOpen(false);
      kakoPrizeForm.reset();
      fetchKakoPrizes(false); 
    } catch (error) {
      // Only show generic error if upload specific error wasn't shown
      if (uploadProgress === null) { 
         console.error("Erro ao cadastrar prêmio Kako Live:", error);
         toast({
           title: "Erro ao Cadastrar",
           description: "Não foi possível salvar o prêmio. Tente novamente.",
           variant: "destructive",
         });
      }
    } finally {
      setUploadProgress(null); // Ensure progress is cleared
    }
  };


  useEffect(() => {
    const hash = window.location.hash.substring(1); 
    const validTab = bingoSpecificMenuGroups.flatMap(g => g.items).find(item => item.id === hash);
    if (validTab) {
      setActiveTab(hash);
    } else {
      // Default to the first item of the first group if no valid hash
      const firstItemId = bingoSpecificMenuGroups[0]?.items[0]?.id || 'bingoPartidas';
      setActiveTab(firstItemId); 
      if (pathname === '/admin/bingo-admin' && window.location.hash !== `#${firstItemId}` && window.location.hash !== '') {
         // Correct the URL if it's on the base page but hash is wrong or empty
         router.replace(`/admin/bingo-admin#${firstItemId}`, { scroll: false });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Only run on pathname change, router will be stable

  const handleMenuClick = (item: BingoAdminMenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.link && item.link.startsWith("#")) {
      const newTabId = item.link.substring(1);
      setActiveTab(newTabId);
      router.push(`/admin/bingo-admin#${newTabId}`, { scroll: false });
    } else if (item.link) {
        // Handle full navigation if item.link is a complete path
        router.push(item.link); 
    }
  };

  const handleViewCardDetails = (card: GeneratedBingoCard) => {
    setSelectedCardForDetails(card);
    setIsDetailModalOpen(true);
  };

  const handleConfirmDeleteAll90BallCards = () => {
    setGenerated90BallCards([]);
    toast({title: "Cartelas Apagadas", description: "Todas as cartelas de 90 bolas foram removidas da lista (localmente)."});
    setIsConfirmDeleteAll90BallCardsDialogOpen(false);
  };

  const handleConfirmDeleteAll75BallCards = () => {
    setGenerated75BallCards([]);
    toast({title: "Cartelas Apagadas", description: "Todas as cartelas de 75 bolas foram removidas da lista (localmente)."});
    setIsConfirmDeleteAll75BallCardsDialogOpen(false);
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
                    Gerenciamento de Partidas e Configurações de Bingo
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
                                    {availableKakoPrizes.map(prize => (
                                      <SelectItem key={prize.id} value={prize.id!}>{prize.name}</SelectItem>
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
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                    disabled={generated75BallCards.length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Apagar Todas (75 Bolas - Local)
                  </Button>
                </div>
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
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleViewCardDetails(card)}>
                                <FileJson className="mr-1.5 h-3 w-3" /> Ver Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                 <p className="mt-4 text-xs text-muted-foreground">
                  Esta tabela mostrará as cartelas de 75 bolas.
                </p>
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
                  Visualize informações sobre as cartelas de bingo de 90 bolas geradas no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-end">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => setIsConfirmDeleteAll90BallCardsDialogOpen(true)}
                    disabled={generated90BallCards.length === 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Apagar Todas (90 Bolas - Local)
                  </Button>
                </div>
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
                            Nenhuma cartela de 90 bolas gerada encontrada.
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
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleViewCardDetails(card)}>
                                <FileJson className="mr-1.5 h-3 w-3" /> Ver Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                 <p className="mt-4 text-xs text-muted-foreground">
                  Esta tabela mostrará as cartelas conforme são registradas no sistema pelo backend. A funcionalidade de registro real e listagem do banco de dados está em desenvolvimento.
                </p>
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
                    <Dialog open={isAddKakoPrizeDialogOpen} onOpenChange={setIsAddKakoPrizeDialogOpen}>
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
                                                <FormLabel>Arquivo da Imagem (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="file" 
                                                        accept="image/*"
                                                        onChange={(e) => onChange(e.target.files)} 
                                                        {...rest} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {uploadProgress !== null && (
                                      <div className="space-y-1">
                                        <Label className="text-xs">Progresso do Upload:</Label>
                                        <Progress value={uploadProgress} className="h-2" />
                                        <p className="text-xs text-muted-foreground text-center">{Math.round(uploadProgress)}%</p>
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
                                        <Button type="submit" disabled={kakoPrizeForm.formState.isSubmitting || uploadProgress !== null}>
                                            {(kakoPrizeForm.formState.isSubmitting || uploadProgress !== null) ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
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
      default:
        return (
            <div className="space-y-6 p-6 bg-background h-full">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TicketIcon className="mr-2 h-6 w-6 text-primary" />
                    {bingoSpecificMenuGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.title || "Gerenciamento de Bingo"}
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
            <AlertDialogTitle>Confirmar Exclusão (90 Bolas)</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja apagar TODAS as cartelas de 90 bolas geradas desta lista?
              Esta ação é apenas local e não afeta o banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDeleteAll90BallCardsDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAll90BallCards}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Apagar Tudo (90 Bolas - Local)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmDeleteAll75BallCardsDialogOpen} onOpenChange={setIsConfirmDeleteAll75BallCardsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão (75 Bolas)</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja apagar TODAS as cartelas de 75 bolas geradas desta lista?
              Esta ação é apenas local e não afeta o banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDeleteAll75BallCardsDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteAll75BallCards}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Apagar Tudo (75 Bolas - Local)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

