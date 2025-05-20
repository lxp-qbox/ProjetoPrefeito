
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Gamepad2, MailQuestion, ShieldAlert, ArrowRight, LayoutDashboard, TicketIcon, Settings, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Added for active link
import { cn } from "@/lib/utils"; // Added for conditional class names

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

  // Define admin sections based on the image
  const adminSections = [
    { title: "Dashboard", icon: LayoutDashboard, link: "/admin" },
    { title: "Bingo", icon: TicketIcon, link: "/admin/bingo" }, // Placeholder link
    { title: "Tickets", icon: MailQuestion, link: "/admin/tickets" }, // Placeholder link
    { title: "Configurações", icon: Settings, link: "/admin/settings" }, // Placeholder link
    { title: "Meu Perfil", icon: UserCircle2, link: "/profile" },
  ];

  return (
    <ProtectedPage>
      <div className="space-y-6">
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center">
            <Users className="mr-3 h-8 w-8" /> {/* Kept Users icon for Admin Panel title as per image context */}
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo(a) ao painel de controle, {currentUser.profileName || currentUser.displayName}.
          </p>
        </section>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Admin Navigation Sidebar */}
          <nav className="w-full md:w-72 flex-shrink-0">
            <Card className="shadow-lg">
              {/* Removed CardHeader for "Navegação" */}
              <CardContent className="p-2 space-y-1">
                {adminSections.map((section) => {
                  const isActive = pathname === section.link;
                  return (
                    <Button
                      key={section.title}
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start text-left h-auto py-3 px-4 text-sm font-medium rounded-md",
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "text-card-foreground hover:bg-muted"
                      )}
                      asChild
                    >
                      <Link href={section.link} className="flex items-center gap-3">
                        <section.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                        {section.title}
                      </Link>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </nav>

          {/* Admin Content Area */}
          <main className="flex-grow">
            <Card className="shadow-lg h-full">
              <CardHeader>
                <CardTitle>Bem-vindo ao Painel!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Selecione uma opção no menu à esquerda para gerenciar as seções do painel.
                </p>
                <p className="mt-4 text-sm">
                  O conteúdo específico da seção selecionada aparecerá aqui quando implementado.
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </ProtectedPage>
  );
}
