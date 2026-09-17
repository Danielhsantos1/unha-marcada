"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toggleTenantActiveAction } from "@/app/painel-mestre/actions";

export function TenantStatusToggle({
  tenantId,
  isActive,
}: {
  tenantId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    startTransition(async () => {
      const result = await toggleTenantActiveAction(tenantId, checked);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(checked ? "Salão reativado." : "Salão suspenso.");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Switch checked={isActive} onCheckedChange={handleChange} disabled={isPending} />
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Ativo" : "Suspenso"}
      </Badge>
    </div>
  );
}
