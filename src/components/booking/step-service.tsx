"use client";

import { Check, Hand, Footprints, Sparkles, Clock } from "lucide-react";
import { cn, formatBRL } from "@/lib/utils";
import { SERVICE_CATEGORY_LABELS } from "@/lib/constants";
import type { Service, ServiceCategory } from "@/types/database";

const CATEGORY_ICON: Record<ServiceCategory, typeof Hand> = {
  maos: Hand,
  pes: Footprints,
  combo: Sparkles,
};

export function StepService({
  services,
  selectedServiceId,
  onSelect,
}: {
  services: Service[];
  selectedServiceId: string | null;
  onSelect: (service: Service) => void;
}) {
  const categories: ServiceCategory[] = ["maos", "pes", "combo"];
  const groups = categories
    .map((category) => ({
      category,
      items: services.filter((service) => service.category === category),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-xl font-semibold text-neutral-900">Qual serviço você deseja?</h2>
        <p className="text-sm text-neutral-500">Escolha um serviço pra ver os horários disponíveis.</p>
      </div>

      {groups.map((group) => {
        const CategoryIcon = CATEGORY_ICON[group.category];
        return (
          <div key={group.category} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              <CategoryIcon className="h-3.5 w-3.5" />
              {SERVICE_CATEGORY_LABELS[group.category]}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.items.map((service) => {
                const isSelected = service.id === selectedServiceId;
                return (
                  <div
                    key={service.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelect(service)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") onSelect(service);
                    }}
                    className={cn(
                      "group relative flex cursor-pointer gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition-all",
                      isSelected
                        ? "border-rose-500 ring-1 ring-rose-500"
                        : "border-neutral-200 hover:border-rose-300 hover:shadow-md",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                        isSelected ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-500",
                      )}
                    >
                      <CategoryIcon className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-tight text-neutral-900">{service.name}</p>
                        <p className="shrink-0 whitespace-nowrap font-semibold text-neutral-900">
                          {formatBRL(service.price_cents)}
                        </p>
                      </div>
                      {service.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                          {service.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                          <Clock className="h-3 w-3" />
                          {service.duration_minutes} min · sinal de {service.deposit_percentage}%
                        </span>
                        <span
                          aria-hidden
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            isSelected
                              ? "border-rose-500 bg-rose-500 text-white"
                              : "border-neutral-200 bg-white",
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
