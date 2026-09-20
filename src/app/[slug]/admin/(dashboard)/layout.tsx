import { Eye, MessageCircle } from "lucide-react";
import { requireTenantStaff } from "@/lib/admin/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { MobileNav } from "@/components/admin/mobile-nav";
import { LogoutButton } from "@/components/admin/logout-button";
import { buildBookingShareLink } from "@/lib/whatsapp";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant, profile } = await requireTenantStaff(slug);
  const bookingUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/${slug}/agendar`;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex print:hidden">
        <div className="flex flex-col gap-3 rounded-br-3xl bg-rose-600 px-5 py-6 shadow-md">
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-bold text-white">{tenant.name}</span>
            <span className="text-xs text-white/70">Unha Marcada · Painel</span>
          </div>
          <a
            href={`/${slug}/agendar?preview=admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-full border border-white/40 bg-white/10 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20"
          >
            <Eye className="h-3.5 w-3.5" />
            Ver como cliente
          </a>
          <a
            href={buildBookingShareLink(tenant.name, bookingUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#20bd5a]"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Enviar link de agendamento por WhatsApp
          </a>
        </div>
        <AdminNav slug={slug} className="flex flex-1 flex-col gap-1 p-3" />
        <div className="border-t border-neutral-100 p-3">
          <p className="mb-2 truncate px-2 text-xs text-neutral-400">{profile.full_name}</p>
          <LogoutButton slug={slug} className="w-full" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-50 flex transform-gpu items-center justify-between gap-2 rounded-b-3xl bg-rose-600 px-4 py-4 shadow-md backface-hidden will-change-transform md:hidden print:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <MobileNav slug={slug} tenantName={tenant.name} />
            <span className="truncate text-lg font-bold text-white">{tenant.name}</span>
          </div>
          <LogoutButton slug={slug} className="shrink-0 text-white hover:bg-white/10 hover:text-white" />
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
