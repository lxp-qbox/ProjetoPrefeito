
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Gamepad2, MailQuestion, ShieldAlert, ArrowRight, LayoutDashboard, TicketIcon, Settings, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import AdminHostsPageContent from "./hosts/page-content"; // Import the content component

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

  // Determine what content to show based on the path
  const isHostManagementView = pathname === "/admin";


  return (
    <ProtectedPage>
      <div className="space-y-6">
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center">
            <Users className="mr-3 h-8 w-8" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo(a) ao painel de controle, {currentUser.profileName || currentUser.displayName}.
          </p>
        </section>

        <div className="flex flex-col md:flex-row gap-6">
          <nav className="w-full md:w-72 flex-shrink-0">
            <Card className="shadow-lg">
              <CardContent className="p-2 space-y-1">
                {adminSections.map((section) => {
                  const isActive = pathname === section.link;
                  return (
                    <Button
                      key={section.title}
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start text-left h-auto py-2.5 px-3 text-sm font-medium rounded-md", // Adjusted padding
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "text-card-foreground hover:bg-muted"
                      )}
                      asChild
                    >
                      <Link href={section.link} className="flex items-center gap-2.5"> {/* Adjusted gap */}
                        <section.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} /> {/* Adjusted icon size */}
                        {section.title}
                      </Link>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </nav>

          <main className="flex-grow">
            {isHostManagementView ? (
              <AdminHostsPageContent />
            ) : (
              <Card className="shadow-lg h-full">
                <CardHeader>
                  <CardTitle>Seção em Desenvolvimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    O conteúdo para {pathname.replace("/admin/", "")} será exibido aqui quando implementado.
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
