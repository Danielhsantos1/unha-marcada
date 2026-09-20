"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Eye, MessageCircle } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import { adminNavItems } from "@/lib/admin/nav-items";
import { buildBookingShareLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export function MobileNav({ slug, tenantName }: { slug: string; tenantName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const bookingUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/${slug}/agendar`;

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
        <div className="mb-4 flex flex-col gap-2 px-2 pt-1">
          <div>
            <p className="text-sm font-semibold text-neutral-900">{tenantName}</p>
            <p className="text-xs text-neutral-400">Unha Marcada · Painel</p>
          </div>
          <a
            href={`/${slug}/agendar?preview=admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-fit items-center gap-1.5 text-xs font-medium text-rose-600 hover:underline"
          >
            <Eye className="h-3.5 w-3.5" />
            Ver como cliente
          </a>
          <a
            href={buildBookingShareLink(tenantName, bookingUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-fit items-center gap-1.5 text-xs font-medium text-rose-600 hover:underline"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Enviar link de agendamento por WhatsApp
          </a>
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
                      ? "bg-rose-50 text-rose-700"
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
