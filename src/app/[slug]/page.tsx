import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SERVICE_CATEGORY_LABELS } from "@/lib/constants";
import { formatBRL } from "@/lib/utils";
import type { Service, ServiceCategory, Tenant } from "@/types/database";

export default async function TenantLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle<Tenant>();

  if (!tenant) notFound();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("display_order")
    .returns<Service[]>();

  const categories: ServiceCategory[] = ["maos", "pes", "combo"];
  const servicesByCategory = categories
    .map((category) => ({
      category,
      items: (services ?? []).filter((service) => service.category === category),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <main className="flex flex-col bg-gradient-to-b from-rose-50 via-white to-white">
      <header className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 pt-16 pb-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl font-semibold text-rose-600 shadow-sm">
          {tenant.name.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">{tenant.name}</h1>
        {tenant.description && (
          <p className="max-w-xl text-neutral-500">{tenant.description}</p>
        )}
        <Button asChild size="lg" className="mt-2">
          <Link href={`/${tenant.slug}/agendar`}>Agendar horário</Link>
        </Button>
      </header>

      <section className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20">
        <h2 className="mb-6 text-center text-xl font-semibold text-neutral-900">
          Nossos serviços
        </h2>

        <div className="flex flex-col gap-8">
          {servicesByCategory.map((group) => (
            <div key={group.category}>
              <Badge variant="secondary" className="mb-3">
                {SERVICE_CATEGORY_LABELS[group.category]}
              </Badge>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((service) => (
                  <Card key={service.id}>
                    <CardContent className="flex items-start justify-between gap-4 p-4">
                      <div>
                        <p className="font-medium text-neutral-900">{service.name}</p>
                        {service.description && (
                          <p className="mt-1 text-sm text-neutral-500">{service.description}</p>
                        )}
                        <p className="mt-1 text-xs text-neutral-400">
                          {service.duration_minutes} min
                        </p>
                      </div>
                      <p className="whitespace-nowrap font-semibold text-rose-600">
                        {formatBRL(service.price_cents)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
