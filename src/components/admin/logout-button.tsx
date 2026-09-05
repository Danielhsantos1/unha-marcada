"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/[slug]/admin/(dashboard)/actions";

export function LogoutButton({ slug }: { slug: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-neutral-500"
      onClick={() => signOutAction(slug)}
    >
      <LogOut className="h-4 w-4" />
      Sair
    </Button>
  );
}
