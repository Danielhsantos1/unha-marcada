"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/[slug]/admin/(dashboard)/actions";

export function LogoutButton({ slug, className }: { slug: string; className?: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("justify-start gap-2 text-neutral-500", className)}
      onClick={() => signOutAction(slug)}
    >
      <LogOut className="h-4 w-4" />
      Sair
    </Button>
  );
}
