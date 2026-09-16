import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ServiceFormDialog } from "@/components/admin/service-form-dialog";
import { ServiceActiveToggle } from "@/components/admin/service-active-toggle";
import { SERVICE_CATEGORY_LABELS } from "@/lib/constants";
import { formatBRL } from "@/lib/utils";
import type { Service } from "@/types/database";

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
          {(services ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-neutral-400">
                Nenhum serviço cadastrado ainda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
