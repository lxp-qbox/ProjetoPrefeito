
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
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }).max(100, { message: "Subject cannot exceed 100 characters." }),
  message: z.string().min(20, { message: "Message must be at least 20 characters." }).max(1000, { message: "Message cannot exceed 1000 characters." }),
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

    console.log("Support Ticket Submitted:", { 
      ...values, 
      // userId: currentUser?.uid, // Optional
      createdAt: new Date() 
    });

    toast({
      title: "Support Ticket Submitted",
      description: "Thank you for your message! We'll get back to you soon.",
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
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Issue with game login" {...field} />
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
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please describe your issue in detail..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Submitting..." : <> <Send className="mr-2 h-4 w-4" /> Submit Ticket </> }
        </Button>
      </form>
    </Form>
  );
}
