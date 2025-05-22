
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, RefreshCw, Trash2, Gift as GiftIconLucide, DatabaseZap, PlusCircle, Save, Edit2, UploadCloud } from "lucide-react";
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
import {
  db,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  getDocs,
  writeBatch,
  Timestamp,
  updateDoc,
  storage,
  storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteFileStorage,
} from "@/lib/firebase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription as FormDesc, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

interface StatCardProps {
  title: string;
  count: string | number;
  icon: React.ElementType;
  iconColor?: string;
  bgColorClass?: string;
  textColorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, icon: Icon, iconColor = "text-primary", bgColorClass = "bg-primary/10", textColorClass = "text-primary" }) => (
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

const giftFormSchema = z.object({
  id: z.string().min(1, "ID do presente é obrigatório.").max(50, "ID muito longo."),
  name: z.string().min(1, "Nome do presente é obrigatório.").max(100, "Nome muito longo."),
  imageUrl: z.string().url({ message: "URL da imagem inválida." }).optional().or(z.literal('')),
  imageFile: z.instanceof(FileList).optional().nullable()
    .refine(files => !files || files.length <= 1, "Apenas um arquivo de imagem é permitido.")
    .refine(files => !files || !files?.[0] || files?.[0]?.size <= 2 * 1024 * 1024, "Imagem muito grande (máx 2MB).")
    .refine(files => !files || !files?.[0] || files?.[0]?.type.startsWith("image/"), "O arquivo deve ser uma imagem."),
  diamond: z.preprocess(
    (val) => (val === "" || val === null || val === undefined) ? undefined : Number(val),
    z.number({ invalid_type_error: "Diamantes deve ser um número" }).int("Diamantes deve ser um número inteiro.").min(0, "Diamantes deve ser zero ou positivo.").optional()
  ),
  display: z.boolean().default(true),
}).superRefine((data, ctx) => {
  // This refine is more for ADDING a new gift. For editing, an image might already exist even if not newly provided.
  // The form submission logic will handle image presence more robustly.
});

type GiftFormValues = z.infer<typeof giftFormSchema>;


export default function AdminKakoLiveGiftsPageContent() {
  const [kakoGifts, setKakoGifts] = useState<KakoGift[]>([]);
  const [isLoadingGifts, setIsLoadingGifts] = useState(true);
  const { toast } = useToast();

  const [isConfirmClearGiftsDBDialogOpen, setIsConfirmClearGiftsDBDialogOpen] = useState(false);
  const [isDeletingGiftsDB, setIsDeletingGiftsDB] = useState(false);

  const [isAddGiftDialogOpen, setIsAddGiftDialogOpen] = useState(false);
  const [addImageUploadProgress, setAddImageUploadProgress] = useState<number | null>(null);
  const addGiftImageFileRef = useRef<HTMLInputElement | null>(null);

  const [isEditGiftDialogOpen, setIsEditGiftDialogOpen] = useState(false);
  const [giftToEdit, setGiftToEdit] = useState<KakoGift | null>(null);
  const [editImageUploadProgress, setEditImageUploadProgress] = useState<number | null>(null);
  const editGiftImageFileRef = useRef<HTMLInputElement | null>(null);


  const fetchKakoGifts = useCallback(async () => {
    setIsLoadingGifts(true);
    try {
      const giftsCollectionRef = collection(db, "kakoGifts");
      const q = query(giftsCollectionRef, orderBy("id", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedGifts: KakoGift[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedGifts.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : undefined),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : undefined),
        } as KakoGift);
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
      const giftsCollectionRef = collection(db, "kakoGifts");
      const querySnapshot = await getDocs(giftsCollectionRef);
      if (querySnapshot.empty) {
        toast({ title: "Nada para Apagar", description: "A coleção 'kakoGifts' já está vazia." });
        setIsConfirmClearGiftsDBDialogOpen(false);
        setIsDeletingGiftsDB(false);
        return;
      }
      const batch = writeBatch(db);
      let count = 0;
      querySnapshot.docs.forEach((docSnap) => {
        const giftData = docSnap.data() as KakoGift;
        if (giftData.storagePath) {
          try {
            deleteFileStorage(storageRef(storage, giftData.storagePath));
          } catch (storageError) {
            console.warn(`Falha ao deletar imagem ${giftData.storagePath} do Storage:`, storageError);
          }
        }
        batch.delete(docSnap.ref);
        count++;
      });
      await batch.commit();
      setKakoGifts([]);
      toast({
        title: "Presentes Apagados do DB",
        description: "Todos os presentes (e imagens associadas) foram apagados do Firestore e Storage.",
      });
    } catch (error) {
      console.error("Erro ao apagar presentes do Firestore:", error);
      toast({ title: "Erro ao Apagar Presentes do DB", description: "Não foi possível apagar os presentes.", variant: "destructive" });
    } finally {
      setIsDeletingGiftsDB(false);
      setIsConfirmClearGiftsDBDialogOpen(false);
    }
  };

  const addGiftForm = useForm<GiftFormValues>({
    resolver: zodResolver(giftFormSchema),
    defaultValues: {
      id: "",
      name: "",
      imageUrl: "",
      imageFile: null,
      diamond: undefined,
      display: true,
    },
  });

  const editGiftForm = useForm<GiftFormValues>({
    resolver: zodResolver(giftFormSchema),
    defaultValues: {
      id: "", 
      name: "",
      imageUrl: "",
      imageFile: null,
      diamond: undefined,
      display: true,
    },
  });


  const onSubmitNewGift = async (values: GiftFormValues) => {
    console.log("Submitting new gift:", values);
    setAddImageUploadProgress(null);
    let imageUrlToSave = values.imageUrl || "";
    let storagePathToSave: string | undefined = undefined;

    try {
      const giftDocRef = doc(db, "kakoGifts", values.id);
      const docSnap = await getDoc(giftDocRef);

      if (docSnap.exists()) {
        toast({ title: "ID de Presente já Existe", description: `O ID '${values.id}' já está em uso.`, variant: "destructive" });
        setAddImageUploadProgress(null);
        return;
      }

      if (values.imageFile && values.imageFile.length > 0) {
        const file = values.imageFile[0];
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `kakoGiftsImages/${values.id}-${Date.now()}-${sanitizedFileName}`;
        const fileStorageRef = storageRef(storage, filePath);
        console.log("Uploading new gift image to:", filePath);

        setAddImageUploadProgress(0);
        const uploadTask = uploadBytesResumable(fileStorageRef, file);

        const uploadedUrlAndPath = await new Promise<{ url: string, path: string }>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => setAddImageUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            (error) => { console.error("New gift image upload failed:", error); reject(error); },
            async () => { 
              try { 
                const url = await getDownloadURL(uploadTask.snapshot.ref); 
                console.log("New gift image uploaded, URL:", url);
                resolve({ url, path: filePath }); 
              } catch (error) { 
                console.error("Failed to get download URL for new gift image:", error);
                reject(error); 
              } 
            }
          );
        });
        imageUrlToSave = uploadedUrlAndPath.url;
        storagePathToSave = uploadedUrlAndPath.path;
      } else if (!values.imageUrl) {
        toast({ title: "Imagem Obrigatória", description: "Forneça uma URL de imagem ou selecione um arquivo.", variant: "destructive" });
        setAddImageUploadProgress(null);
        return;
      }

      const newGiftData: KakoGift = {
        id: values.id,
        name: values.name,
        imageUrl: imageUrlToSave,
        storagePath: storagePathToSave,
        diamond: values.diamond ?? null,
        display: values.display,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        dataAiHint: values.name.toLowerCase().split(" ").find(word => word.length > 0) || "gift icon",
      };
      console.log("Saving new gift data to Firestore:", newGiftData);
      await setDoc(giftDocRef, newGiftData);
      toast({ title: "Presente Cadastrado!", description: `O presente '${values.name}' foi salvo.` });
      setIsAddGiftDialogOpen(false);
      addGiftForm.reset();
      fetchKakoGifts(); // Refresh list
    } catch (error) {
      console.error("Erro ao cadastrar presente:", error);
      toast({ title: "Erro ao Cadastrar", description: `Não foi possível salvar o presente. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setAddImageUploadProgress(null);
      if (addGiftImageFileRef.current) addGiftImageFileRef.current.value = "";
    }
  };

  const handleOpenEditGiftDialog = (gift: KakoGift) => {
    setGiftToEdit(gift);
    editGiftForm.reset({
      id: gift.id,
      name: gift.name,
      imageUrl: gift.imageUrl || "",
      imageFile: null, 
      diamond: gift.diamond ?? undefined,
      display: gift.display ?? true,
    });
    setEditImageUploadProgress(null);
    setIsEditGiftDialogOpen(true);
  };

  const onSubmitEditGift = async (values: GiftFormValues) => {
    console.log("Submitting edited gift:", values);
    if (!giftToEdit) {
      console.error("giftToEdit is null in onSubmitEditGift");
      toast({ title: "Erro", description: "Nenhum presente selecionado para edição.", variant: "destructive" });
      return;
    }
    setEditImageUploadProgress(null);

    let imageUrlToSave = giftToEdit.imageUrl;
    let storagePathToSave = giftToEdit.storagePath;
    let oldStoragePathToDelete: string | undefined = undefined;

    try {
      if (values.imageFile && values.imageFile.length > 0) {
        const file = values.imageFile[0];
        if (giftToEdit.storagePath) {
          oldStoragePathToDelete = giftToEdit.storagePath;
        }
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `kakoGiftsImages/${giftToEdit.id}-${Date.now()}-${sanitizedFileName}`;
        const fileStorageRef = storageRef(storage, filePath);
        console.log("Uploading edited gift image to:", filePath);

        setEditImageUploadProgress(0);
        const uploadTask = uploadBytesResumable(fileStorageRef, file);

        const uploadedUrlAndPath = await new Promise<{ url: string, path: string }>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => setEditImageUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            (error) => { console.error("Edited gift image upload failed:", error); reject(error); },
            async () => { 
              try { 
                const url = await getDownloadURL(uploadTask.snapshot.ref); 
                console.log("Edited gift image uploaded, URL:", url);
                resolve({ url, path: filePath }); 
              } catch (e) { 
                console.error("Failed to get download URL for edited gift image:", e);
                reject(e); 
              } 
            }
          );
        });
        imageUrlToSave = uploadedUrlAndPath.url;
        storagePathToSave = uploadedUrlAndPath.path;

        if (oldStoragePathToDelete) {
          console.log("Attempting to delete old image from storage:", oldStoragePathToDelete);
          try {
            await deleteFileStorage(storageRef(storage, oldStoragePathToDelete));
            console.log("Old image deleted successfully.");
          } catch (delError: any) {
             if (delError.code !== 'storage/object-not-found') console.warn("Erro ao deletar imagem antiga do Storage:", delError);
             else console.log("Old image not found, no deletion needed.");
          }
        }
      } else if (values.imageUrl !== giftToEdit.imageUrl) { // If text URL changed and no new file
        imageUrlToSave = values.imageUrl || ""; 
        if (giftToEdit.storagePath) { // If previous image was an upload, delete it
          oldStoragePathToDelete = giftToEdit.storagePath;
          console.log("Image URL changed to text, attempting to delete old stored image:", oldStoragePathToDelete);
          try {
            await deleteFileStorage(storageRef(storage, oldStoragePathToDelete));
            console.log("Old stored image deleted successfully.");
          } catch (delError: any) {
             if (delError.code !== 'storage/object-not-found') console.warn("Erro ao deletar imagem antiga do Storage ao mudar para URL externa:", delError);
             else console.log("Old stored image not found, no deletion needed.");
          }
        }
        storagePathToSave = undefined; // No longer an app-uploaded file
      }

      const updatedGiftData: Partial<KakoGift> & { updatedAt: any } = {
        name: values.name,
        imageUrl: imageUrlToSave,
        storagePath: storagePathToSave,
        diamond: values.diamond ?? null,
        display: values.display,
        updatedAt: serverTimestamp(),
        dataAiHint: values.name.toLowerCase().split(" ").find(word => word.length > 0) || "gift icon",
      };
      console.log("Updating gift data in Firestore:", giftToEdit.id, updatedGiftData);
      await setDoc(doc(db, "kakoGifts", giftToEdit.id), updatedGiftData, { merge: true });
      toast({ title: "Presente Atualizado!", description: `O presente '${values.name}' foi atualizado.` });
      
      // Update local state
      const localUpdatedAt = new Date(); // Use current date for local state
      setKakoGifts(prev => prev.map(g => g.id === giftToEdit!.id 
        ? { 
            ...giftToEdit!, // Keep existing fields like createdAt
            name: updatedGiftData.name!,
            imageUrl: updatedGiftData.imageUrl,
            storagePath: updatedGiftData.storagePath,
            diamond: updatedGiftData.diamond,
            display: updatedGiftData.display!,
            dataAiHint: updatedGiftData.dataAiHint,
            updatedAt: localUpdatedAt, 
          } 
        : g
      ));
      setIsEditGiftDialogOpen(false);
      editGiftForm.reset();

    } catch (error) {
      console.error("Erro ao atualizar presente:", error);
      toast({ title: "Erro ao Atualizar", description: `Não foi possível salvar as alterações. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setEditImageUploadProgress(null);
       if (editGiftImageFileRef.current) editGiftImageFileRef.current.value = "";
    }
  };


  return (
    <>
      <div className="space-y-6 h-full flex flex-col p-6">
        <div className="grid grid-cols-1 gap-4">
          <StatCard title="Total de Presentes (DB)" count={isLoadingGifts ? '...' : kakoGifts.length} icon={GiftIconLucide} bgColorClass="bg-orange-500/10" textColorClass="text-orange-500" />
        </div>

        <Card className="flex-grow flex flex-col min-h-0 shadow-lg">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="flex items-center"><GiftIconLucide className="mr-2 h-5 w-5 text-primary" /> Lista de Presentes Cadastrados</CardTitle>
              <CardDescription>Presentes disponíveis no sistema, recuperados do banco de dados 'kakoGifts'.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isAddGiftDialogOpen} onOpenChange={(open) => {
                setIsAddGiftDialogOpen(open);
                if (!open) {
                  addGiftForm.reset();
                  setAddImageUploadProgress(null);
                  if(addGiftImageFileRef.current) addGiftImageFileRef.current.value = "";
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <PlusCircle className="mr-2 h-4 w-4" /> Novo Presente
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Novo Presente Kako</DialogTitle>
                    <DialogDescription>
                      Preencha os detalhes do novo presente para adicioná-lo ao sistema. O ID deve ser o ID original do Kako.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...addGiftForm}>
                    <form onSubmit={addGiftForm.handleSubmit(onSubmitNewGift)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                      <FormField control={addGiftForm.control} name="id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID do Presente (do Kako)</FormLabel>
                            <FormControl><Input placeholder="Ex: 40" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={addGiftForm.control} name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Presente</FormLabel>
                            <FormControl><Input placeholder="Ex: Miau" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={addGiftForm.control} name="imageFile"
                         render={({ field: { onChange, value, ref: rhfRef, ...rest } }) => (
                          <FormItem>
                              <FormLabel>Arquivo da Imagem (Máx 2MB)</FormLabel>
                              <FormControl>
                                  <Input type="file" accept="image/*"
                                    ref={el => {
                                        if (typeof rhfRef === 'function') rhfRef(el);
                                        // @ts-ignore 
                                        else if (rhfRef) rhfRef.current = el;
                                        addGiftImageFileRef.current = el;
                                    }}
                                    onChange={(e) => {
                                      const files = e.target.files;
                                      if (files && files[0] && files[0].size > 2 * 1024 * 1024) {
                                          addGiftForm.setError("imageFile", {type: "manual", message: "Imagem muito grande (máx 2MB)."});
                                          onChange(null);
                                      } else if (files && files[0] && !files[0].type.startsWith("image/")) {
                                          addGiftForm.setError("imageFile", {type: "manual", message: "O arquivo deve ser uma imagem."});
                                          onChange(null);
                                      } else {
                                          addGiftForm.clearErrors("imageFile");
                                          onChange(files);
                                      }
                                    }}
                                    name={rest.name}
                                    onBlur={rest.onBlur}
                                  />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                        )}
                      />
                      {addImageUploadProgress !== null && (
                          <div className="space-y-1">
                              <Label className="text-xs">Progresso do Upload:</Label>
                              <Progress value={addImageUploadProgress} className="h-2" />
                              <p className="text-xs text-muted-foreground text-center">{Math.round(addImageUploadProgress)}%</p>
                          </div>
                      )}
                      <FormField control={addGiftForm.control} name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>OU URL da Imagem do Presente (se não for fazer upload)</FormLabel>
                            <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                            <FormDesc>Use se não for fazer upload de um arquivo. Se ambos forem fornecidos, o arquivo enviado terá prioridade.</FormDesc>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={addGiftForm.control} name="diamond"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor em Diamantes (Opcional)</FormLabel>
                            <FormControl><Input type="number" placeholder="Ex: 100" {...field} onChange={event => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={addGiftForm.control} name="display"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Visível na Loja?</FormLabel>
                              <FormDesc>Marque se este presente deve ser exibido.</FormDesc>
                            </div>
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                        <Button type="submit" disabled={addGiftForm.formState.isSubmitting || addImageUploadProgress !== null}>
                          { (addGiftForm.formState.isSubmitting || addImageUploadProgress !== null) ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                          Salvar Presente
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={fetchKakoGifts} disabled={isLoadingGifts} className="h-9">
                <RefreshCw className="mr-2 h-4 w-4" /> Atualizar Lista
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setIsConfirmClearGiftsDBDialogOpen(true)} className="h-9" disabled={isDeletingGiftsDB || kakoGifts.length === 0 || isLoadingGifts}>
                {isDeletingGiftsDB ? <LoadingSpinner size="sm" className="mr-2" /> : <DatabaseZap className="mr-2 h-4 w-4" />} Zerar DB
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow p-0 overflow-y-auto min-h-0">
            <div className="overflow-y-auto h-full">
              {isLoadingGifts ? (
                <div className="flex justify-center items-center h-full"><LoadingSpinner size="lg" /><p className="ml-2 text-muted-foreground">Carregando presentes...</p></div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Nome do Presente</TableHead>
                      <TableHead className="w-[100px]">Imagem</TableHead>
                      <TableHead>URL da Imagem</TableHead>
                      <TableHead className="text-right w-[100px]">Diamantes</TableHead>
                       <TableHead className="text-center w-[100px]">Display</TableHead>
                      <TableHead className="text-right w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kakoGifts.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Nenhum presente encontrado.</TableCell></TableRow>
                    ) : (
                      kakoGifts.map((gift) => (
                        <TableRow key={gift.id} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="font-mono text-xs">{gift.id}</TableCell>
                          <TableCell className="font-medium">{gift.name}</TableCell>
                          <TableCell>
                            {gift.imageUrl && (
                              <NextImage src={gift.imageUrl} alt={gift.name} width={40} height={40} className="rounded-md object-contain" data-ai-hint={gift.dataAiHint || "gift icon"} />
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground break-all max-w-xs truncate" title={gift.imageUrl}>{gift.imageUrl}</TableCell>
                          <TableCell className="text-right font-medium">{gift.diamond ?? 'N/A'}</TableCell>
                          <TableCell className="text-center">{gift.display ? "Sim" : "Não"}</TableCell>
                          <TableCell className="text-right">
                             <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => handleOpenEditGiftDialog(gift)}>
                                <Edit2 className="mr-1.5 h-3 w-3" /> Editar
                              </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-2 border-t flex justify-center">
            <p className="text-xs text-muted-foreground">Mostrando {kakoGifts.length} presentes cadastrados.</p>
          </CardFooter>
        </Card>
      </div>

      {/* Edit Gift Dialog */}
      {giftToEdit && (
        <Dialog open={isEditGiftDialogOpen} onOpenChange={(open) => {
            setIsEditGiftDialogOpen(open);
            if (!open) {
                setGiftToEdit(null);
                editGiftForm.reset();
                setEditImageUploadProgress(null);
                if(editGiftImageFileRef.current) editGiftImageFileRef.current.value = "";
            }
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Presente: {giftToEdit.name}</DialogTitle>
              <DialogDescription>Modifique os detalhes do presente.</DialogDescription>
            </DialogHeader>
            <Form {...editGiftForm}>
              <form onSubmit={editGiftForm.handleSubmit(onSubmitEditGift)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <FormField control={editGiftForm.control} name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID do Presente (do Kako)</FormLabel>
                      <FormControl><Input {...field} readOnly disabled className="bg-muted/50" /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField control={editGiftForm.control} name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Presente</FormLabel>
                      <FormControl><Input placeholder="Ex: Miau" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField control={editGiftForm.control} name="imageFile"
                    render={({ field: { onChange, value, ref: rhfRef, ...rest } }) => (
                      <FormItem>
                          <FormLabel>Enviar Nova Imagem (Opcional, máx 2MB, substitui URL/imagem existente)</FormLabel>
                          <FormControl>
                              <Input type="file" accept="image/*"
                                ref={el => {
                                    if (typeof rhfRef === 'function') rhfRef(el);
                                    // @ts-ignore
                                    else if (rhfRef) rhfRef.current = el;
                                    editGiftImageFileRef.current = el;
                                }}
                                onChange={(e) => {
                                    const files = e.target.files;
                                    if (files && files[0] && files[0].size > 2 * 1024 * 1024) {
                                        editGiftForm.setError("imageFile", {type: "manual", message: "Imagem muito grande (máx 2MB)."});
                                        onChange(null);
                                    } else if (files && files[0] && !files[0].type.startsWith("image/")) {
                                        editGiftForm.setError("imageFile", {type: "manual", message: "O arquivo deve ser uma imagem."});
                                        onChange(null);
                                    } else {
                                        editGiftForm.clearErrors("imageFile");
                                        onChange(files);
                                    }
                                }}
                                name={rest.name}
                                onBlur={rest.onBlur}
                              />
                          </FormControl>
                           {giftToEdit && giftToEdit.imageUrl && (!editGiftForm.getValues('imageFile') || editGiftForm.getValues('imageFile')?.length === 0) && (
                            <div className="mt-2 text-xs text-muted-foreground">
                                Imagem atual: <NextImage src={giftToEdit.imageUrl} alt="Imagem atual" width={32} height={32} className="inline-block rounded ml-1" data-ai-hint="current image" />
                            </div>
                           )}
                          <FormMessage />
                      </FormItem>
                  )}
                />
                {editImageUploadProgress !== null && (
                    <div className="space-y-1">
                        <Label className="text-xs">Progresso do Upload da Nova Imagem:</Label>
                        <Progress value={editImageUploadProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-center">{Math.round(editImageUploadProgress)}%</p>
                    </div>
                )}
                <FormField control={editGiftForm.control} name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OU URL da Imagem</FormLabel>
                      <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                       <FormDesc>Deixe em branco se estiver enviando um novo arquivo. Se ambos forem fornecidos, o arquivo enviado terá prioridade.</FormDesc>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={editGiftForm.control} name="diamond"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor em Diamantes (Opcional)</FormLabel>
                      <FormControl><Input type="number" placeholder="Ex: 100" {...field} onChange={event => field.onChange(event.target.value === '' ? undefined : Number(event.target.value))} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={editGiftForm.control} name="display"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Visível na Loja?</FormLabel>
                         <FormDesc>Marque se este presente deve ser exibido.</FormDesc>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={editGiftForm.formState.isSubmitting || editImageUploadProgress !== null}>
                    {(editGiftForm.formState.isSubmitting || editImageUploadProgress !== null) ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isConfirmClearGiftsDBDialogOpen} onOpenChange={setIsConfirmClearGiftsDBDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Confirmar Zerar Banco de Dados (Presentes)!</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja apagar TODOS os presentes da coleção 'kakoGifts' no Firestore e suas imagens associadas do Storage?
              <br />
              <strong className="text-destructive uppercase">Esta ação é irreversível e apagará os dados permanentemente.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmClearGiftsDBDialogOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClearAllGiftsFromDB}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeletingGiftsDB}
            >
              {isDeletingGiftsDB ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Zerar Banco de Dados (Presentes)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    