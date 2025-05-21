
"use client";

import { useEffect, useState } from "react";
import type { Control, FieldValues } from "react-hook-form";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db, doc, getDoc, updateDoc, serverTimestamp, type UserProfile } from "@/lib/firebase";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ArrowLeft, Save, Search as SearchIcon } from "lucide-react";
import Link from "next/link";

interface SimulatedKakoProfile {
  id: string; 
  numId?: number;
  nickname: string;
  signature: string;
}

const simulatedKakoProfiles: SimulatedKakoProfile[] = [
  {
    id: "0322d2dd57e74a028a9e72c2fae1fd9a", 
    numId: 1008850234,
    nickname: "PRESIDENTE",
    signature: "✨The Presidential Agency, é uma organização de alto desempenho que opera sob contrato e rígidas diretrizes internas.",
  },
  {
    id: "c2e7c033b41243b5b09f42aa50edf4a1", 
    numId: 1001007128,
    nickname: "KAROL❤️WILLIAN🦊FOX",
    signature: "Amor e lealdade sempre!",
  },
  {
    id: "38091a3fedba40de9e5ce2d9a72c6ab8", // New profile based on your URL's fuid
    nickname: "Meu Perfil Kako",
    signature: "Esta é a minha bio do Kako Live!",
  },
  {
    id: "12345simulado", 
    nickname: "Host Simulado",
    signature: "Esta é uma bio simulada para testes.",
  }
];

const formatPhoneNumberForDisplay = (value: string): string => {
  if (!value.trim()) return "";
  const originalStartsWithPlus = value.charAt(0) === '+';
  let digitsOnly = (originalStartsWithPlus ? value.substring(1) : value).replace(/[^\d]/g, '');
  digitsOnly = digitsOnly.slice(0, 15);
  const len = digitsOnly.length;
  if (len === 0) return originalStartsWithPlus ? "+" : "";
  let formatted = "+";
  if (len <= 2) formatted += digitsOnly;
  else if (len <= 4) formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2)})`;
  else if (len <= 9) formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2, 4)}) ${digitsOnly.slice(4)}`;
  else formatted += `${digitsOnly.slice(0, 2)} (${digitsOnly.slice(2, 4)}) ${digitsOnly.slice(4, 9)}-${digitsOnly.slice(9)}`;
  return formatted;
};

const editHostSchema = z.object({
  profileName: z.string().min(2, "Nome do perfil deve ter pelo menos 2 caracteres.").max(50, "Nome do perfil muito longo."),
  kakoLiveId: z.string().optional(),
  phoneNumber: z.string().optional(),
  hostStatus: z.enum(["approved", "pending_review", "banned"]),
  adminLevel: z.enum(["master", "admin", "suporte"]).nullable().optional(),
  bio: z.string().max(160, "Bio não pode exceder 160 caracteres.").optional(),
});

type EditHostFormValues = z.infer<typeof editHostSchema>;

const NONE_ADMIN_LEVEL_VALUE = "__none__";

