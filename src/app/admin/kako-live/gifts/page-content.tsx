
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RefreshCw, Trash2, Gift as GiftIconLucide, DatabaseZap, PlusCircle, Save, FileJson } from "lucide-react";
import NextImage from "next/image";
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
import type { KakoGift } from "@/types";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { db, doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch, Timestamp, addDoc, orderBy } from "@/lib/firebase";
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


export default function AdminKakoLiveGiftsPageContent() {
  const [kakoGifts, setKakoGifts] = useState<KakoGift[]>([]);
  const [isLoadingGifts, setIsLoadingGifts] = useState(true);
  const { toast } = useToast();
  
  const [isConfirmClearGiftsDBDialogOpen, setIsConfirmClearGiftsDBDialogOpen] = useState(false);
  const [isConfirmClearGiftsListLocalDialogOpen, setIsConfirmClearGiftsListLocalDialogOpen] = useState(false);
  const [isDeletingGiftsDB, setIsDeletingGiftsDB] = useState(false);
  const [isAddGiftDialogOpen, setIsAddGiftDialogOpen] = useState(false);

  const fetchKakoGifts = useCallback(async () => {
    setIsLoadingGifts(true);
    try {
      const giftsCollectionRef = collection(db, "kakoGifts");
      const q = query(giftsCollectionRef, orderBy("id", "asc")); // Order by ID
      const querySnapshot = await getDocs(q);
      const fetchedGifts: KakoGift[] = [];
      querySnapshot.forEach((docSnap) => {
        fetchedGifts.push({ id: docSnap.id, ...docSnap.data() } as KakoGift);
      });
      setKakoGifts(fetchedGifts);
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

      const newGiftData: Omit<KakoGift, 'diamond'> & {diamond?: number | null, createdAt: any} = {
        id: values.id,
        name: values.name,
        imageUrl: values.imageUrl,
        display: values.display,
        diamond: values.diamond === undefined ? null : values.diamond, 
        createdAt: serverTimestamp(),
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

  return (
    <>
      <div className="space-y-6 h-full flex flex-col p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Gerenciamento de Presentes Kako Live</h1>
            <p className="text-sm text-muted-foreground">Cadastre e visualize os presentes disponíveis no Kako Live.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Total de Presentes (DB)" count={isLoadingGifts ? '...' : kakoGifts.length} icon={GiftIconLucide} bgColorClass="bg-orange-500/10" textColorClass="text-orange-500" />
        </div>

        <Card className="flex-grow flex flex-col min-h-0 shadow-lg">
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
                                <DialogTitle>Cadastrar Novo Presente Kako</DialogTitle>
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
                                                <FormLabel>ID do Presente (do Kako)</FormLabel>
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
