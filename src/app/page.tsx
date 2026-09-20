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
        Chega de agendar pelo WhatsApp
      </h1>
      <p className="max-w-xl text-neutral-500">
        Crie o link do seu salão e deixe suas clientes marcarem horário sozinhas,
        24h por dia. Veja na prática como funciona.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <a
          href="https://wa.me/5515996229973?text=Ol%C3%A1!%20Quero%20uma%20demonstra%C3%A7%C3%A3o%20da%20Unha%20Marcada."
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-rose-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-600"
        >
          Solicitar demonstração
        </a>
        <Link
          href="/studio-nude"
          className="rounded-full border border-neutral-200 px-6 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          Ver salão de demonstração
        </Link>
      </div>
      <p className="text-sm text-neutral-400">
        Já tem uma conta?{" "}
        <Link href="/entrar" className="font-medium text-rose-600 hover:underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
