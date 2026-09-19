import { Sparkles } from "lucide-react";
import { SelfSignupForm } from "@/components/public/self-signup-form";

export const metadata = {
  title: "Criar minha conta — Unha Marcada",
  description: "Crie sua conta e comece a receber agendamentos online hoje mesmo.",
};

export default function ComecarPage() {
  return (
    <main className="flex flex-col items-center gap-8 bg-gradient-to-b from-rose-50 via-white to-white px-6 py-16 sm:py-20">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <Sparkles className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
          Sua agenda online em 2 minutos
        </h1>
        <p className="text-sm text-neutral-500">
          Crie sua conta grátis, cadastre seus serviços e comece a receber agendamentos com sinal
          pago na hora — sem precisar esperar ninguém liberar seu acesso.
        </p>
      </div>

      <div className="w-full max-w-md">
        <SelfSignupForm />
      </div>
    </main>
  );
}
