
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MailQuestion, ShieldAlert, LayoutDashboard, TicketIcon, Settings, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import AdminHostsPageContent from "./hosts/page-content";

export default function AdminPage() {
  const { currentUser } = useAuth();
  const pathname = usePathname();

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

  const adminSections = [
    { title: "Dashboard", icon: LayoutDashboard, link: "/admin" },
    { title: "Bingo", icon: TicketIcon, link: "/admin/bingo" },
    { title: "Tickets", icon: MailQuestion, link: "/admin/tickets" },
    { title: "Configurações", icon: Settings, link: "/admin/settings" },
    { title: "Meu Perfil", icon: UserCircle2, link: "/profile" },
  ];

  const isHostManagementView = pathname === "/admin";


  return (
    <ProtectedPage>
      <div className="flex-grow flex flex-col md:flex-row gap-0 md:gap-0 overflow-hidden h-full">
        {/* Admin Navigation Sidebar */}
        <nav className="w-full md:w-60 flex-shrink-0 border-b md:border-b-0 md:border-r bg-card h-full">
          <div className="h-full flex flex-col">
            <div className="p-1 space-y-1 overflow-y-auto">
              {adminSections.map((section) => {
                const isActive = section.link === "/admin" 
                                  ? (pathname === "/admin" || pathname.startsWith("/admin/hosts")) 
                                  : pathname === section.link;
                return (
                  <Button
                    key={section.title}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-left h-auto py-2 px-1.5 text-sm font-medium rounded-md", 
                      isActive
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        : "text-card-foreground hover:bg-muted"
                    )}
                    asChild
                  >
                    <Link href={section.link} className="flex items-center gap-2">
                      <section.icon className={cn("h-4 w-4", isActive ? "text-secondary-foreground" : "text-muted-foreground")} />
                      {section.title}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Admin Content Area */}
        <main className="flex-grow overflow-y-auto p-6">
          {isHostManagementView ? (
            <AdminHostsPageContent />
          ) : (
            <Card className="shadow-lg h-full">
              <CardHeader>
                <CardTitle className="text-xl">Seção: {adminSections.find(s => s.link === pathname)?.title || pathname.split('/').pop()?.toUpperCase()}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  O conteúdo para esta seção será exibido aqui quando implementado.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedPage>
  );
}
