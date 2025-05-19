
import SupportTicketForm from "@/components/support/support-ticket-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LifeBuoy, Headphones, MessageSquare } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4 mx-auto">
            <Headphones className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Support Center</CardTitle>
          <CardDescription>Need help? Fill out the form below and our team will assist you shortly.</CardDescription>
        </CardHeader>
        <CardContent>
          <SupportTicketForm />
        </CardContent>
      </Card>

      <div className="mt-8 p-6 bg-card rounded-lg shadow-md text-center">
        <h3 className="text-xl font-semibold mb-2 text-primary flex items-center justify-center">
          <LifeBuoy className="mr-2 h-6 w-6" />
          Alternative Support Options
        </h3>
        <p className="text-muted-foreground">
          For urgent issues, you can also reach us via email at <a href="mailto:support@presidential.agency" className="text-accent hover:underline">support@presidential.agency</a>.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Our support hours are Monday - Friday, 9 AM - 5 PM.
        </p>
      </div>
    </div>
  );
}
