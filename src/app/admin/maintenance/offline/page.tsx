
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ServerOff, Home as HomeIcon, Users as UsersIconProp, TicketIcon, LayoutDashboard, UserCircle2, Settings as SettingsIcon, ShieldCheck, UserCog, Star, User, Save, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, doc, getDoc, setDoc, serverTimestamp } from "@/lib/firebase";
import LoadingSpinner from "@/components/ui/loading-spinner";

type UserRole = 'master' | 'admin' | 'suporte' | 'host' | 'player';
type MinimumAccessLevel = UserRole | 'nobody';

interface SiteModule {
  id: string;
  name: string;
  icon: React.ElementType;
  globallyOffline: boolean;
  isHiddenFromMenu: boolean; // New field
  minimumAccessLevelWhenOffline: MinimumAccessLevel; // New field, replaces accessLevels
}

const roleDisplayNames: Record<UserRole, string> = {
  master: "Master",
  admin: "Admin",
  suporte: "Suporte",
  host: "Host",
  player: "Player",
};

const roleIcons: Record<UserRole, React.ElementType> = {
  master: ShieldCheck,
  admin: UserCog,
  suporte: UserCog, // Assuming Suporte uses UserCog or similar
  host: Star,
  player: User,
};

const minimumAccessLevelOptions: { value: MinimumAccessLevel; label: string }[] = [
  { value: 'nobody', label: "Ninguém (Totalmente Bloqueado)" },
  { value: 'master', label: "Apenas Master" },
  { value: 'admin', label: "Admin e Acima" },
  { value: 'suporte', label: "Suporte e Acima" },
  { value: 'host', label: "Host e Acima" },
  { value: 'player', label: "Player e Todos Acima (Todos Permitidos)" },
];

const initialModuleStatuses: SiteModule[] = [
  {
    id: 'home',
    name: "Página Inicial (Home)",
    icon: HomeIcon,
    globallyOffline: false,
    isHiddenFromMenu: false,
    minimumAccessLevelWhenOffline: 'player', // Default to all allowed if offline (unless changed)
  },
  {
    id: 'hosts',
    name: "Página de Hosts",
    icon: UsersIconProp,
    globallyOffline: false,
    isHiddenFromMenu: false,
    minimumAccessLevelWhenOffline: 'player',
  },
  {
    id: 'games',
    name: "Página de Jogos (Bingo)",
    icon: TicketIcon,
    globallyOffline: false,
    isHiddenFromMenu: false,
    minimumAccessLevelWhenOffline: 'player',
  },
  {
    id: 'adminPanel',
    name: "Painel Admin",
    icon: LayoutDashboard,
    globallyOffline: false,
    isHiddenFromMenu: false,
    minimumAccessLevelWhenOffline: 'master', // Default to master only
  },
  {
    id: 'profile',
    name: "Página de Perfil",
    icon: UserCircle2,
    globallyOffline: false,
    isHiddenFromMenu: false,
    minimumAccessLevelWhenOffline: 'player',
  },
  {
    id: 'settings',
    name: "Página de Configurações",
    icon: SettingsIcon,
    globallyOffline: false,
    isHiddenFromMenu: false,
    minimumAccessLevelWhenOffline: 'player',
  },
];


