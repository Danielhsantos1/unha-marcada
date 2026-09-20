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
        <div className="rounded-br-3xl bg-rose-600 px-5 py-6 shadow-md">
          <span className="text-lg font-bold text-white">{tenant.name}</span>
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
