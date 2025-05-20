
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Mail, UserCircle2, Edit3, ShieldCheck, BadgeCent, Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (!currentUser) {
    // It's better to return null or a loading state if currentUser is not yet available
    // ProtectedPage already handles redirection if not authenticated,
    // but this check is for when currentUser might be null during initial auth context loading.
    return null; 
  }

  const displayName = currentUser.profileName || currentUser.displayName || "Usuário";

  return (
    <ProtectedPage>
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/50 shadow-md">
              <AvatarImage src={currentUser.photoURL || undefined} alt={displayName} />
              <AvatarFallback className="text-3xl">{getInitials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-3xl font-bold">
                {displayName}
              </CardTitle>
              {currentUser.isVerified && <ShieldCheck className="h-7 w-7 text-primary" />} {/* Changed to text-primary */}
            </div>
            <CardDescription>Gerencie os detalhes e preferências da sua conta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary flex items-center">
                <UserCircle2 className="mr-2 h-5 w-5" /> Informações da Conta
              </h3>
              <div className="p-4 border rounded-md bg-muted/50 space-y-2">
                <p className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <strong>Email:</strong>&nbsp;{currentUser.email}
                </p>
                {currentUser.kakoLiveId && (
                   <p className="flex items-center text-sm">
                    <Fingerprint className="mr-2 h-4 w-4 text-muted-foreground" />
                    <strong>Passaporte:</strong>&nbsp;{currentUser.kakoLiveId}
                  </p>
                )}
                <div className="flex items-center text-sm">
                  <BadgeCent className="mr-2 h-4 w-4 text-muted-foreground" />
                  <strong>Role:</strong>&nbsp;
                  <Badge variant={currentUser.role === 'admin' || currentUser.role === 'master' ? 'destructive' : 'secondary'}>
                    {currentUser.role}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  User ID: {currentUser.uid}
                </p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">Mais funcionalidades de perfil, como edição detalhada, temas e upload de fotos, serão adicionadas em breve!</p>
            
            <Button variant="outline" className="w-full" disabled>
              <Edit3 className="mr-2 h-4 w-4" /> Editar Perfil (Em breve)
            </Button>

            <Button variant="destructive" onClick={handleLogout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}
