
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db, doc, updateDoc } from "@/lib/firebase";
import { Palette, UserCircle, Link as LinkIcon, Image as ImageIcon, Save } from "lucide-react";
import type { UserProfile } from "@/types";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

type SettableUserProfileFields = Pick<UserProfile, "themePreference" | "accentColor" | "bio" | "profileName" | "kakoLiveId" | "gender" | "birthDate" | "civilStatus" | "socialLinks">;


export default function SettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Partial<SettableUserProfileFields>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setSettings({
        themePreference: currentUser.themePreference || "system",
        accentColor: currentUser.accentColor || "#4285F4", // Default to primary blue
        profileName: currentUser.profileName || "",
        kakoLiveId: currentUser.kakoLiveId || "",
        bio: currentUser.bio || "",
        gender: currentUser.gender || "preferNotToSay",
        birthDate: currentUser.birthDate || "",
        civilStatus: currentUser.civilStatus || "preferNotToSay",
        socialLinks: currentUser.socialLinks || {},
      });
    }
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialLinkChange = (platform: keyof NonNullable<UserProfile["socialLinks"]>, value: string) => {
    setSettings(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      }
    }));
  };

  const handleRadioChange = (name: keyof SettableUserProfileFields, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };


  const handleSaveSettings = async () => {
    if (!currentUser) {
      toast({ title: "Erro", description: "Você deve estar logado para salvar as configurações.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        ...settings,
        updatedAt: new Date(), // Use JS Date for client-side update, or serverTimestamp for server
      });
      toast({ title: "Configurações Salvas", description: "Suas preferências foram atualizadas." });
      // Optionally, trigger a refresh of currentUser in AuthContext if settings impact global state
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      toast({ title: "Falha ao Salvar", description: error.message || "Não foi possível salvar as configurações.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedPage>
      <div className="space-y-8 max-w-3xl mx-auto">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-3xl font-bold">Configurações</CardTitle>
          <CardDescription>
            Gerencie as configurações da sua conta, informações de perfil e preferências do site.
          </CardDescription>
        </CardHeader>

        {/* Appearance Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Palette className="mr-2 h-5 w-5 text-primary" /> Aparência
            </CardTitle>
            <CardDescription>Personalize a aparência do site.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="themePreference" className="text-base font-semibold">Preferência de Tema</Label>
              <RadioGroup
                id="themePreference"
                name="themePreference"
                value={settings.themePreference || "system"}
                onValueChange={(value) => handleRadioChange("themePreference", value)}
                className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {[
                  { value: "light", label: "Claro" },
                  { value: "dark", label: "Escuro" },
                  { value: "system", label: "Padrão do Sistema" },
                ].map((item) => (
                  <Label
                    key={item.value}
                    htmlFor={`theme-${item.value}`}
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <RadioGroupItem value={item.value} id={`theme-${item.value}`} className="sr-only" />
                    {item.label}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="accentColor" className="text-base font-semibold">Cor de Destaque</Label>
              <div className="relative mt-2">
                <Input
                  id="accentColor"
                  name="accentColor"
                  type="color"
                  value={settings.accentColor || "#4285F4"}
                  onChange={handleInputChange}
                  className="w-24 h-10 p-1"
                />
                 <span className="ml-3 text-sm text-muted-foreground">
                  Atual: <span style={{ color: settings.accentColor }} className="font-semibold">{settings.accentColor}</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Nota: A aplicação completa da cor de destaque em todo o site está em desenvolvimento.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <UserCircle className="mr-2 h-5 w-5 text-primary" /> Informações do Perfil
            </CardTitle>
            <CardDescription>Atualize os detalhes do seu perfil público.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="profileName">Nome de Perfil</Label>
                <Input id="profileName" name="profileName" value={settings.profileName || ""} onChange={handleInputChange} placeholder="Seu nome de exibição" />
              </div>
              <div>
                <Label htmlFor="kakoLiveId">Passaporte (ID do Kako Live)</Label>
                <Input id="kakoLiveId" name="kakoLiveId" value={settings.kakoLiveId || ""} onChange={handleInputChange} placeholder="Seu ID Kako Live" />
              </div>
               <div>
                <Label htmlFor="bio">Bio (máx 100 caracteres)</Label>
                <Input id="bio" name="bio" value={settings.bio || ""} onChange={handleInputChange} placeholder="Conte-nos sobre você" maxLength={100} />
              </div>
                 <p className="text-muted-foreground text-sm">
                    Edição para gênero, data de nascimento e outros campos de perfil em breve.
                 </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Links Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <LinkIcon className="mr-2 h-5 w-5 text-primary" /> Links Sociais
            </CardTitle>
            <CardDescription>Conecte suas contas de mídia social.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {(['twitter', 'instagram', 'facebook', 'youtube', 'twitch'] as const).map(platform => (
                <div key={platform}>
                  <Label htmlFor={`social-${platform}`} className="capitalize">{platform}</Label>
                  <Input 
                    id={`social-${platform}`} 
                    name={`social-${platform}`}
                    value={settings.socialLinks?.[platform] || ""}
                    onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                    placeholder={`URL do seu perfil ${platform} ou nome de usuário`} 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Manage Photos Section (Placeholder) */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <ImageIcon className="mr-2 h-5 w-5 text-primary" /> Gerenciar Fotos
            </CardTitle>
            <CardDescription>Atualize seu avatar, imagem de cabeçalho e galeria do perfil.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Funcionalidade para upload e gerenciamento de fotos do perfil em breve.
            </p>
          </CardContent>
        </Card>

        <Button onClick={handleSaveSettings} disabled={isSaving} size="lg" className="w-full sm:w-auto">
          {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-5 w-5" />}
          Salvar Todas as Configurações
        </Button>
      </div>
    </ProtectedPage>
  );
}
