import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unha Marcada — Agendamento de Manicure e Pedicure",
  description: "Agende seu horário de manicure e pedicure com pagamento de sinal via PIX.",
};

// Garante que toda página abre na escala correta em qualquer aparelho —
// sem isso, alguns navegadores mobile escolhem um zoom inicial próprio e
// elementos (como o rodapé dos diálogos) podem nascer fora da área visível.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
