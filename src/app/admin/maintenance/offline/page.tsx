
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ServerOff, Home as HomeIcon, Users as UsersIconProp, TicketIcon, LayoutDashboard, UserCircle2, Settings as SettingsIcon, ShieldCheck, UserCog, Star, User, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db, doc, getDoc, setDoc, serverTimestamp } from "@/lib/firebase";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface ModuleAccessStatus {
  globallyOffline: boolean;
  accessLevels: {
    master: 'normal' | 'maintenance' | 'blocked';
    admin: 'normal' | 'maintenance' | 'blocked';
    suporte: 'normal' | 'maintenance' | 'blocked';
    host: 'normal' | 'maintenance' | 'blocked';
    player: 'normal' | 'maintenance' | 'blocked';
  };
}

interface SiteModule extends ModuleAccessStatus {
  id: string;
  name: string;
  icon: React.ElementType;
  // No need to store icon string or function in Firestore, can be mapped by id
}

type UserRole = keyof ModuleAccessStatus['accessLevels'];

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
    suporte: UserCog,
    host: Star,
    player: User,
};

const initialModuleStatuses: SiteModule[] = [
  {
    id: 'home',
    name: "Página Inicial (Home)",
    icon: HomeIcon,
    globallyOffline: false,
    accessLevels: { master: 'normal', admin: 'normal', suporte: 'normal', host: 'normal', player: 'normal' },
  },
  {
    id: 'hosts',
    name: "Página de Hosts",
    icon: UsersIconProp,
    globallyOffline: false,
    accessLevels: { master: 'normal', admin: 'normal', suporte: 'normal', host: 'normal', player: 'normal' },
  },
  {
    id: 'games',
    name: "Página de Jogos",
    icon: TicketIcon,
    globallyOffline: false,
    accessLevels: { master: 'normal', admin: 'normal', suporte: 'normal', host: 'normal', player: 'normal' },
  },
  {
    id: 'adminPanel',
    name: "Painel Admin",
    icon: LayoutDashboard,
    globallyOffline: false,
    accessLevels: { master: 'normal', admin: 'normal', suporte: 'normal', host: 'blocked', player: 'blocked' }, // Default block for non-admins
  },
  {
    id: 'profile',
    name: "Página de Perfil",
    icon: UserCircle2,
    globallyOffline: false,
    accessLevels: { master: 'normal', admin: 'normal', suporte: 'normal', host: 'normal', player: 'normal' },
  },
  {
    id: 'settings',
    name: "Página de Configurações",
    icon: SettingsIcon,
    globallyOffline: false,
    accessLevels: { master: 'normal', admin: 'normal', suporte: 'normal', host: 'normal', player: 'normal' },
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
          // Map Firestore data back to SiteModule[], ensuring icons are functions
          const fetchedStatuses = (data.rules as any[]).map(fsModule => {
            const initialModule = initialModuleStatuses.find(im => im.id === fsModule.id);
            return {
              ...fsModule,
              icon: initialModule ? initialModule.icon : ServerOff, // Fallback icon
            };
          });
          setModuleStatuses(fetchedStatuses);
        } else {
          // No settings found, use initial defaults (and save them on first save action)
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

  const handleRoleAccessChange = (moduleId: string, role: UserRole, access: 'normal' | 'maintenance' | 'blocked') => {
    setModuleStatuses((prevModules) =>
      prevModules.map((module) =>
        module.id === moduleId
          ? {
              ...module,
              accessLevels: {
                ...module.accessLevels,
                [role]: access,
              },
            }
          : module
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
            Ative ou desative módulos específicos do site. Se um módulo estiver offline, defina permissões de acesso granulares por função.
            <strong className="text-destructive block mt-1">Clique em "Salvar Alterações" para persistir suas escolhas no banco de dados.</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {moduleStatuses.map((module) => {
            const ModuleIcon = module.icon;
            return (
              <Card key={module.id} className="p-4 border-border shadow-sm">
                <div className="flex items-center justify-between">
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

                {module.globallyOffline && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <p className="text-sm text-muted-foreground">
                      O módulo <span className="font-semibold">{module.name}</span> está configurado como offline. Defina abaixo quem ainda pode acessá-lo:
                    </p>
                    {(Object.keys(module.accessLevels) as UserRole[]).map((role) => {
                      const RoleIcon = roleIcons[role];
                      return (
                        <div key={role} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                          <div className="flex items-center">
                            <RoleIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            <Label htmlFor={`${module.id}-${role}-access`} className="text-sm font-medium">
                              {roleDisplayNames[role]}
                            </Label>
                          </div>
                          <Select
                            value={module.accessLevels[role]}
                            onValueChange={(value) => handleRoleAccessChange(module.id, role, value as 'normal' | 'maintenance' | 'blocked')}
                          >
                            <SelectTrigger id={`${module.id}-${role}-access`} className="w-[200px] h-9 text-xs focus-visible:ring-0 focus-visible:ring-offset-0">
                              <SelectValue placeholder="Definir acesso" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Acesso Normal</SelectItem>
                              <SelectItem value="maintenance">Ver Manutenção</SelectItem>
                              <SelectItem value="blocked">Bloqueado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
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
          <strong>Nota Importante:</strong> As configurações salvas aqui afetam o acesso ao site.
          A lógica de backend e as verificações de permissão em cada rota precisam ser implementadas para que estas regras tenham efeito real.
        </p>
      </CardFooter>
    </div>
  );
}

    