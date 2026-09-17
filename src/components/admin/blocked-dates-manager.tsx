"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { blockedDateFormSchema, type BlockedDateFormInput } from "@/lib/validations/blocked-date";
import { createBlockedDateAction, deleteBlockedDateAction } from "@/app/[slug]/admin/(dashboard)/configuracoes/actions";
import { formatDateBR, formatSaoPauloDateTime } from "@/lib/utils";
import type { BlockedDate } from "@/types/database";

export function BlockedDatesManager({ slug, blockedDates }: { slug: string; blockedDates: BlockedDate[] }) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BlockedDateFormInput>({
    resolver: zodResolver(blockedDateFormSchema),
  });

  function onSubmit(data: BlockedDateFormInput) {
    startTransition(async () => {
      const result = await createBlockedDateAction(slug, data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Horário bloqueado.");
      reset();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteBlockedDateAction(slug, id);
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Bloquear horários</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Data início</Label>
              <Input type="date" {...register("startDate")} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Hora início</Label>
              <Input type="time" {...register("startTime")} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Data fim</Label>
              <Input type="date" {...register("endDate")} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Hora fim</Label>
              <Input type="time" {...register("endTime")} />
            </div>
          </div>
          <Input placeholder="Motivo (opcional)" {...register("reason")} />
          {errors.endTime && <p className="text-xs text-red-600">{errors.endTime.message}</p>}

          <Button type="submit" disabled={isSubmitting || isPending} className="w-fit">
            {(isSubmitting || isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
            Bloquear
          </Button>
        </form>

        <div className="flex flex-col gap-2">
          {blockedDates.length === 0 && (
            <p className="text-sm text-neutral-400">Nenhum bloqueio futuro cadastrado.</p>
          )}
          {blockedDates.map((block) => (
            <div
              key={block.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-neutral-800">
                  {(() => {
                    const start = formatSaoPauloDateTime(block.starts_at);
                    const end = formatSaoPauloDateTime(block.ends_at);
                    return `${formatDateBR(start.date)} ${start.time} até ${formatDateBR(end.date)} ${end.time}`;
                  })()}
                </p>
                {block.reason && <p className="text-xs text-neutral-400">{block.reason}</p>}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 text-neutral-400 hover:text-red-600"
                onClick={() => handleDelete(block.id)}
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
