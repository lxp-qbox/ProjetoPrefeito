"use client";

import Link from "next/link";

export default function FooterLinksWidget() {
  const footerLinks = [
    { name: "Termos de Serviço", href: "/terms" }, 
    { name: "Política de Privacidade", href: "/privacy" },
    { name: "Política de cookies", href: "/cookies" }, 
    { name: "Acessibilidade", href: "/accessibility" },
    { name: "Informações de anúncios", href: "/ads-info" }, 
    { name: "Mais...", href: "/more" },
  ];
  
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="px-4 py-2">
      <nav aria-label="Links do rodapé">
        <ul className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {footerLinks.map((link) => (
            <li key={link.name}>
              <Link 
                href={link.href} 
                className="hover:underline hover:text-primary/80 transition-colors"
                aria-label={link.name}
              >
                {link.name}
              </Link>
            </li>
          ))}
          <li>
            <span className="text-xs text-muted-foreground">© {currentYear} The Presidential Agency.</span>
          </li>
        </ul>
      </nav>
    </footer>
  );
} 