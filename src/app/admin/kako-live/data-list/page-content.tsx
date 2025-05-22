
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Eye, RefreshCw, UserCircle2, Trash2, Gift as GiftIconLucide, DatabaseZap, PlusCircle, Save, FileJson, ChevronDown } from "lucide-react";
import NextImage from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { KakoProfile, KakoGift } from "@/types";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { db, doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch, Timestamp, addDoc } from "@/lib/firebase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription as FormDesc, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";


interface StatCardProps {
  title: string;
  count: string | number;
  icon: React.ElementType;
  iconColor?: string;
  bgColorClass?: string;
  textColorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, icon: Icon, iconColor = "text-primary", bgColorClass = "bg-primary/10", textColorClass="text-primary" }) => (
  <Card className="shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-2 rounded-lg ${bgColorClass}`}>
        <Icon className={`h-5 w-5 ${textColorClass}`} />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">{count}</div>
    </CardContent>
  </Card>
);

const newGiftSchema = z.object({
  id: z.string().min(1, "ID do presente é obrigatório.").max(50, "ID muito longo."),
  name: z.string().min(1, "Nome do presente é obrigatório.").max(100, "Nome muito longo."),
  imageUrl: z.string().url({ message: "URL da imagem inválida." }).min(1, "URL da imagem é obrigatória."),
  diamond: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : Number(val),
    z.number({ invalid_type_error: "Diamantes deve ser um número" }).int("Diamantes deve ser um número inteiro.").positive("Diamantes deve ser um número positivo.").optional()
  ),
  display: z.boolean().default(true),
});
type NewGiftFormValues = z.infer<typeof newGiftSchema>;


