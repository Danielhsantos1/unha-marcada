"use client";

import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SERVICE_CATEGORY_LABELS } from "@/lib/constants";
import { cn, formatBRL } from "@/lib/utils";
import type { Service, ServiceCategory } from "@/types/database";

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
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-xl font-semibold text-neutral-900">
        Qual serviço você deseja?
      </h2>

      {groups.map((group) => (
        <div key={group.category}>
          <Badge variant="secondary" className="mb-3">
            {SERVICE_CATEGORY_LABELS[group.category]}
          </Badge>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((service) => {
              const isSelected = service.id === selectedServiceId;
              return (
                <Card
                  key={service.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(service)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") onSelect(service);
                  }}
                  className={cn(
                    "cursor-pointer border-neutral-200 transition-all hover:border-rose-300",
                    isSelected && "border-rose-500 bg-rose-50/60",
                  )}
                >
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900">{service.name}</p>
                      {service.description && (
                        <p className="mt-1 text-sm text-neutral-500">{service.description}</p>
                      )}
                      <p className="mt-1 text-xs text-neutral-400">
                        {service.duration_minutes} min · sinal de {service.deposit_percentage}%
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p
                        className={cn(
                          "whitespace-nowrap font-semibold",
                          isSelected ? "text-rose-600" : "text-neutral-900",
                        )}
                      >
                        {formatBRL(service.price_cents)}
                      </p>
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                          isSelected
                            ? "border-rose-500 bg-rose-500 text-white"
                            : "border-neutral-300 bg-white",
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
