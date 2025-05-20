
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchWidget() {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar"
        className="pl-10 rounded-full bg-muted border-transparent focus-visible:bg-card focus-visible:border-primary"
      />
    </div>
  );
}
