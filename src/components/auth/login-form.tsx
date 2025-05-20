
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword, signInWithPopup, sendEmailVerification } from "firebase/auth";
import { auth, GoogleAuthProvider, db, doc, getDoc } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, User, Lock } from "lucide-react";
import type { UserProfile } from "@/types";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

const formSchema = z.object({
  email: z.string().email({ message: "Endereço de email inválido." }),
  password: z.string().min(6, { message: "A senha precisa ter no mínimo 6 caracteres." }),
  rememberMe: z.boolean().optional(),
});

export default function LoginForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const handleRedirect = async (userId: string) => {
    try {
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userProfile = userDocSnap.data() as UserProfile;
        
        if (!userProfile.agreedToTermsAt) {
          router.replace("/onboarding/terms");
        } else if (!userProfile.role) {
          router.replace("/onboarding/role-selection");
        } else if (!userProfile.birthDate || !userProfile.gender || !userProfile.country || !userProfile.phoneNumber) {
          router.replace("/onboarding/age-verification");
        } else if (userProfile.hasCompletedOnboarding === false || typeof userProfile.hasCompletedOnboarding === 'undefined') {
          if (userProfile.role === 'host') {
            router.replace("/onboarding/kako-id-input");
          } else if (userProfile.role === 'player') {
            router.replace("/onboarding/kako-account-check");
          } else {
            router.replace("/profile"); // Fallback for unexpected role but onboarding not complete
          }
        } else {
          router.replace("/profile"); // Onboarding complete, go to profile
        }
      } else {
        // New user created via Google Sign-In or if somehow doc doesn't exist
        router.replace("/onboarding/terms"); 
      }
    } catch (error) {
      console.error("Error fetching user profile for redirect:", error);
      toast({ title: "Erro de Redirecionamento", description: "Não foi possível verificar seu status de onboarding.", variant: "destructive" });
      router.replace("/profile"); 
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      if (!userCredential.user.emailVerified) {
        toast({
          title: "Email Não Verificado",
          description: "Por favor, verifique seu email antes de fazer login. Se necessário, um novo email de verificação pode ser enviado.",
          variant: "destructive",
          duration: 9000,
        });
        setLoading(false);
        return;
      }
      toast({
        title: "Login Bem-sucedido",
        description: "Bem-vindo(a) de volta!",
      });
      await handleRedirect(userCredential.user.uid);
    } catch (error: any) {
      console.error("Email/Password login error:", error);
      let errorMessage = "Ocorreu um erro inesperado. Por favor, tente novamente.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Email ou senha inválidos.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Muitas tentativas de login. Por favor, tente novamente mais tarde.";
      } else {
        errorMessage = error.message || errorMessage;
      }
      toast({
        title: "Falha no Login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      toast({
        title: "Login com Google Bem-sucedido",
        description: "Bem-vindo(a)!",
      });
      await handleRedirect(userCredential.user.uid); 
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      toast({
        title: "Falha no Login com Google",
        description: error.message || "Não foi possível fazer login com o Google. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
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
              {/* <FormLabel>Email *</FormLabel> */}
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Digite seu email" {...field} className="pl-10" />
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
              {/* <FormLabel>Senha *</FormLabel> */}
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    {...field}
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 hover:bg-transparent"
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
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    id="rememberMeLogin"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="rememberMeLogin" className="font-normal cursor-pointer text-sm text-muted-foreground">
                    Lembrar de mim
                  </Label>
                </div>
              </FormItem>
            )}
          />
          <Link href="/forgot-password" className="text-sm font-medium text-primary no-underline hover:underline">
            Esqueceu a senha?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={loading || googleLoading}>
          Entrar
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continue com
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          type="button"
          className="w-full border hover:bg-muted hover:text-secondary-foreground"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          {googleLoading ? "Entrando com Google..." : (
            <>
              <GoogleIcon className="mr-2 h-6 w-6" />
              Entrar com Google
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

    