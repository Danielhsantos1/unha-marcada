"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { serviceFormSchema, type ServiceFormInput } from "@/lib/validations/service";
import { createServiceAction, updateServiceAction } from "@/app/[slug]/admin/(dashboard)/servicos/actions";
import { SERVICE_CATEGORY_LABELS } from "@/lib/constants";
import type { Service } from "@/types/database";

export function ServiceFormDialog({ slug, service }: { slug: string; service?: Service }) {
  const [open, setOpen] = useState(false);
  const isEditing = Boolean(service);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormInput>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: service
      ? {
          name: service.name,
          category: service.category,
          description: service.description ?? "",
          price: service.price_cents / 100,
          duration_minutes: service.duration_minutes,
          deposit_percentage: service.deposit_percentage,
        }
      : {
          name: "",
          category: "maos",
          description: "",
          price: undefined,
          duration_minutes: undefined,
          deposit_percentage: 50,
        },
  });

  async function onSubmit(data: ServiceFormInput) {
    const result = service
      ? await updateServiceAction(slug, service.id, data)
      : await createServiceAction(slug, data);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Serviço atualizado." : "Serviço criado.");
    setOpen(false);
    if (!isEditing) reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="outline" size="sm">
            Editar
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Novo serviço
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar serviço" : "Novo serviço"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Categoria</Label>
            <Select
              value={watch("category")}
              onValueChange={(value) => setValue("category", value as ServiceFormInput["category"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SERVICE_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea id="description" {...register("description")} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input id="price" type="number" step="0.01" min="0" {...register("price")} />
              {errors.price && <p className="text-xs text-red-600">{errors.price.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="duration_minutes">Duração (min)</Label>
              <Input id="duration_minutes" type="number" min="1" {...register("duration_minutes")} />
              {errors.duration_minutes && (
                <p className="text-xs text-red-600">{errors.duration_minutes.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deposit_percentage">Sinal (%)</Label>
              <Input
                id="deposit_percentage"
                type="number"
                min="1"
                max="100"
                {...register("deposit_percentage")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
