
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Send } from "lucide-react";
// import { useAuth } from "@/hooks/use-auth"; // Optional: to associate ticket with user

const formSchema = z.object({
  subject: z.string().min(5, { message: "O assunto deve ter pelo menos 5 caracteres." }).max(100, { message: "O assunto não pode exceder 100 caracteres." }),
  message: z.string().min(20, { message: "A mensagem deve ter pelo menos 20 caracteres." }).max(1000, { message: "A mensagem não pode exceder 1000 caracteres." }),
});

export default function SupportTicketForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  // const { currentUser } = useAuth(); // Optional

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log("Ticket de Suporte Enviado:", { 
      ...values, 
      // userId: currentUser?.uid, // Optional
      createdAt: new Date() 
    });

    toast({
      title: "Ticket de Suporte Enviado",
      description: "Obrigado pela sua mensagem! Entraremos em contato em breve.",
    });
    form.reset();
    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assunto</FormLabel>
              <FormControl>
                <Input placeholder="ex: Problema com login no jogo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mensagem</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Por favor, descreva seu problema em detalhes..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Enviando..." : <> <Send className="mr-2 h-4 w-4" /> Enviar Ticket </> }
        </Button>
      </form>
    </Form>
  );
}
