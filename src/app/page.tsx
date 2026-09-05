import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-rose-50 to-white px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <Sparkles className="h-6 w-6" />
      </span>
      <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">
        Unha Marcada
      </p>
      <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
        Plataforma de agendamento para manicures e pedicures
      </h1>
      <p className="max-w-xl text-neutral-500">
        Cada salão tem sua própria página pública de agendamento. Este é um projeto
        multi-tenant: acesse a página de um salão pelo respectivo endereço, por
        exemplo, a demonstração abaixo.
      </p>
      <Link
        href="/studio-nude"
        className="rounded-full bg-rose-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-600"
      >
        Ver salão de demonstração (Studio Nude)
      </Link>
    </main>
  );
}
