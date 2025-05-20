
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
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db, doc, setDoc, serverTimestamp } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, UserPlus, ShieldQuestion, UserSquare2 } from "lucide-react";
import type { UserProfile } from "@/types";

const formSchema = z.object({
  profileName: z.string().min(3, { message: "Nome de Perfil deve ter pelo menos 3 caracteres." }).max(30, { message: "Nome de Perfil não pode exceder 30 caracteres." }),
  kakoLiveId: z.string().min(3, {message: "Passaporte (ID do Kako Live) deve ter pelo menos 3 caracteres."}).max(50, { message: "Passaporte (ID do Kako Live) não pode exceder 50 caracteres."}).optional().or(z.literal("")),
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
      profileName: "",
      kakoLiveId: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: values.profileName,
      });

      // Create Firestore document
      const userDocRef = doc(db, "users", user.uid);
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        profileName: values.profileName,
        kakoLiveId: values.kakoLiveId || "",
        role: 'player',
        isVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        followerCount: 0,
        followingCount: 0,
        level: 1,
        photos: [],
        socialLinks: {},
        themePreference: 'system',
      };
      await setDoc(userDocRef, newUserProfile);

      toast({
        title: "Cadastro Realizado com Sucesso",
        description: "Sua conta foi criada. Bem-vindo(a)!",
      });
      router.push("/profile");
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      toast({
        title: "Falha no Cadastro",
        description: error.message || "Ocorreu um erro inesperado. Por favor, tente novamente.",
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
          name="profileName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome de Perfil</FormLabel>
              <FormControl>
                <div className="relative">
                  <UserSquare2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Seu nome de usuário" {...field} className="pl-10" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="kakoLiveId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Passaporte (ID do Kako Live) <span className="text-xs text-muted-foreground">(Opcional)</span></FormLabel>
              <FormControl>
                 <div className="relative">
                  <ShieldQuestion className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Seu ID Kako Live" {...field} className="pl-10" />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="voce@exemplo.com" {...field} />
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
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    {...field} 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              <FormLabel>Confirmar Senha</FormLabel>
              <FormControl>
                <div className="relative">
                   <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    {...field} 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando conta..." : <> <UserPlus className="mr-2 h-4 w-4" /> Cadastrar </>}
        </Button>
      </form>
    </Form>
  );
}
