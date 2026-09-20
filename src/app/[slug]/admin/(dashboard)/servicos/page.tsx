import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ServiceFormDialog } from "@/components/admin/service-form-dialog";
import { ServiceActiveToggle } from "@/components/admin/service-active-toggle";
import { SERVICE_CATEGORY_LABELS } from "@/lib/constants";
import { formatBRL } from "@/lib/utils";
import type { Service } from "@/types/database";

function ServiceCard({ slug, service }: { slug: string; service: Service }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-neutral-900">{service.name}</p>
          <p className="text-xs text-neutral-400">{SERVICE_CATEGORY_LABELS[service.category]}</p>
        </div>
        <p className="whitespace-nowrap font-semibold text-rose-600">
          {formatBRL(service.price_cents)}
        </p>
      </div>
      <p className="text-sm text-neutral-500">
        {service.duration_minutes} min · sinal de {service.deposit_percentage}%
      </p>
      <div className="mt-1 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2">
        <div className="flex items-center gap-2">
          <ServiceActiveToggle slug={slug} serviceId={service.id} isActive={service.is_active} />
          <span className="text-xs text-neutral-500">{service.is_active ? "Ativo" : "Inativo"}</span>
        </div>
        <ServiceFormDialog slug={slug} service={service} />
      </div>
    </div>
  );
}

export default async function ServicosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("category")
    .order("display_order")
    .returns<Service[]>();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Serviços</h1>
        <ServiceFormDialog slug={slug} />
      </div>

      {(services ?? []).length === 0 ? (
        <p className="rounded-2xl border border-neutral-200 bg-white py-8 text-center text-neutral-400 shadow-sm">
          Nenhum serviço cadastrado ainda.
        </p>
      ) : (
        <>
          {/* Celular: um card por serviço — a tabela de 7 colunas cortava
              Sinal, Ativo e Editar numa tela de 360px. */}
          <div className="flex flex-col gap-3 md:hidden">
            {(services ?? []).map((service) => (
              <ServiceCard key={service.id} slug={slug} service={service} />
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Sinal</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(services ?? []).map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{SERVICE_CATEGORY_LABELS[service.category]}</TableCell>
                    <TableCell>{formatBRL(service.price_cents)}</TableCell>
                    <TableCell>{service.duration_minutes} min</TableCell>
                    <TableCell>{service.deposit_percentage}%</TableCell>
                    <TableCell>
                      <ServiceActiveToggle slug={slug} serviceId={service.id} isActive={service.is_active} />
                    </TableCell>
                    <TableCell>
                      <ServiceFormDialog slug={slug} service={service} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
