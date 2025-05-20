
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
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db, doc, updateDoc } from "@/lib/firebase";
import { Palette, Save, Check } from "lucide-react";
import type { UserProfile } from "@/types";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";

type SettableUserProfileFields = Pick<UserProfile, "themePreference" | "accentColor">;

const accentColorOptions = [
  { name: "Blue", value: "#4285F4" }, // Default Primary
  { name: "Sky Blue", value: "#79A6DC" },
  { name: "Purple", value: "#8A2BE2" },
  { name: "Pink", value: "#FF69B4" },
  { name: "Red", value: "#DB4437" }, // Default Destructive
  { name: "Orange", value: "#FFA726" }, // Default Accent
  { name: "Yellow", value: "#FFC107" },
  { name: "Green", value: "#0F9D58" },
  { name: "Teal", value: "#008080" },
  { name: "Cyan", value: "#00BCD4" },
];

// Helper function to convert HEX to HSL string for CSS variables
function hexToHslString(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0; 
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}


export default function SettingsPage() {
  const { currentUser } = useAuth(); // currentUser will be available here if ProtectedPage allows rendering
  const { toast } = useToast();
  const [settings, setSettings] = useState<Partial<SettableUserProfileFields>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize settings from currentUser or defaults
  useEffect(() => {
    if (currentUser) {
      const initialTheme = currentUser.themePreference === 'system' ? 'light' : (currentUser.themePreference || "light");
      const initialAccent = currentUser.accentColor || "#4285F4";
      
      setSettings({
        themePreference: initialTheme,
        accentColor: initialAccent,
      });

      // Apply initial theme to document
      document.documentElement.classList.remove('dark');
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
      
      // Apply initial accent color to document
      const hslColor = hexToHslString(initialAccent);
      if (hslColor) {
        document.documentElement.style.setProperty('--primary', hslColor);
        document.documentElement.style.setProperty('--ring', hslColor);
      }
    }
  }, [currentUser]);

  // Effect to apply theme preference (light/dark) dynamically
  useEffect(() => {
    if (settings.themePreference) {
      document.documentElement.classList.remove('dark');
      if (settings.themePreference === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }
  }, [settings.themePreference]);

  // Effect to apply accent color dynamically
  useEffect(() => {
    if (settings.accentColor) {
      const hslColor = hexToHslString(settings.accentColor);
      if (hslColor) {
        document.documentElement.style.setProperty('--primary', hslColor);
        document.documentElement.style.setProperty('--ring', hslColor);
      }
    }
  }, [settings.accentColor]);


  const handleRadioChange = (name: keyof Pick<SettableUserProfileFields, "themePreference">, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value as 'light' | 'dark' }));
  };

  const handleAccentColorChange = (colorValue: string) => {
    setSettings((prev) => ({ ...prev, accentColor: colorValue }));
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
        themePreference: settings.themePreference === 'system' ? 'light' : settings.themePreference, // Ensure system is not saved
        accentColor: settings.accentColor,
        updatedAt: new Date(), 
      });
      toast({ title: "Configurações Salvas", description: "Suas preferências foram atualizadas." });
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      toast({ title: "Falha ao Salvar", description: error.message || "Não foi possível salvar as configurações.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  // ProtectedPage will handle the loading and currentUser check.
  // We can assume currentUser is populated if this content renders.
  return (
    <ProtectedPage>
      <div className="space-y-8 max-w-3xl mx-auto">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-3xl font-bold">Configurações</CardTitle>
          <CardDescription>
            Gerencie as preferências de aparência do site.
          </CardDescription>
        </CardHeader>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Palette className="mr-2 h-5 w-5 text-primary" /> Aparência
            </CardTitle>
            <CardDescription>Personalize a aparência do site.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <Label className="text-base font-semibold">Modo de Cor</Label>
              <p className="text-sm text-muted-foreground mb-3">Escolha o modo de cor para seu aplicativo.</p>
              <RadioGroup
                value={settings.themePreference || "light"}
                onValueChange={(value) => handleRadioChange("themePreference", value)}
                className="space-y-2"
              >
                {[
                  { value: "light", label: "Claro" },
                  { value: "dark", label: "Escuro" },
                ].map((item) => (
                  <div key={item.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={item.value} id={`theme-${item.value}`} />
                    <Label htmlFor={`theme-${item.value}`} className="font-normal cursor-pointer">
                      {item.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base font-semibold">Esquema de Cores</Label>
              <p className="text-sm text-muted-foreground mb-3">O esquema de cores perfeito para seu aplicativo.</p>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                {accentColorOptions.map((color) => (
                  <Button
                    key={color.value}
                    variant="outline"
                    className={cn(
                      "h-10 w-10 rounded-full p-0 border-2 flex items-center justify-center",
                      settings.accentColor === color.value
                        ? "border-ring ring-2 ring-ring ring-offset-2" 
                        : "border-muted-foreground/30 hover:border-ring" 
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleAccentColorChange(color.value)}
                    aria-label={color.name}
                  >
                    {settings.accentColor === color.value && (
                      <Check className="h-5 w-5 text-white mix-blend-difference" />
                    )}
                  </Button>
                ))}
              </div>
               <p className="text-xs text-muted-foreground mt-2">
                Nota: A aplicação da cor de destaque em todo o site é uma prévia. O salvamento persistirá sua escolha.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSaveSettings} disabled={isSaving} size="lg" className="w-full sm:w-auto">
          {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-5 w-5" />}
          Salvar Configurações de Aparência
        </Button>
      </div>
    </ProtectedPage>
  );
}
