
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MailQuestion, ShieldAlert, LayoutDashboard, TicketIcon, Settings, UserCircle2, UserCheck, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import AdminHostsPageContent from "./hosts/page-content";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AdminSubItem {
  title: string;
  icon: React.ElementType;
  link: string;
}

interface AdminSection {
  title: string;
  icon: React.ElementType;
  link?: string;
  subItems?: AdminSubItem[];
}

const adminSections: AdminSection[] = [
  { title: "Dashboard", icon: LayoutDashboard, link: "/admin/hosts" }, // Default to hosts view
  {
    title: "Usuários",
    icon: Users,
    // Link for parent could be e.g., /admin/users, which shows an overview
    subItems: [
      { title: "Todos os Usuários", icon: Users, link: "/admin/users/all" },
      { title: "Gerenciar Hosts", icon: UserCheck, link: "/admin/users/hosts-management" },
      { title: "Gerenciar Players", icon: User, link: "/admin/users/players-management" },
    ],
  },
  { title: "Bingo", icon: TicketIcon, link: "/admin/bingo" },
  { title: "Tickets", icon: MailQuestion, link: "/admin/tickets" },
  { title: "Configurações", icon: Settings, link: "/admin/settings" },
  { title: "Meu Perfil", icon: UserCircle2, link: "/profile" },
];

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

  const isHostManagementView = pathname === "/admin/hosts";

  return (
    <ProtectedPage>
      <div className="flex flex-col h-full">
        <div className="flex-grow flex flex-col md:flex-row gap-0 md:gap-0 overflow-hidden h-full">
          {/* Admin Navigation Sidebar */}
          <nav className="w-full md:w-60 flex-shrink-0 border-b md:border-b-0 md:border-r bg-card h-full">
            <div className="h-full flex flex-col">
              <div className="p-1 space-y-1 overflow-y-auto">
                <Accordion type="multiple" className="w-full">
                  {adminSections.map((section) => {
                    const isParentActive = 
                      (section.link === "/admin/hosts" && (pathname === "/admin" || pathname === "/admin/hosts")) || 
                      (section.link && section.link !== "/admin/hosts" && pathname === section.link) ||
                      (section.subItems && section.subItems.some(sub => pathname.startsWith(sub.link)));

                    if (section.subItems) {
                      return (
                        <AccordionItem value={section.title} key={section.title} className="border-none">
                          <AccordionTrigger
                            className={cn(
                              "w-full justify-between text-left h-auto py-2 px-1.5 text-sm font-medium rounded-md flex items-center gap-2 hover:no-underline",
                              isParentActive
                                ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                                : "text-card-foreground hover:bg-muted"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <section.icon className={cn("h-4 w-4", isParentActive ? "text-secondary-foreground" : "text-muted-foreground")} />
                              {section.title}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-1 pb-0 pl-5 pr-1"> {/* Indent sub-items */}
                            <div className="space-y-0.5">
                              {section.subItems.map((subItem) => {
                                const isSubItemActive = pathname.startsWith(subItem.link);
                                return (
                                  <Button
                                    key={subItem.title}
                                    variant={isSubItemActive ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start text-left h-auto py-1.5 px-1.5 text-xs font-medium rounded-md",
                                        isSubItemActive 
                                            ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                            : "text-card-foreground hover:bg-muted"
                                    )}
                                    asChild
                                  >
                                    <Link href={subItem.link} className="flex items-center gap-2">
                                      <subItem.icon className={cn("h-3.5 w-3.5", isSubItemActive ? "text-secondary-foreground":"text-muted-foreground")} />
                                      {subItem.title}
                                    </Link>
                                  </Button>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    } else {
                       const isActive = section.link === "/admin/hosts" 
                                  ? (pathname === "/admin" || pathname === "/admin/hosts") 
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
                          <Link href={section.link || "#"} className="flex items-center gap-2">
                            <section.icon className={cn("h-4 w-4", isActive ? "text-secondary-foreground" : "text-muted-foreground")} />
                            {section.title}
                          </Link>
                        </Button>
                      );
                    }
                  })}
                </Accordion>
              </div>
            </div>
          </nav>

          {/* Admin Content Area */}
          <main className="flex-grow overflow-y-auto p-6">
            {isHostManagementView || pathname === "/admin" ? ( // Show hosts content for /admin or /admin/hosts
              <AdminHostsPageContent />
            ) : (
              <Card className="shadow-lg h-full">
                <CardHeader>
                  <CardTitle className="text-xl">
                    Seção: {
                      adminSections
                        .flatMap(s => s.subItems ? [s, ...s.subItems] : [s])
                        .find(s => s.link === pathname)?.title 
                      || pathname.split('/').pop()?.replace(/-/g, ' ')?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                      || "Desconhecida"
                    }
                  </CardTitle>
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
