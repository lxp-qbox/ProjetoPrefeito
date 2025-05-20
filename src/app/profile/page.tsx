
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Mail, UserCircle2, Edit3, ShieldCheck, BadgeCent, Fingerprint, CalendarIcon as LucideCalendarIcon, Save, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import type { UserProfile } from "@/types";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { db, doc, updateDoc, serverTimestamp } from "@/lib/firebase";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [editableGender, setEditableGender] = useState<UserProfile['gender'] | undefined>(undefined);
  const [editableBirthDate, setEditableBirthDate] = useState<Date | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditableGender(currentUser.gender || 'preferNotToSay');
      if (currentUser.birthDate) {
        try {
            // Attempt to parse date string that might be YYYY-MM-DD
            const parsedDate = parseISO(currentUser.birthDate);
            if (!isNaN(parsedDate.getTime())) {
                 setEditableBirthDate(parsedDate);
            } else {
                // Handle cases where birthDate might not be in a directly parseable ISO format
                // For example, if it was just a string like '20/05/1990' (not recommended for storage)
                // This part might need more robust parsing if your stored dates are varied
                console.warn("Could not parse birthDate from currentUser:", currentUser.birthDate);
                const dateParts = currentUser.birthDate.split('-');
                if (dateParts.length === 3) {
                    const year = parseInt(dateParts[0], 10);
                    const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
                    const day = parseInt(dateParts[2], 10);
                    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                         setEditableBirthDate(new Date(year, month, day));
                    }
                }
            }
        } catch (error) {
            console.error("Error parsing birthDate from currentUser:", error);
            // Set to undefined or some default if parsing fails
            setEditableBirthDate(undefined);
        }
      } else {
        setEditableBirthDate(undefined);
      }
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Sessão Encerrada", description: "Você foi desconectado com sucesso." });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Falha ao Sair", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) {
      toast({ title: "Erro", description: "Usuário não encontrado.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    const dataToUpdate: Partial<UserProfile> = {
      updatedAt: serverTimestamp(),
    };

    if (editableGender) {
      dataToUpdate.gender = editableGender;
    }
    if (editableBirthDate) {
      dataToUpdate.birthDate = format(editableBirthDate, "yyyy-MM-dd");
    }

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, dataToUpdate);
      toast({ title: "Perfil Atualizado", description: "Suas informações foram salvas." });
      // Note: For immediate UI update of currentUser in context, a more robust solution
      // (like a context update function or re-fetch) would be needed.
      // For now, the form fields reflect the saved state.
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar suas informações.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };


  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const displayName = currentUser?.profileName || currentUser?.displayName || "Usuário";
  const maxCalendarDate = new Date();
  const minCalendarDate = subYears(new Date(), 100);

  return (
    <ProtectedPage>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/50 shadow-md">
              <AvatarImage src={currentUser?.photoURL || undefined} alt={displayName} />
              <AvatarFallback className="text-3xl">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-3xl font-bold">
                {displayName}
              </CardTitle>
              {currentUser?.isVerified && <ShieldCheck className="h-7 w-7 text-primary" />}
            </div>
            <CardDescription>Gerencie os detalhes e preferências da sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary flex items-center">
                <UserCircle2 className="mr-2 h-5 w-5" /> Informações da Conta
              </h3>
              <div className="p-4 border rounded-md bg-muted/50 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="flex items-center text-sm">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                    {currentUser?.email}
                  </p>
                </div>

                {currentUser?.kakoLiveId && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Passaporte KakoLive</Label>
                    <p className="flex items-center text-sm">
                      <Fingerprint className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                      {currentUser.kakoLiveId}
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Função</Label>
                    <div className="flex items-center text-sm">
                        <Briefcase className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <Badge variant={currentUser?.role === 'admin' || currentUser?.role === 'master' ? 'destructive' : 'secondary'}>
                        {currentUser?.role}
                        </Badge>
                    </div>
                </div>
                
                <div className="space-y-1 pt-2">
                  <Label htmlFor="gender-select" className="text-sm font-medium">Sexo</Label>
                  <Select
                    value={editableGender}
                    onValueChange={(value) => setEditableGender(value as UserProfile['gender'])}
                  >
                    <SelectTrigger id="gender-select" className="w-full">
                      <SelectValue placeholder="Selecione seu sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                      <SelectItem value="preferNotToSay">Prefiro não dizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="birthdate-picker" className="text-sm font-medium">
                    Data de Nascimento
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="birthdate-picker"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-10", // Adjusted height to h-10 for consistency
                          !editableBirthDate && "text-muted-foreground"
                        )}
                      >
                        <LucideCalendarIcon className="mr-2 h-4 w-4" />
                        {editableBirthDate ? (
                          format(editableBirthDate, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editableBirthDate}
                        onSelect={setEditableBirthDate}
                        initialFocus
                        locale={ptBR}
                        captionLayout="dropdown-buttons"
                        fromYear={minCalendarDate.getFullYear()}
                        toYear={maxCalendarDate.getFullYear()}
                        defaultMonth={subYears(new Date(), 18)}
                        disabled={(date) => date > new Date() || date < minCalendarDate }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  ID do Usuário: {currentUser?.uid}
                </p>
              </div>
            </div>
            
            <Button onClick={handleSaveProfile} className="w-full" disabled={isSaving}>
              {isSaving ? <LoadingSpinner size="sm" className="mr-2"/> : <Save className="mr-2 h-4 w-4" />}
              Salvar Alterações
            </Button>

            <p className="text-sm text-muted-foreground text-center">Mais funcionalidades de perfil, como edição detalhada, temas e upload de fotos, serão adicionadas em breve!</p>
            
            <Button variant="outline" className="w-full" disabled>
              <Edit3 className="mr-2 h-4 w-4" /> Editar Perfil Completo (Em breve)
            </Button>

            <Button variant="destructive" onClick={handleLogout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}

    