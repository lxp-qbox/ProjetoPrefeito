
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth, db, doc, setDoc, serverTimestamp } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, UserPlus as UserPlusIcon, Lock } from "lucide-react";
import type { UserProfile, UserWallet } from "@/types";

const formSchema = z.object({
  email: z.string().email({ message: "Endereço de email inválido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function deriveProfileNameFromEmail(email: string): string {
    if (!email) return "Usuário";
    const atIndex = email.indexOf('@');
    if (atIndex !== -1) {
      let profileName = email.substring(0, atIndex);
      profileName = profileName.charAt(0).toUpperCase() + profileName.slice(1);
      return profileName.length > 30 ? profileName.substring(0, 30) : profileName;
    }
    return "Usuário";
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      const derivedProfileName = deriveProfileNameFromEmail(values.email);

      await updateProfile(user, {
        displayName: derivedProfileName,
        // photoURL: null, // Default photoURL can be set here or later
      });

      const userAccountDocRef = doc(db, "accounts", user.uid);
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        profileName: derivedProfileName,
        displayName: derivedProfileName,
        photoURL: user.photoURL, // Use photoURL from Firebase Auth if available (e.g., if they signed up with Google then email/pass)
        showId: "",
        kakoLiveId: "", // FUID from Kako
        role: null,
        adminLevel: null,
        isVerified: false, // Email verification will be pending
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        followerCount: 0,
        followingCount: 0,
        followingIds: [],
        // level: 1, // Level should come from linked KakoProfile
        bio: "",
        photos: [],
        socialLinks: {},
        themePreference: 'system',
        accentColor: '#4285F4',
        hasCompletedOnboarding: false,
        agreedToTermsAt: null,
        birthDate: null,
        country: null,
        gender: null,
        phoneNumber: null,
        currentDiamondBalance: 10000, // Award initial diamonds
        isBanned: false,
        banReason: null,
        bannedBy: null,
        bannedAt: null,
        hostStatus: null,
      };
      await setDoc(userAccountDocRef, newUserProfile);

      // Create user wallet with initial diamond balance
      const userWalletDocRef = doc(db, "userWallets", user.uid);
      const newUserWallet: UserWallet = {
        // id will be user.uid
        kakoId: "", // Will be populated if linked later
        diamonds: 10000,
        lastUpdatedAt: serverTimestamp(),
      };
      await setDoc(userWalletDocRef, newUserWallet);

      await sendEmailVerification(user);

      toast({
        title: "Cadastro Realizado!",
        description: "Enviamos um link de verificação para o seu email. Por favor, clique no link para ativar sua conta e depois faça o login.",
        duration: 9000,
      });
      router.push(`/login?email=${encodeURIComponent(user.email || "")}`);
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      let errorMessage = "Ocorreu um erro inesperado. Por favor, tente novamente.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este endereço de email já está em uso. Por favor, tente outro.";
      } else if (error.code) {
        errorMessage = error.message;
      }
      toast({
        title: "Falha no Cadastro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Digite seu email</FormLabel>
              <FormControl>
                <div className="relative">
                  <UserPlusIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="seunome@exemplo.com" {...field} className="pl-10 h-12" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Digite sua senha</FormLabel>
              <FormControl>
                <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Mínimo 6 caracteres" 
                    {...field}
                    className="pl-10 pr-10 h-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent hover:text-primary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirme sua senha</FormLabel>
              <FormControl>
                <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Repita a senha" 
                    {...field}
                    className="pl-10 pr-10 h-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent hover:text-primary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full h-12" disabled={loading}>
          {loading ? "Criando conta..." : <> <UserPlusIcon className="mr-2 h-4 w-4" /> Cadastrar </> }
        </Button>
      </form>
    </Form>
  );
}

    