"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PlatformLoginPage() {
  return (
    <Suspense fallback={null}>
      <PlatformLoginForm />
    </Suspense>
  );
}

function PlatformLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accessError = searchParams.get("erro") === "sem_acesso";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("E-mail ou senha inválidos.");
      setIsSubmitting(false);
      return;
    }

    router.push("/painel-mestre");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 to-white px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Painel mestre</CardTitle>
          <p className="text-sm text-neutral-500">Acesso restrito ao operador da plataforma.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {accessError && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Esta conta não tem acesso ao painel mestre.
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
