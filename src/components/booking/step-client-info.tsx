"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientInfoSchema, type ClientInfoInput } from "@/lib/validations/booking";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function StepClientInfo({
  defaultValues,
  onSubmit,
}: {
  defaultValues: Partial<ClientInfoInput>;
  onSubmit: (data: ClientInfoInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientInfoInput>({
    resolver: zodResolver(clientInfoSchema),
    defaultValues,
  });

  return (
    <form
      id="client-info-form"
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto flex w-full max-w-md flex-col gap-5"
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-xl font-semibold text-neutral-900">Seus dados</h2>
        <p className="text-sm text-neutral-500">Pra confirmar seu agendamento e avisar sobre ele.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clientName">Nome</Label>
        <Input id="clientName" placeholder="Seu nome completo" {...register("clientName")} />
        {errors.clientName && (
          <p className="text-xs text-red-600">{errors.clientName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clientPhone">WhatsApp</Label>
        <Input
          id="clientPhone"
          placeholder="(11) 91234-5678"
          inputMode="tel"
          {...register("clientPhone")}
        />
        {errors.clientPhone && (
          <p className="text-xs text-red-600">{errors.clientPhone.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clientEmail">E-mail (opcional)</Label>
        <Input
          id="clientEmail"
          type="email"
          placeholder="voce@email.com"
          {...register("clientEmail")}
        />
        {errors.clientEmail && (
          <p className="text-xs text-red-600">{errors.clientEmail.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="clientNotes">Observação (opcional)</Label>
        <Textarea
          id="clientNotes"
          placeholder="Alguma preferência ou observação?"
          {...register("clientNotes")}
        />
      </div>
    </form>
  );
}
