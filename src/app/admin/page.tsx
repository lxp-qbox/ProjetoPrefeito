
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Users, MailQuestion, ShieldAlert, LayoutDashboard, TicketIcon, Settings, UserCircle2, Globe, Bell, FileText, Info, LogOut, ChevronRight, Headphones, User } from "lucide-react"; // Added User
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import AdminHostsPageContent from "./hosts/page-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminMenuItem {
  title: string;
  icon: React.ElementType;
  link: string;
  currentValue?: string;
}

interface AdminMenuGroup {
  groupTitle?: string;
  items: AdminMenuItem[];
  isBottomSection?: boolean;
}

const adminMenuGroups: AdminMenuGroup[] = [
  {
    groupTitle: "Usuários",
    items: [
      { title: "Contas de Hosts", icon: Users, link: "/admin/hosts" },
      { title: "Contas de Players", icon: User, link: "/admin/users/players" },
      { title: "Contas de Suporte", icon: Headphones, link: "/admin/users/support" },
    ],
  },
  {
    groupTitle: "Geral",
    items: [
      { title: "Idioma", icon: Globe, link: "/admin/language", currentValue: "Português(Brasil)" },
      { title: "Configurações de notificação", icon: Bell, link: "/admin/notifications" },
    ],
  },
  {
    groupTitle: "Sobre",
    items: [
      { title: "Contrato do usuário", icon: FileText, link: "/admin/user-agreement" },
      { title: "Política de privacidade", icon: FileText, link: "/admin/privacy-policy" },
      { title: "Contrato de Host", icon: FileText, link: "/admin/host-agreement" },
      { title: "Sobre Kako Live", icon: Info, link: "/admin/about-kako" },
    ],
  },
  {
    items: [
      { title: "Entre em contato conosco", icon: Headphones, link: "/support" },
    ],
    isBottomSection: true,
  },
  {
    items: [
      { title: "Sair", icon: LogOut, link: "#logout" },
    ],
  },
];


export default function AdminPage() {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter(); 

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };


  if (!currentUser || !currentUser.adminLevel) {
    return (
      <ProtectedPage>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
          <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-destructive mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/">Voltar para Início</Link>
          </Button>
        </div>
      </ProtectedPage>
    );
  }

  // Default to host management if the path is /admin/hosts or /admin
  const isHostManagementView = pathname === "/admin/hosts" || pathname === "/admin";

  return (
    <ProtectedPage>
      <div className="flex flex-col h-full">
        <div className="flex-grow flex flex-col md:flex-row gap-0 md:gap-0 overflow-hidden h-full">
          {/* Admin Navigation Sidebar */}
          <nav className="w-full md:w-80 flex-shrink-0 border-b md:border-b-0 md:border-r bg-muted/40 h-full overflow-y-auto">
            <div className="p-1 space-y-4"> {/* Reduced padding for encostado look */}
              {adminMenuGroups.map((group, groupIndex) => (
                <div key={group.groupTitle || `group-${groupIndex}`} className={cn(group.isBottomSection && "mt-6 pt-6 border-t")}>
                  {group.groupTitle && (
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                      {group.groupTitle}
                    </h2>
                  )}
                  <div className={cn("space-y-2", !group.groupTitle && group.isBottomSection && "mt-0 pt-0 border-none")}>
                    {group.items.map((item) => {
                       const isActive = pathname === item.link;
                       const isLogout = item.link === "#logout";
                       const buttonAction = isLogout ? handleLogout : () => {
                           if (item.link) router.push(item.link);
                       };

                      return (
                        <Button
                          key={item.title}
                          variant="ghost"
                          className={cn(
                            "w-full justify-between text-left h-auto py-3 px-3 text-sm font-normal rounded-md",
                            isActive
                              ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary" 
                              : "text-card-foreground hover:bg-card/80 hover:text-card-foreground bg-card shadow-sm" 
                          )}
                          asChild={!isLogout}
                          {...(isLogout ? {onClick: buttonAction} : {})}
                        >
                          {isLogout ? (
                             <div className="flex items-center w-full">
                                <div className="flex items-center gap-3"> {/* Original gap */}
                                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                  {item.title}
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                              </div>
                          ) : (
                            <Link href={item.link} className="flex items-center w-full">
                              <div className="flex items-center gap-3"> {/* Original gap */}
                                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                {item.title}
                              </div>
                              <div className="flex items-center ml-auto">
                                {item.currentValue && <span className="text-xs text-muted-foreground mr-2">{item.currentValue}</span>}
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </Link>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Admin Content Area */}
          <main className="flex-grow overflow-y-auto p-6">
            {isHostManagementView ? (
              <AdminHostsPageContent />
            ) : (
              <Card className="shadow-lg h-full">
                <CardHeader>
                  <CardTitle className="text-xl">
                    Seção: {
                      adminMenuGroups
                        .flatMap(g => g.items)
                        .find(i => i.link === pathname)?.title
                      || pathname.split('/').pop()?.replace(/-/g, ' ')?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                      || "Desconhecida"
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    O conteúdo para esta seção será exibido aqui quando implementado.
                  </p>
                  <p className="mt-4 text-xs text-muted-foreground">Caminho atual: {pathname}</p>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </ProtectedPage>
  );
}
