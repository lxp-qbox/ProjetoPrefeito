
import Link from "next/link";

const footerLinks = [
  { name: "Termos de Serviço", href: "#" },
  { name: "Política de Privacidade", href: "#" },
  { name: "Política de cookies", href: "#" },
  { name: "Acessibilidade", href: "#" },
  { name: "Informações de anúncios", href: "#" },
  { name: "Mais...", href: "#" },
];

export function FooterLinksWidget() {
  return (
    <div className="px-4 py-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap gap-x-2 gap-y-1">
        {footerLinks.map((link) => (
          <Link key={link.name} href={link.href} className="hover:underline">
            {link.name}
          </Link>
        ))}
        <span>© 2025 X Corp.</span>
      </div>
    </div>
  );
}
