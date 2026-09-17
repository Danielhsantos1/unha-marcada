import { requirePlatformAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewSalonForm } from "@/components/platform/new-salon-form";
import { TenantStatusToggle } from "@/components/platform/tenant-status-toggle";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatDateBR } from "@/lib/utils";
import { platformSignOutAction } from "./actions";
import { Button } from "@/components/ui/button";
import type { Tenant } from "@/types/database";

export default async function PainelMestrePage() {
  await requirePlatformAdmin();

  const supabase = createAdminClient();
  const { data: tenants } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Tenant[]>();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Painel mestre</h1>
        <form action={platformSignOutAction}>
          <Button variant="ghost" size="sm" type="submit">
            Sair
          </Button>
        </form>
      </div>

      <NewSalonForm />

      <div>
        <h2 className="text-sm font-semibold text-neutral-900">Salões cadastrados</h2>
        <p className="mb-2 text-xs text-neutral-500">
          Suspender desliga a página pública e o link de agendar do salão (cliente parou de
          pagar, por exemplo) sem apagar nada — reative quando quiser.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(tenants ?? []).map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>
                  <code className="text-xs">{tenant.slug}</code>
                </TableCell>
                <TableCell>{formatDateBR(tenant.created_at.slice(0, 10))}</TableCell>
                <TableCell>
                  <TenantStatusToggle tenantId={tenant.id} isActive={tenant.is_active} />
                </TableCell>
              </TableRow>
            ))}
            {(tenants ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-neutral-400">
                  Nenhum salão cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
