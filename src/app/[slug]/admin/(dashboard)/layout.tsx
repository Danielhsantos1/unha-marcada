import { requireTenantStaff } from "@/lib/admin/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { MobileNav } from "@/components/admin/mobile-nav";
import { LogoutButton } from "@/components/admin/logout-button";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant, profile } = await requireTenantStaff(slug);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex print:hidden">
        <div className="flex flex-col gap-0.5 border-b border-neutral-100 px-5 py-5">
          <span className="text-sm font-semibold text-neutral-900">{tenant.name}</span>
          <span className="text-xs text-neutral-400">Unha Marcada · Painel</span>
        </div>
        <AdminNav slug={slug} className="flex flex-1 flex-col gap-1 p-3" />
        <div className="border-t border-neutral-100 p-3">
          <p className="mb-2 truncate px-2 text-xs text-neutral-400">{profile.full_name}</p>
          <LogoutButton slug={slug} className="w-full" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-neutral-200 bg-white px-2 py-2 md:hidden print:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <MobileNav slug={slug} tenantName={tenant.name} />
            <span className="truncate text-sm font-semibold text-neutral-900">{tenant.name}</span>
          </div>
          <LogoutButton slug={slug} className="shrink-0" />
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 print:p-0">{children}</main>
      </div>
    </div>
  );
}
