
export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-card shadow-sm border-t mt-auto">
      <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
        <p>&copy; {currentYear} The Presidential Agency. Todos os direitos reservados.</p>
        <p className="text-xs mt-1">Sua plataforma confiável para jogos de bingo emocionantes.</p>
      </div>
    </footer>
  );
}