export default function AdminKakoLiveDataListPageContent() {
  const [kakoProfiles, setKakoProfiles] = useState<KakoProfile[]>([]);
  const [kakoGifts, setKakoGifts] = useState<KakoGift[]>([]);
  
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true); 
  const [isLoadingGifts, setIsLoadingGifts] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const [isConfirmClearProfilesDBDialogOpen, setIsConfirmClearProfilesDBDialogOpen] = useState(false); 
  const [isDeletingProfilesDB, setIsDeletingProfilesDB] = useState(false);

  const [isConfirmClearGiftsDBDialogOpen, setIsConfirmClearGiftsDBDialogOpen] = useState(false);
  const [isConfirmClearGiftsListLocalDialogOpen, setIsConfirmClearGiftsListLocalDialogOpen] = useState(false);
  const [isDeletingGiftsDB, setIsDeletingGiftsDB] = useState(false);
  const [isAddGiftDialogOpen, setIsAddGiftDialogOpen] = useState(false);


  const [selectedProfileForDetails, setSelectedProfileForDetails] = useState<KakoProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchKakoProfilesFromDB = useCallback(async () => {
    setIsLoadingProfiles(true);
    try {
      const profilesCollectionRef = collection(db, "kakoProfiles");
      const q = query(profilesCollectionRef, orderBy("lastFetchedAt", "desc")); // Order by recent activity
      const querySnapshot = await getDocs(q);
      const fetchedProfiles: KakoProfile[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedProfiles.push({
          id: docSnap.id, // FUID is the document ID
          nickname: data.nickname || "N/A",
          avatarUrl: data.avatar || data.avatarUrl || "", // Handle both 'avatar' and 'avatarUrl'
          level: data.level,
          numId: data.numId,
          showId: data.showId,
          gender: data.gender,
          signature: data.signature,
          area: data.area,
          school: data.school,
          roomId: data.roomId,
          isLiving: data.isLiving,
          lastFetchedAt: data.lastFetchedAt,
        });
      });
      setKakoProfiles(fetchedProfiles);
    } catch (error) {
      console.error("Erro ao buscar perfis Kako do Firestore:", error);
      toast({ title: "Erro ao Carregar Perfis", description: "Não foi possível carregar a lista de perfis do banco de dados.", variant: "destructive" });
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchKakoProfilesFromDB();
  }, [fetchKakoProfilesFromDB]);


  const fetchKakoGifts = useCallback(async () => {
    setIsLoadingGifts(true);
    try {
      const giftsCollectionRef = collection(db, "kakoGifts");
      const querySnapshot = await getDocs(giftsCollectionRef);
      const fetchedGifts: KakoGift[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedGifts.push({ id: docSnap.id, ...docSnap.data() } as KakoGift);
      });
      setKakoGifts(fetchedGifts.sort((a, b) => parseInt(a.id) - parseInt(b.id)));
    } catch (error) {
      console.error("Erro ao buscar presentes do Firestore:", error);
      toast({ title: "Erro ao Carregar Presentes", description: "Não foi possível carregar a lista de presentes.", variant: "destructive" });
    } finally {
      setIsLoadingGifts(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchKakoGifts();
  }, [fetchKakoGifts]);

  const handleConfirmClearProfilesDB = async () => {
    setIsDeletingProfilesDB(true);
    try {
      const querySnapshot = await getDocs(collection(db, "kakoProfiles"));
      if (querySnapshot.empty) {
        toast({ title: "Nada para Apagar", description: "A coleção 'kakoProfiles' já está vazia." });
        setIsConfirmClearProfilesDBDialogOpen(false);
        setIsDeletingProfilesDB(false);
        return;
      }
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      setKakoProfiles([]); 
      toast({
        title: "Perfis Apagados do DB",
        description: "Todos os perfis foram apagados da coleção 'kakoProfiles' no Firestore.",
      });
    } catch (error) {
      console.error("Erro ao apagar perfis do Firestore:", error);
      toast({ title: "Erro ao Apagar do DB", description: "Não foi possível apagar os perfis.", variant: "destructive" });
    } finally {
      setIsDeletingProfilesDB(false);
      setIsConfirmClearProfilesDBDialogOpen(false);
    }
  };

  const handleConfirmClearAllGiftsFromDB = async () => {
    setIsDeletingGiftsDB(true);
    try {
      const querySnapshot = await getDocs(collection(db, "kakoGifts"));
      if (querySnapshot.empty) {
        toast({ title: "Nada para Apagar", description: "A coleção 'kakoGifts' já está vazia." });
        setIsConfirmClearGiftsDBDialogOpen(false);
        setIsDeletingGiftsDB(false);
        return;
      }
      const batch = writeBatch(db);
      querySnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      setKakoGifts([]); 
      toast({
        title: "Presentes Apagados do DB",
        description: "Todos os presentes foram apagados da coleção 'kakoGifts' no Firestore.",
      });
    } catch (error) {
      console.error("Erro ao apagar presentes do Firestore:", error);
      toast({ title: "Erro ao Apagar Presentes do DB", description: "Não foi possível apagar os presentes.", variant: "destructive" });
    } finally {
      setIsDeletingGiftsDB(false);
      setIsConfirmClearGiftsDBDialogOpen(false);
    }
  };

  const handleConfirmClearGiftsListLocal = () => {
    setKakoGifts([]);
    toast({
      title: "Lista de Presentes Limpa (Local)",
      description: "Todos os presentes foram removidos da visualização atual (localmente).",
    });
    setIsConfirmClearGiftsListLocalDialogOpen(false);
  };

  const handleShowDetails = (profile: KakoProfile) => {
    setSelectedProfileForDetails(profile);
    setIsDetailModalOpen(true);
  };

  const giftForm = useForm<NewGiftFormValues>({
    resolver: zodResolver(newGiftSchema),
    defaultValues: {
      id: "",
      name: "",
      imageUrl: "",
      diamond: undefined,
      display: true,
    },
  });

  const onSubmitNewGift = async (values: NewGiftFormValues) => {
    try {
      const giftDocRef = doc(db, "kakoGifts", values.id);
      const docSnap = await getDoc(giftDocRef);

      if (docSnap.exists()) {
        toast({
          title: "ID de Presente já Existe",
          description: `O ID '${values.id}' já está em uso. Por favor, use um ID diferente.`,
          variant: "destructive",
        });
        return;
      }

      const newGiftData: Omit<KakoGift, 'diamond'> & {diamond?: number | null} = {
        id: values.id,
        name: values.name,
        imageUrl: values.imageUrl,
        display: values.display,
        diamond: values.diamond === undefined ? null : values.diamond, 
      };
      await setDoc(giftDocRef, newGiftData);
      toast({
        title: "Presente Cadastrado!",
        description: `O presente '${values.name}' foi salvo com sucesso.`,
      });
      setIsAddGiftDialogOpen(false);
      giftForm.reset();
      fetchKakoGifts(); 
    } catch (error) {
      console.error("Erro ao cadastrar presente:", error);
      toast({
        title: "Erro ao Cadastrar",
        description: "Não foi possível salvar o presente. Tente novamente.",
        variant: "destructive",
      });
    }
  };


  const filteredProfiles = kakoProfiles.filter(profile =>
    profile.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (profile.showId && profile.showId.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (profile.numId && profile.numId.toString().includes(searchTerm)) 
  );
  
  const displayLoadingProfiles = isLoadingProfiles;


  return (
    <>
      <div className="space-y-6 h-full flex flex-col p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Perfis Kako Live (do Banco de Dados)</h1>
            <p className="text-sm text-muted-foreground">Perfis Kako Live salvos no Firestore. Atualize esta lista manualmente.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-grow sm:flex-grow-0 sm:min-w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar perfis (Nome, ID Kako, Show ID...)"
                  className="pl-10 w-full h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={fetchKakoProfilesFromDB} className="h-10" disabled={isLoadingProfiles}>
                 <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar Lista
              </Button>
              <Button variant="destructive" onClick={() => setIsConfirmClearProfilesDBDialogOpen(true)} className="h-10" disabled={isDeletingProfilesDB || kakoProfiles.length === 0}>
                 {isDeletingProfilesDB ? <LoadingSpinner size="sm" className="mr-2"/> : <DatabaseZap className="mr-2 h-4 w-4" />}
                Zerar DB (Perfis)
              </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Total de Perfis (DB)" count={isLoadingProfiles ? '...' : kakoProfiles.length} icon={Users} bgColorClass="bg-sky-500/10" textColorClass="text-sky-500" />
          <StatCard title="Total de Presentes (DB)" count={isLoadingGifts ? '...' : kakoGifts.length} icon={GiftIconLucide} bgColorClass="bg-orange-500/10" textColorClass="text-orange-500" />
        </div>

        <Card className="flex-grow flex flex-col min-h-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/> Lista de Perfis do Kako Live (Salvos)</CardTitle>
            <CardDescription>Perfis identificados e salvos no Firestore.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <div className="overflow-x-auto h-full">
              {displayLoadingProfiles ? (
                <div className="flex justify-center items-center h-full">
                  <LoadingSpinner size="lg" />
                  <p className="ml-2 text-muted-foreground">Carregando perfis do banco de dados...</p>
                </div>
              ) : (
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[60px] px-4"></TableHead> 
                    <TableHead className="min-w-[200px]">NICKNAME / SHOW ID</TableHead>
                    <TableHead>NÍVEL</TableHead>
                    <TableHead>USER ID (FUID)</TableHead>
                    <TableHead className="text-right w-[200px]">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Nenhum perfil encontrado no banco de dados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfiles.map((profile) => (
                      <TableRow key={profile.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="px-4">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={profile.avatarUrl || undefined} alt={profile.nickname} data-ai-hint="user avatar" />
                            <AvatarFallback>
                                {profile.nickname ? profile.nickname.substring(0,2).toUpperCase() : <UserCircle2 />}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">
                            <div>
                              <span className="text-foreground">{profile.nickname}</span>
                              {profile.showId && <div className="text-xs text-muted-foreground">Show ID: {profile.showId}</div>}
                            </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            Nível {profile.level || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">{profile.id}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                             <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => handleShowDetails(profile)}>
                                <Eye className="mr-1.5 h-3 w-3" /> Detalhes
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                                  Ações <ChevronDown className="ml-1.5 h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => alert('Sincronizar dados do perfil: ' + profile.nickname)}>
                                  Sincronizar Dados
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" 
                                  onClick={() => {
                                    setKakoProfiles(prev => prev.filter(p => p.id !== profile.id));
                                    toast({title: "Removido da Lista (Local)", description: `Perfil de ${profile.nickname} removido da visualização.`});
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Remover da Lista (Local)
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              )}
            </div>
          </CardContent>
           <CardFooter className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">Mostrando {filteredProfiles.length} de {kakoProfiles.length} perfis salvos.</p>
          </CardFooter>
        </Card>

        <Card className="flex-grow flex flex-col min-h-0 shadow-lg mt-6">
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle className="flex items-center"><GiftIconLucide className="mr-2 h-5 w-5 text-primary"/> Lista de Presentes Cadastrados</CardTitle>
                    <CardDescription>Presentes recuperados do banco de dados 'kakoGifts'.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isAddGiftDialogOpen} onOpenChange={setIsAddGiftDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                                <PlusCircle className="mr-2 h-4 w-4" /> Novo Presente
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Cadastrar Novo Presente</DialogTitle>
                                <DialogDescription>
                                    Preencha os detalhes do novo presente para adicioná-lo ao sistema.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...giftForm}>
                                <form onSubmit={giftForm.handleSubmit(onSubmitNewGift)} className="space-y-4 py-4">
                                    <FormField
                                        control={giftForm.control}
                                        name="id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ID do Presente</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: 40" {...field} />
                                                </FormControl>
                                                <FormDesc>ID numérico ou string única do Kako Live.</FormDesc>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={giftForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Presente</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Miau" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={giftForm.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>URL da Imagem</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={giftForm.control}
                                        name="diamond"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Valor em Diamantes (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="Ex: 100" {...field} onChange={event => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={giftForm.control}
                                        name="display"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <div className="space-y-1 leading-none">
                                                    <FormLabel>Visível na Loja?</FormLabel>
                                                    <FormDesc>
                                                        Marque se este presente deve ser exibido na loja do Kako Live.
                                                    </FormDesc>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button" variant="outline">Cancelar</Button>
                                        </DialogClose>
                                        <Button type="submit" disabled={giftForm.formState.isSubmitting}>
                                            {giftForm.formState.isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                                            Salvar Presente
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={fetchKakoGifts} disabled={isLoadingGifts} className="h-9">
                        <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
                    </Button>
                     <Button variant="outline" size="sm" onClick={() => setIsConfirmClearGiftsListLocalDialogOpen(true)} className="h-9" disabled={kakoGifts.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" /> Limpar Tela
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setIsConfirmClearGiftsDBDialogOpen(true)} className="h-9" disabled={isDeletingGiftsDB || kakoGifts.length === 0}>
                        {isDeletingGiftsDB ? <LoadingSpinner size="sm" className="mr-2"/> : <DatabaseZap className="mr-2 h-4 w-4" />} Zerar DB
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-grow p-0">
                <div className="overflow-x-auto h-full">
                    {isLoadingGifts ? (
                        <div className="flex justify-center items-center h-full">
                            <LoadingSpinner size="lg" />
                            <p className="ml-2 text-muted-foreground">Carregando presentes...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-[80px]">ID</TableHead>
                                    <TableHead>Nome do Presente</TableHead>
                                    <TableHead className="w-[100px]">Imagem</TableHead>
                                    <TableHead>URL da Imagem</TableHead>
                                    <TableHead className="text-right w-[100px]">Diamantes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {kakoGifts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Nenhum presente encontrado no banco de dados.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    kakoGifts.map((gift) => (
                                        <TableRow key={gift.id} className="hover:bg-muted/20 transition-colors">
                                            <TableCell className="font-mono text-xs">{gift.id}</TableCell>
                                            <TableCell className="font-medium">{gift.name}</TableCell>
                                            <TableCell>
                                                {gift.imageUrl && (
                                                    <NextImage
                                                        src={gift.imageUrl}
                                                        alt={gift.name}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-md object-contain"
                                                        data-ai-hint="gift icon"
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground break-all">{gift.imageUrl}</TableCell>
                                            <TableCell className="text-right font-medium">{gift.diamond ?? 'N/A'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </CardContent>
            <CardFooter className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Mostrando {kakoGifts.length} presentes.</p>
            </CardFooter>
        </Card>

      </div>

      {selectedProfileForDetails && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Avatar className="h-10 w-10 mr-3 border">
                    <AvatarImage src={selectedProfileForDetails.avatarUrl} alt={selectedProfileForDetails.nickname} data-ai-hint="user avatar" />
                    <AvatarFallback>
                        {selectedProfileForDetails.nickname ? selectedProfileForDetails.nickname.substring(0,2).toUpperCase() : <UserCircle2 />}
                    </AvatarFallback>
                </Avatar>
                Detalhes de: {selectedProfileForDetails.nickname}
              </DialogTitle>
              <DialogDescription>
                Informações detalhadas do perfil Kako Live identificadas via WebSocket e salvas no Firestore.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-2">
                <div className="grid gap-3 py-4 text-sm">
                  <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">User ID (FUID):</span>
                    <span className="break-all font-mono text-xs">{selectedProfileForDetails.id}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">Nickname:</span>
                    <span>{selectedProfileForDetails.nickname}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">Show ID:</span>
                    <span>{selectedProfileForDetails.showId || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">Nível:</span>
                    <span>{selectedProfileForDetails.level || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">Num ID:</span>
                    <span>{selectedProfileForDetails.numId || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">Gênero:</span>
                    <span>{selectedProfileForDetails.gender === 1 ? "Masculino" : selectedProfileForDetails.gender === 2 ? "Feminino" : "N/A"}</span>
                  </div>
                   <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">Na Live:</span>
                    <span>{selectedProfileForDetails.isLiving === true ? "Sim" : selectedProfileForDetails.isLiving === false ? "Não" : "N/A"}</span>
                  </div>
                   <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">Room ID:</span>
                    <span>{selectedProfileForDetails.roomId || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                    <span className="font-medium text-muted-foreground">Assinatura (Bio):</span>
                    <span className="break-words">{selectedProfileForDetails.signature || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">Área:</span>
                    <span>{selectedProfileForDetails.area || "N/A"}</span>
                  </div>
                   <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">Escola:</span>
                    <span>{selectedProfileForDetails.school || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <span className="font-medium text-muted-foreground">Visto pela Última Vez:</span>
                    <span>
                        {selectedProfileForDetails.lastFetchedAt instanceof Timestamp 
                          ? format(selectedProfileForDetails.lastFetchedAt.toDate(), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) 
                          : selectedProfileForDetails.lastFetchedAt instanceof Date
                            ? format(selectedProfileForDetails.lastFetchedAt, "dd/MM/yyyy HH:mm:ss", { locale: ptBR })
                            : 'N/A'
                        }
                    </span>
                  </div>
                   <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                    <span className="font-medium text-muted-foreground">Avatar URL:</span>
                    <span className="break-all text-xs">{selectedProfileForDetails.avatarUrl || "N/A"}</span>
                  </div>
                </div>
            </ScrollArea>
            <DialogFooter className="mt-2 pt-4 border-t">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Fechar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isConfirmClearProfilesDBDialogOpen} onOpenChange={setIsConfirmClearProfilesDBDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Confirmar Zerar Banco de Dados (Perfis)!</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja apagar <strong className="text-destructive">TODOS</strong> os perfis da coleção 'kakoProfiles' no Firestore?
              <br />
              <strong className="text-destructive uppercase">Esta ação é irreversível e apagará os dados permanentemente do banco de dados.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmClearProfilesDBDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearProfilesDB}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeletingProfilesDB}
            >
              {isDeletingProfilesDB ? <LoadingSpinner size="sm" className="mr-2"/> : null}
              Zerar Banco de Dados (Perfis)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <AlertDialog open={isConfirmClearGiftsListLocalDialogOpen} onOpenChange={setIsConfirmClearGiftsListLocalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Limpar Tela (Presentes)</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja limpar todos os presentes da visualização atual? Esta ação é apenas local e não afeta o banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmClearGiftsListLocalDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearGiftsListLocal}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Limpar Tela (Presentes)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmClearGiftsDBDialogOpen} onOpenChange={setIsConfirmClearGiftsDBDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Confirmar Zerar Banco de Dados (Presentes)!</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja apagar <strong className="text-destructive">TODOS</strong> os presentes da coleção 'kakoGifts' no Firestore?
              <br />
              <strong className="text-destructive uppercase">Esta ação é irreversível e apagará os dados permanentemente do banco de dados.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmClearGiftsDBDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearAllGiftsFromDB}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeletingGiftsDB}
            >
              {isDeletingGiftsDB ? <LoadingSpinner size="sm" className="mr-2"/> : null}
              Zerar Banco de Dados (Presentes)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

