"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  schedulingSettingsFormSchema,
  type SchedulingSettingsFormInput,
} from "@/lib/validations/scheduling-settings";
import { saveSchedulingSettingsAction } from "@/app/[slug]/admin/(dashboard)/configuracoes/actions";

export function SchedulingSettingsForm({
  slug,
  bufferMinutes,
}: {
  slug: string;
  bufferMinutes: number;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SchedulingSettingsFormInput>({
    resolver: zodResolver(schedulingSettingsFormSchema),
    defaultValues: { bufferMinutes },
  });

  function onSubmit(data: SchedulingSettingsFormInput) {
    startTransition(async () => {
      const result = await saveSchedulingSettingsAction(slug, data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Configuração de agenda salva.");
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Intervalo entre atendimentos</h2>
          <p className="text-xs text-neutral-500">
            Tempo mínimo de folga entre o fim de um atendimento e o início do próximo (limpeza,
            descanso). Deixe em 0 se os atendimentos podem se encostar sem intervalo.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="bufferMinutes" className="text-xs">
              Minutos
            </Label>
            <Input
              id="bufferMinutes"
              type="number"
              min="0"
              max="120"
              className="w-24"
              {...register("bufferMinutes")}
            />
            {errors.bufferMinutes && (
              <p className="text-xs text-red-600">{errors.bufferMinutes.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting || isPending} className="w-fit">
            {(isSubmitting || isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