export default function AdminMaintenanceOfflinePage() {
  const [moduleStatuses, setModuleStatuses] = useState<SiteModule[]>(initialModuleStatuses);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const maintenanceRulesDocRef = doc(db, "app_settings", "maintenance_rules");

  useEffect(() => {
    const fetchMaintenanceSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const docSnap = await getDoc(maintenanceRulesDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetchedStatuses = (data.rules as Omit<SiteModule, 'icon'>[]).map(fsModule => {
            const initialModule = initialModuleStatuses.find(im => im.id === fsModule.id);
            return {
              ...initialModule, // Get icon from initialModuleStatuses
              ...fsModule, // Override with fetched data
              icon: initialModule ? initialModule.icon : ServerOff, // Ensure icon is always present
            } as SiteModule;
          });
          setModuleStatuses(fetchedStatuses);
        } else {
          console.log("Nenhuma configuração de manutenção encontrada, usando padrões.");
          setModuleStatuses(initialModuleStatuses);
        }
      } catch (error) {
        console.error("Erro ao buscar configurações de manutenção:", error);
        toast({
          title: "Erro ao Carregar Configurações",
          description: "Não foi possível carregar as configurações de manutenção. Usando padrões.",
          variant: "destructive",
        });
        setModuleStatuses(initialModuleStatuses);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchMaintenanceSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleGlobalToggle = (moduleId: string, isOffline: boolean) => {
    setModuleStatuses((prevModules) =>
      prevModules.map((module) =>
        module.id === moduleId ? { ...module, globallyOffline: isOffline } : module
      )
    );
  };

  const handleMinimumAccessLevelChange = (moduleId: string, level: MinimumAccessLevel) => {
    setModuleStatuses((prevModules) =>
      prevModules.map((module) =>
        module.id === moduleId
          ? { ...module, minimumAccessLevelWhenOffline: level }
          : module
      )
    );
  };

  const handleHideFromMenuToggle = (moduleId: string, isHidden: boolean) => {
    setModuleStatuses((prevModules) =>
      prevModules.map((module) =>
        module.id === moduleId ? { ...module, isHiddenFromMenu: isHidden } : module
      )
    );
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Prepare data for Firestore (remove icon functions)
      const statusesToSave = moduleStatuses.map(({ icon, ...rest }) => rest);
      await setDoc(maintenanceRulesDocRef, { rules: statusesToSave, lastUpdated: serverTimestamp() });
      toast({
        title: "Configurações Salvas!",
        description: "As configurações de manutenção foram salvas com sucesso no banco de dados.",
      });
    } catch (error) {
      console.error("Erro ao salvar configurações de manutenção:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as configurações de manutenção. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <LoadingSpinner size="lg" />
        <p className="ml-4 text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-background p-6 rounded-lg shadow-sm h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Gerenciar Status Offline de Módulos</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ServerOff className="mr-2 h-6 w-6 text-primary" />
            Controle de Acesso aos Módulos
          </CardTitle>
          <CardDescription>
            Ative ou desative módulos específicos do site. Se um módulo estiver offline, defina o nível de acesso mínimo necessário.
            Você também pode ocultar módulos dos menus de navegação.
            <strong className="text-destructive block mt-1">Clique em "Salvar Alterações" para persistir suas escolhas no banco de dados.</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {moduleStatuses.map((module) => {
            const ModuleIcon = module.icon;
            return (
              <Card key={module.id} className="p-4 border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <ModuleIcon className="mr-3 h-6 w-6 text-primary" />
                    <Label htmlFor={`${module.id}-global-status`} className="text-lg font-semibold">
                      {module.name}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`${module.id}-global-status`}
                      checked={module.globallyOffline}
                      onCheckedChange={(checked) => handleGlobalToggle(module.id, checked)}
                      aria-label={`Status global offline para ${module.name}`}
                    />
                    <span className={`text-sm font-semibold ${module.globallyOffline ? 'text-destructive' : 'text-green-600'}`}>
                      {module.globallyOffline ? "Globalmente Offline" : "Globalmente Online"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 mb-4">
                    <Switch
                        id={`${module.id}-hide-from-menu`}
                        checked={module.isHiddenFromMenu}
                        onCheckedChange={(checked) => handleHideFromMenuToggle(module.id, checked)}
                        aria-label={`Ocultar ${module.name} do menu`}
                    />
                    <Label htmlFor={`${module.id}-hide-from-menu`} className="text-sm font-medium flex items-center">
                       <EyeOff className="mr-2 h-4 w-4 text-muted-foreground" /> Ocultar dos Menus
                    </Label>
                </div>

                {module.globallyOffline && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <p className="text-sm text-muted-foreground">
                      O módulo <span className="font-semibold">{module.name}</span> está configurado como offline.
                      Defina abaixo o nível mínimo de função necessário para acessá-lo:
                    </p>
                    <div className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                        <Label htmlFor={`${module.id}-min-access`} className="text-sm font-medium">
                            Acesso Mínimo Permitido:
                        </Label>
                        <Select
                        value={module.minimumAccessLevelWhenOffline}
                        onValueChange={(value) => handleMinimumAccessLevelChange(module.id, value as MinimumAccessLevel)}
                        >
                        <SelectTrigger id={`${module.id}-min-access`} className="w-[280px] h-9 text-xs focus-visible:ring-0 focus-visible:ring-offset-0">
                            <SelectValue placeholder="Definir acesso mínimo" />
                        </SelectTrigger>
                        <SelectContent>
                            {minimumAccessLevelOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </CardContent>
         <CardFooter className="pt-6 border-t flex justify-end">
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Alterações
          </Button>
        </CardFooter>
      </Card>

      <CardFooter className="pt-6 border-t">
        <p className="text-xs text-muted-foreground">
          <strong>Nota Importante:</strong> As configurações salvas aqui afetam o acesso ao site e a visibilidade de itens no menu.
          A lógica de backend/middleware e as verificações de permissão em cada rota/menu precisam ser implementadas para que estas regras tenham efeito real.
        </p>
      </CardFooter>
    </div>
  );
}

    