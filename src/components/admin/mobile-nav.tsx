"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import { adminNavItems } from "@/lib/admin/nav-items";
import { cn } from "@/lib/utils";

export function MobileNav({ slug, tenantName }: { slug: string; tenantName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menu"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white hover:bg-white/10"
        >
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="mb-4 px-2 pt-1">
          <p className="text-sm font-semibold text-neutral-900">{tenantName}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {adminNavItems(slug).map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <SheetClose asChild key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-colors",
                    isActive
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {label}
                </Link>
              </SheetClose>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
