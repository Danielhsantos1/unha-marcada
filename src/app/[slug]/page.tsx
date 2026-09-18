import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type { Tenant } from "@/types/database";

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

  return (
    <main className="flex flex-col items-center gap-5 bg-gradient-to-b from-rose-50 via-white to-white px-6 py-20 text-center sm:py-28">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl font-semibold text-rose-600 shadow-sm">
        {tenant.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
          Bem-vinda ao {tenant.name}
        </h1>
        {tenant.description && (
          <p className="max-w-md text-neutral-500">{tenant.description}</p>
        )}
      </div>
      <p className="text-lg font-medium text-neutral-700">
        Deseja realizar seu agendamento?
      </p>
      <Button asChild size="lg" className="mt-1">
        <Link href={`/${tenant.slug}/agendar`}>Agendar horário</Link>
      </Button>
    </main>
  );
}
