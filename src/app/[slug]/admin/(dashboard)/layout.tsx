import { requireTenantStaff } from "@/lib/admin/auth";
import { AdminNav } from "@/components/admin/admin-nav";
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
      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="flex flex-col gap-0.5 border-b border-neutral-100 px-5 py-5">
          <span className="text-sm font-semibold text-neutral-900">{tenant.name}</span>
          <span className="text-xs text-neutral-400">Unha Marcada · Painel</span>
        </div>
        <AdminNav slug={slug} className="flex flex-1 flex-col gap-1 p-3" />
        <div className="border-t border-neutral-100 p-3">
          <p className="mb-2 truncate px-2 text-xs text-neutral-400">{profile.full_name}</p>
          <LogoutButton slug={slug} />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
          <span className="text-sm font-semibold text-neutral-900">{tenant.name}</span>
          <LogoutButton slug={slug} />
        </header>
        <AdminNav slug={slug} className="flex gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-3 py-2 md:hidden" />

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
