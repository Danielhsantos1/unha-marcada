"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { newTenantFormSchema, type NewTenantFormInput } from "@/lib/validations/new-tenant";
import { createSalonAction, type CreateSalonResult } from "@/app/painel-mestre/actions";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
        <code className="flex-1 overflow-x-auto whitespace-nowrap text-xs text-neutral-700">
          {value}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="text-neutral-400 hover:text-neutral-700"
          aria-label={`Copiar ${label}`}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function NewSalonForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<NonNullable<CreateSalonResult["data"]>>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewTenantFormInput>({
    resolver: zodResolver(newTenantFormSchema),
  });

  function onSubmit(data: NewTenantFormInput) {
    startTransition(async () => {
      const response = await createSalonAction(data);
      if (response.error) {
        toast.error(response.error);
        return;
      }
      setResult(response.data);
      reset();
    });
  }

  if (result) {
    const loginUrl = `${SITE_URL}/${result.slug}/admin/login`;
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div>
            <h2 className="text-sm font-semibold text-emerald-700">Salão criado</h2>
            <p className="text-xs text-neutral-500">
              Repassa esses dados pra responsável (WhatsApp, e-mail — o que for) e some com essa
              senha depois. Isso só aparece uma vez.
            </p>
          </div>
          <CopyField label="Link de login" value={loginUrl} />
          <CopyField label="E-mail" value={result.ownerEmail} />
          <CopyField label="Senha temporária" value={result.tempPassword} />
          <Button variant="outline" className="w-fit" onClick={() => setResult(undefined)}>
            Criar outro salão
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Novo salão</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Nome do salão</Label>
              <Input placeholder="Studio Bella Unha" {...register("salonName")} />
              {errors.salonName && (
                <p className="text-xs text-red-600">{errors.salonName.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Slug (URL)</Label>
              <Input placeholder="studio-bella-unha" {...register("slug")} />
              {errors.slug && <p className="text-xs text-red-600">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Telefone (opcional)</Label>
              <Input placeholder="11999999999" {...register("phone")} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Cor principal (opcional)</Label>
              <Input placeholder="#D9A5B3" {...register("primaryColor")} />
              {errors.primaryColor && (
                <p className="text-xs text-red-600">{errors.primaryColor.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Nome da responsável</Label>
              <Input placeholder="Maria da Silva" {...register("ownerName")} />
              {errors.ownerName && (
                <p className="text-xs text-red-600">{errors.ownerName.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">E-mail da responsável</Label>
              <Input type="email" placeholder="maria@email.com" {...register("ownerEmail")} />
              {errors.ownerEmail && (
                <p className="text-xs text-red-600">{errors.ownerEmail.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting || isPending} className="mt-2 w-fit">
            {(isSubmitting || isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar salão
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
