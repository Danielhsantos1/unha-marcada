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

        {(tenants ?? []).length === 0 ? (
          <p className="rounded-2xl border border-neutral-200 bg-white py-8 text-center text-neutral-400">
            Nenhum salão cadastrado ainda.
          </p>
        ) : (
          <>
            {/* Celular: um card por salão — a tabela de 4 colunas não cabe
                numa tela de 360px sem cortar o Status. */}
            <div className="flex flex-col gap-3 sm:hidden">
              {(tenants ?? []).map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-neutral-900">{tenant.name}</p>
                    <TenantStatusToggle tenantId={tenant.id} isActive={tenant.is_active} />
                  </div>
                  <code className="text-xs text-neutral-500">{tenant.slug}</code>
                  <p className="text-xs text-neutral-400">
                    Criado em {formatDateBR(tenant.created_at.slice(0, 10))}
                  </p>
                </div>
              ))}
            </div>

            <div className="hidden sm:block">
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
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
