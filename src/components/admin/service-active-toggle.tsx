"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { toggleServiceActiveAction } from "@/app/[slug]/admin/(dashboard)/servicos/actions";

export function ServiceActiveToggle({
  slug,
  serviceId,
  isActive,
}: {
  slug: string;
  serviceId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    startTransition(async () => {
      const result = await toggleServiceActiveAction(slug, serviceId, checked);
      if (result.error) toast.error(result.error);
    });
  }

  return <Switch checked={isActive} onCheckedChange={handleChange} disabled={isPending} />;
}
