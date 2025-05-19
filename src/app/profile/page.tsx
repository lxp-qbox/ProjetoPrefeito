
"use client";

import ProtectedPage from "@/components/auth/protected-page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Mail, UserCircle2, Edit3 } from "lucide-react";
import { useRouter } from "next/navigation";

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

  const getInitials = (email?: string | null) => {
    if (!email) return "U";
    return email.substring(0, 2).toUpperCase();
  };

  if (!currentUser) {
    // ProtectedPage handles redirection, but this is a fallback or for immediate render
    return null; 
  }

  return (
    <ProtectedPage>
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/50 shadow-md">
              <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} />
              <AvatarFallback className="text-3xl">{getInitials(currentUser.email)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-3xl font-bold">
              {currentUser.displayName || "User Profile"}
            </CardTitle>
            <CardDescription>Manage your account details and preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-primary flex items-center">
                <UserCircle2 className="mr-2 h-5 w-5" /> Account Information
              </h3>
              <div className="p-4 border rounded-md bg-muted/50">
                <p className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <strong>Email:</strong>&nbsp;{currentUser.email}
                </p>
                {/* Add more user details here if available, e.g., UID */}
                <p className="text-xs text-muted-foreground mt-1">
                  User ID: {currentUser.uid}
                </p>
              </div>
            </div>
            
            {/* Placeholder for profile editing */}
            <Button variant="outline" className="w-full" disabled>
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile (Coming Soon)
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
