
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PremiumSignupWidget() {
  return (
    <Card className="bg-muted border-none rounded-xl">
      <CardHeader className="p-4">
        <CardTitle className="text-lg font-bold">Assine o Premium</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <CardDescription className="text-sm mb-3">
          Assine para desbloquear novos recursos e, se elegível, receba uma parte da receita.
        </CardDescription>
        <Button className="rounded-full font-semibold px-4 py-1.5 h-auto text-sm">Inscrever-se</Button>
      </CardContent>
    </Card>
  );
}
