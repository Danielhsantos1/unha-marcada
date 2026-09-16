"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  paymentSettingsFormSchema,
  type PaymentSettingsFormInput,
} from "@/lib/validations/payment-settings";
import { savePaymentCredentialsAction } from "@/app/[slug]/admin/(dashboard)/configuracoes/actions";

export function PaymentSettingsForm({
  slug,
  configured,
  maskedAccessToken,
}: {
  slug: string;
  configured: boolean;
  maskedAccessToken: string | null;
}) {
  const [isEditing, setIsEditing] = useState(!configured);
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentSettingsFormInput>({
    resolver: zodResolver(paymentSettingsFormSchema),
  });

  function onSubmit(data: PaymentSettingsFormInput) {
    startTransition(async () => {
      const result = await savePaymentCredentialsAction(slug, data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Credenciais do Mercado Pago salvas.");
      reset();
      setIsEditing(false);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Recebimento de pagamentos</h2>
          <p className="text-xs text-neutral-500">
            Conecte a conta do Mercado Pago do salão. O sinal PIX pago pelas clientes cai direto
            nessa conta — a plataforma nunca recebe o dinheiro.
          </p>
        </div>

        {!isEditing && configured && (
          <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-emerald-700">Mercado Pago conectado</p>
              <p className="text-xs text-neutral-400">Access Token: {maskedAccessToken}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Trocar credenciais
            </Button>
          </div>
        )}

        {isEditing && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Access Token de produção</Label>
              <Input
                type="password"
                placeholder="APP_USR-..."
                {...register("mercadopagoAccessToken")}
              />
              {errors.mercadopagoAccessToken && (
                <p className="text-xs text-red-600">{errors.mercadopagoAccessToken.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Assinatura secreta do webhook</Label>
              <Input
                type="password"
                placeholder="Painel de desenvolvedores > Webhooks"
                {...register("mercadopagoWebhookSecret")}
              />
              {errors.mercadopagoWebhookSecret && (
                <p className="text-xs text-red-600">{errors.mercadopagoWebhookSecret.message}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || isPending} className="w-fit">
                {(isSubmitting || isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
              {configured && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-fit"
                  onClick={() => {
                    reset();
                    setIsEditing(false);
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