export default function EditHostPage() {
  const router = useRouter();
  const params = useParams();
  const hostId = params.hostId as string;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hostData, setHostData] = useState<UserProfile | null>(null);

  const [kakoProfileUrl, setKakoProfileUrl] = useState("");
  const [isFetchingKakoData, setIsFetchingKakoData] = useState(false);

  const form = useForm<EditHostFormValues>({
    resolver: zodResolver(editHostSchema),
    defaultValues: {
      profileName: "",
      kakoLiveId: "",
      phoneNumber: "",
      hostStatus: "pending_review",
      adminLevel: null,
      bio: "",
    },
  });

  useEffect(() => {
    if (hostId) {
      const fetchHostData = async () => {
        setIsLoading(true);
        try {
          const hostDocRef = doc(db, "users", hostId);
          const hostDocSnap = await getDoc(hostDocRef);
          if (hostDocSnap.exists()) {
            const data = hostDocSnap.data() as UserProfile;
            setHostData(data);
            form.reset({
              profileName: data.profileName || data.displayName || "",
              kakoLiveId: data.kakoLiveId || "",
              phoneNumber: data.phoneNumber ? formatPhoneNumberForDisplay(data.phoneNumber) : "",
              hostStatus: data.hostStatus || "pending_review",
              adminLevel: data.adminLevel || null,
              bio: data.bio || "",
            });
          } else {
            toast({ title: "Erro", description: "Host não encontrado.", variant: "destructive" });
            router.push("/admin/hosts");
          }
        } catch (error) {
          console.error("Erro ao buscar dados do host:", error);
          toast({ title: "Erro", description: "Não foi possível carregar os dados do host.", variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      };
      fetchHostData();
    }
  }, [hostId, toast, router, form]);

  const handleFetchKakoData = async () => {
    if (!kakoProfileUrl.trim()) {
      toast({ title: "URL Inválida", description: "Por favor, insira uma URL do perfil Kako Live.", variant: "destructive" });
      return;
    }
    setIsFetchingKakoData(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

    let foundProfile: SimulatedKakoProfile | undefined = undefined;
    for (const profile of simulatedKakoProfiles) {
      if (kakoProfileUrl.includes(profile.id) || (profile.numId && kakoProfileUrl.includes(profile.numId.toString()))) {
        foundProfile = profile;
        break;
      }
    }

    if (foundProfile) {
      form.setValue("profileName", foundProfile.nickname, { shouldValidate: true });
      form.setValue("kakoLiveId", foundProfile.id, { shouldValidate: true });
      form.setValue("bio", foundProfile.signature, { shouldValidate: true });
      toast({ title: "Dados Encontrados", description: "Campos do formulário preenchidos com dados do Kako Live." });
    } else {
      toast({ title: "Dados Não Encontrados", description: "Não foi possível encontrar um perfil Kako Live para esta URL ou ID.", variant: "destructive" });
    }
    setIsFetchingKakoData(false);
  };


  const onSubmit = async (data: EditHostFormValues) => {
    if (!hostId) return;
    setIsSaving(true);
    try {
      const hostDocRef = doc(db, "users", hostId);
      const updateData: Partial<UserProfile> = {
        profileName: data.profileName,
        displayName: data.profileName, // Keep displayName in sync with profileName
        kakoLiveId: data.kakoLiveId,
        phoneNumber: data.phoneNumber?.replace(/[^\d+]/g, ""), // Save cleaned number
        hostStatus: data.hostStatus,
        adminLevel: data.adminLevel,
        bio: data.bio,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(hostDocRef, updateData);
      toast({ title: "Sucesso", description: "Perfil do host atualizado." });
      router.push("/admin/hosts");
    } catch (error) {
      console.error("Erro ao atualizar host:", error);
      toast({ title: "Erro", description: "Não foi possível atualizar o perfil do host.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!hostData) {
    return (
      <div className="p-6 text-center">
        <p>Host não encontrado ou dados indisponíveis.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/admin/hosts">Voltar para Lista de Hosts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Edit Profile</h1>
        <Button variant="outline" asChild>
          <Link href="/admin/hosts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Lista
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Capturar Dados do Perfil Kako Live</CardTitle>
          <CardDescription>Insira a URL do perfil Kako Live para tentar preencher automaticamente alguns campos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="kakoProfileUrl">URL do Perfil Kako Live</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="kakoProfileUrl"
                placeholder="https://app.kako.live/app/profile/..."
                value={kakoProfileUrl}
                onChange={(e) => setKakoProfileUrl(e.target.value)}
              />
              <Button onClick={handleFetchKakoData} disabled={isFetchingKakoData || !kakoProfileUrl.trim()}>
                {isFetchingKakoData ? <LoadingSpinner size="sm" className="mr-2" /> : <SearchIcon className="mr-2 h-4 w-4" />}
                Buscar Dados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Informações do Host</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Row 1: Profile Name, Kako ID, Email */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="profileName">Nome do Perfil</Label>
                <Input id="profileName" {...form.register("profileName")} className="mt-1" />
                {form.formState.errors.profileName && <p className="text-xs text-destructive mt-1">{form.formState.errors.profileName.message}</p>}
              </div>
              <div>
                <Label htmlFor="kakoLiveId">ID Kako Live</Label>
                <Input id="kakoLiveId" {...form.register("kakoLiveId")} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={hostData.email || "N/A"} readOnly disabled className="mt-1 bg-muted/50" />
              </div>
            </div>

            {/* Row 2: Phone Number, Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="phoneNumber">Número de WhatsApp</Label>
                <Input
                  id="phoneNumber"
                  {...form.register("phoneNumber")}
                  onChange={(e) => form.setValue("phoneNumber", formatPhoneNumberForDisplay(e.target.value))}
                  className="mt-1"
                  placeholder="+00 (00) 00000-0000"
                />
              </div>
              <div>
                <Label htmlFor="country">País</Label>
                <Input id="country" value={hostData.country || "N/A"} readOnly disabled className="mt-1 bg-muted/50" />
              </div>
            </div>
            
            {/* Row 3: Host Status, Admin Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="hostStatus">Status do Host</Label>
                <Controller
                  control={form.control as unknown as Control<FieldValues>}
                  name="hostStatus"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || "pending_review"}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione um status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="pending_review">Pendente</SelectItem>
                        <SelectItem value="banned">Banido</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <Label htmlFor="adminLevel">Nível Admin</Label>
                 <Controller
                  control={form.control as unknown as Control<FieldValues>}
                  name="adminLevel"
                  render={({ field }) => (
                    <Select
                        onValueChange={(value) => field.onChange(value === NONE_ADMIN_LEVEL_VALUE ? null : value as UserProfile['adminLevel'])}
                        value={field.value === null || field.value === undefined ? NONE_ADMIN_LEVEL_VALUE : field.value}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione um nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_ADMIN_LEVEL_VALUE}>Nenhum</SelectItem>
                        <SelectItem value="master">Master</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="suporte">Suporte</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* About Me / Bio */}
            <div>
              <Label htmlFor="bio">Bio (Sobre Mim)</Label>
              <Textarea id="bio" {...form.register("bio")} className="mt-1" rows={4} />
              {form.formState.errors.bio && <p className="text-xs text-destructive mt-1">{form.formState.errors.bio.message}</p>}
            </div>

            <CardFooter className="px-0 pt-6 pb-0 flex justify-end">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/hosts")} className="mr-2">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving || isFetchingKakoData}>
                {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                Update Profile
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
    
