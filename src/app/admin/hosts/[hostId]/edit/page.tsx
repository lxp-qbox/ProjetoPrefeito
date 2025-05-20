
"use client";

import { useEffect, useState } from "react";
import type { Control, FieldValues } from "react-hook-form"; // Added for Controller
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form"; // Added Controller
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { db, doc, getDoc, updateDoc, serverTimestamp, type UserProfile } from "@/lib/firebase";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { countries } from "@/lib/countries";

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
  adminLevel: z.enum(["master", "admin", "suporte", ""]).nullable().optional(),
  bio: z.string().max(160, "Bio não pode exceder 160 caracteres.").optional(),
});

type EditHostFormValues = z.infer<typeof editHostSchema>;

export default function EditHostPage() {
  const router = useRouter();
  const params = useParams();
  const hostId = params.hostId as string;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hostData, setHostData] = useState<UserProfile | null>(null);

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

  const onSubmit = async (data: EditHostFormValues) => {
    if (!hostId) return;
    setIsSaving(true);
    try {
      const hostDocRef = doc(db, "users", hostId);
      const updateData: Partial<UserProfile> = {
        profileName: data.profileName,
        displayName: data.profileName,
        kakoLiveId: data.kakoLiveId,
        phoneNumber: data.phoneNumber?.replace(/[^\d+]/g, ""),
        hostStatus: data.hostStatus,
        adminLevel: data.adminLevel === "" ? null : data.adminLevel,
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
                        onValueChange={(value) => field.onChange(value === "" ? null : value as UserProfile['adminLevel'])}
                        value={field.value === null ? "" : field.value || ""}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Selecione um nível" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
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
              <Button type="submit" disabled={isSaving}>
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
