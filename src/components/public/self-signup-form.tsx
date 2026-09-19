"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CopyField } from "@/components/ui/copy-field";
import { createClient } from "@/lib/supabase/client";
import { newTenantFormSchema, type NewTenantFormInput } from "@/lib/validations/new-tenant";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function SelfSignupForm() {
  const router = useRouter();
  const [result, setResult] = useState<{ slug: string; ownerEmail: string; tempPassword: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnteringNow, setIsEnteringNow] = useState(false);
  const slugTouched = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NewTenantFormInput>({
    resolver: zodResolver(newTenantFormSchema),
  });

  function handleSalonNameChange(value: string) {
    if (!slugTouched.current) {
      setValue("slug", slugify(value));
    }
  }

  async function onSubmit(data: NewTenantFormInput) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tenants/self-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await response.json();

      if (!response.ok) {
        toast.error(json.error ?? "Não foi possível criar sua conta.");
        return;
      }

      setResult(json);
    } catch {
      toast.error("Falha de conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEnterNow() {
    if (!result) return;
    setIsEnteringNow(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: result.ownerEmail,
      password: result.tempPassword,
    });

    if (error) {
      toast.error("Não deu pra entrar automaticamente. Use o link de login com os dados acima.");
      setIsEnteringNow(false);
      return;
    }

    router.push(`/${result.slug}/admin`);
    router.refresh();
  }

  if (result) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-emerald-700">Sua conta foi criada 🎉</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Guarde esses dados — a senha só aparece aqui uma vez. Você pode trocá-la depois de
              entrar.
            </p>
          </div>
          <CopyField label="E-mail" value={result.ownerEmail} />
          <CopyField label="Senha temporária" value={result.tempPassword} />
          <Button size="lg" onClick={handleEnterNow} disabled={isEnteringNow}>
            {isEnteringNow && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar no meu painel
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="salonName">Nome do salão</Label>
            <Input
              id="salonName"
              placeholder="Studio Bella Unha"
              {...register("salonName", {
                onChange: (e) => handleSalonNameChange(e.target.value),
              })}
            />
            {errors.salonName && <p className="text-xs text-red-600">{errors.salonName.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">Endereço do seu salão</Label>
            <div className="flex items-center rounded-full border border-neutral-200 bg-white pl-3 text-sm text-neutral-400 focus-within:border-rose-400">
              <span className="whitespace-nowrap">/</span>
              <input
                id="slug"
                placeholder="studio-bella-unha"
                className="w-full bg-transparent py-2.5 pr-4 text-neutral-900 outline-none"
                {...register("slug", {
                  onChange: () => {
                    slugTouched.current = true;
                  },
                })}
              />
            </div>
            {errors.slug && <p className="text-xs text-red-600">{errors.slug.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ownerName">Seu nome</Label>
            <Input id="ownerName" placeholder="Maria da Silva" {...register("ownerName")} />
            {errors.ownerName && <p className="text-xs text-red-600">{errors.ownerName.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ownerEmail">Seu e-mail</Label>
            <Input
              id="ownerEmail"
              type="email"
              placeholder="maria@email.com"
              {...register("ownerEmail")}
            />
            {errors.ownerEmail && <p className="text-xs text-red-600">{errors.ownerEmail.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">WhatsApp (opcional)</Label>
            <Input id="phone" placeholder="11999999999" {...register("phone")} />
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting} className="mt-1">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar minha conta grátis
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
