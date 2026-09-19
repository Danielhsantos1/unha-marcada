"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Tenant } from "@/types/database";

interface LoginFields {
  email: string;
  password: string;
}

/**
 * A returning salon owner rarely remembers their own slug-scoped login URL
 * (/[slug]/admin/login) — this signs them in once with just e-mail/senha,
 * then looks up which tenant they belong to (via their own profile, which
 * RLS always lets a user read) and sends them straight to their panel.
 */
export function SalonLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit } = useForm<LoginFields>();

  async function onSubmit(data: LoginFields) {
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError || !signIn.user) {
      setError("E-mail ou senha inválidos.");
      setIsSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", signIn.user.id)
      .maybeSingle<Pick<Profile, "tenant_id">>();

    if (!profile) {
      setError("Essa conta não está vinculada a nenhum salão.");
      await supabase.auth.signOut();
      setIsSubmitting(false);
      return;
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("slug")
      .eq("id", profile.tenant_id)
      .maybeSingle<Pick<Tenant, "slug">>();

    if (!tenant) {
      setError("Seu salão está inativo no momento. Fale com o suporte.");
      await supabase.auth.signOut();
      setIsSubmitting(false);
      return;
    }

    router.push(`/${tenant.slug}/admin`);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required {...register("email")} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required {...register("password")} />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
