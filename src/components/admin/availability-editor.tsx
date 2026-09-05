"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { WEEKDAY_LABELS } from "@/lib/constants";
import { saveAvailabilityAction, type AvailabilityRowInput } from "@/app/[slug]/admin/(dashboard)/configuracoes/actions";
import type { Availability } from "@/types/database";

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // segunda..domingo

function buildInitialRows(availability: Availability[]): AvailabilityRowInput[] {
  return DISPLAY_ORDER.map((dayOfWeek) => {
    const existing = availability.find((a) => a.day_of_week === dayOfWeek);
    return {
      dayOfWeek,
      isOpen: Boolean(existing),
      startTime: existing?.start_time.slice(0, 5) ?? "09:00",
      endTime: existing?.end_time.slice(0, 5) ?? "18:00",
    };
  });
}

export function AvailabilityEditor({ slug, availability }: { slug: string; availability: Availability[] }) {
  const [rows, setRows] = useState<AvailabilityRowInput[]>(() => buildInitialRows(availability));
  const [isPending, startTransition] = useTransition();

  function updateRow(index: number, patch: Partial<AvailabilityRowInput>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveAvailabilityAction(slug, rows);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Horários salvos.");
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Horário de funcionamento</h2>

        <div className="flex flex-col gap-3">
          {rows.map((row, index) => (
            <div key={row.dayOfWeek} className="flex flex-wrap items-center gap-3">
              <div className="flex w-32 items-center gap-2">
                <Switch
                  checked={row.isOpen}
                  onCheckedChange={(checked) => updateRow(index, { isOpen: checked })}
                />
                <span className="text-sm text-neutral-700">{WEEKDAY_LABELS[row.dayOfWeek]}</span>
              </div>
              {row.isOpen && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={row.startTime}
                    onChange={(e) => updateRow(index, { startTime: e.target.value })}
                    className="w-28"
                  />
                  <span className="text-neutral-400">até</span>
                  <Input
                    type="time"
                    value={row.endTime}
                    onChange={(e) => updateRow(index, { endTime: e.target.value })}
                    className="w-28"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={isPending} className="w-fit">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar horários
        </Button>
      </CardContent>
    </Card>
  );
}
