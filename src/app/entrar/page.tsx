import { LogIn } from "lucide-react";
import { SalonLoginForm } from "@/components/public/salon-login-form";

export const metadata = {
  title: "Entrar — Unha Marcada",
  description: "Acesse o painel do seu salão.",
};

export default function EntrarPage() {
  return (
    <main className="flex flex-col items-center gap-8 bg-gradient-to-b from-rose-50 via-white to-white px-6 py-16 sm:py-20">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <LogIn className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">
          Entrar no painel do seu salão
        </h1>
        <p className="text-sm text-neutral-500">
          Use o e-mail e a senha que você cadastrou. Não precisa lembrar o endereço do seu salão.
        </p>
      </div>

      <div className="w-full max-w-md">
        <SalonLoginForm />
      </div>

      <p className="text-sm text-neutral-500">
        Ainda não tem conta?{" "}
        <a
          href="https://wa.me/5515996229973?text=Ol%C3%A1!%20Quero%20uma%20demonstra%C3%A7%C3%A3o%20da%20Unha%20Marcada."
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-rose-600 hover:underline"
        >
          Solicitar uma apresentação
        </a>
      </p>
    </main>
  );
}
