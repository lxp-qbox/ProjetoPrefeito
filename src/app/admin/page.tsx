
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Gamepad2, MailQuestion, ShieldAlert, ArrowRight, LayoutDashboard, TicketIcon, Settings, UserCircle2 } from "lucide-react";
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
      <div className="flex flex-col h-full">
        <section className="bg-card p-6 shadow-md border-b"> {/* Added border-b for separation */}
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center">
            <Users className="mr-3 h-8 w-8" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo(a) ao painel de controle, {currentUser.profileName || currentUser.displayName}.
          </p>
        </section>

        <div className="flex-grow flex flex-col md:flex-row gap-0 md:gap-0 overflow-hidden"> {/* Removed gap, handled by borders now */}
          {/* Admin Navigation Sidebar */}
          <nav className="w-full md:w-72 flex-shrink-0 border-b md:border-b-0 md:border-r bg-card"> {/* Added bg-card and borders */}
            <div className="h-full flex flex-col">
              <div className="p-1 space-y-1 overflow-y-auto">
                {adminSections.map((section) => {
                  const isActive = pathname === section.link || (section.link === "/admin" && pathname.startsWith("/admin/hosts"));
                  return (
                    <Button
                      key={section.title}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start text-left h-auto py-2.5 px-2 text-sm font-medium rounded-md", // Reduced px
                        isActive
                          ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                          : "text-card-foreground hover:bg-muted"
                      )}
                      asChild
                    >
                      <Link href={section.link} className="flex items-center gap-2.5">
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
          <main className="flex-grow overflow-y-auto p-6"> {/* Added padding here */}
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
      </div>
    </ProtectedPage>
  );
}
