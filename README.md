# Unha Marcada — Agendamento Online para Manicure & Pedicure (com sinal via PIX)

Plataforma de agendamento **multi-tenant** (vários salões na mesma aplicação,
cada um com sua própria página e agenda) onde o horário só é confirmado
depois que a cliente paga 50% do valor do serviço via PIX.

Este README foi escrito assumindo que você está começando com Next.js e
Supabase — cada seção explica o "porquê", não só o "como".

---

## 1. Visão geral do que já está pronto (Fase 1 — MVP)

- ✅ Schema completo do banco (Postgres/Supabase) com RLS
- ✅ Fluxo público de agendamento (6 telas: serviço → data → horário → dados
  → resumo → PIX)
- ✅ Geração de PIX via Mercado Pago + webhook de confirmação automática
- ✅ Reserva de horário por 15 minutos com expiração automática
- ✅ Design responsivo (mobile first) com a paleta rosa claro/nude

**Ainda não incluído nesta entrega (próximas fases, combinadas com você):**

- ⏳ Fase 2: Dashboard administrativo (login, gestão de agenda/serviços,
  bloqueio de horários, cancelamento, clientes)
- ⏳ Fase 3: Relatórios e notificações via WhatsApp

O banco de dados (tabelas `profiles`, `blocked_dates`, colunas de
cancelamento, etc.) já foi desenhado pensando nessas fases futuras, então
elas não vão exigir migrar o schema do zero — só construir telas em cima do
que já existe.

---

## 2. Como funciona o multi-tenant (analogia rápida)

Pense em cada salão como um "apartamento" dentro do mesmo "prédio" (a
aplicação). A tabela `tenants` é a lista de apartamentos. Toda outra tabela
importante (`services`, `appointments`, `payments`, etc.) tem uma coluna
`tenant_id` — é como se cada móvel do prédio tivesse uma etiqueta dizendo a
qual apartamento pertence. As regras de segurança do banco (RLS, explicado
abaixo) garantem que um morador nunca acesse os móveis do apartamento do
vizinho, mesmo se tentar.

Cada salão tem uma URL própria baseada em um "slug" (apelido única):

```
https://seu-dominio.com/studio-nude          → página pública do salão
https://seu-dominio.com/studio-nude/agendar  → fluxo de agendamento
```

Um salão de demonstração (`studio-nude`) já vem cadastrado via
`supabase/seed.sql`, com os serviços descritos no briefing.

---

## 3. Stack utilizada

| Camada         | Tecnologia                                      |
| -------------- | ------------------------------------------------ |
| Frontend       | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Componentes UI | Componentes estilo shadcn/ui (Radix + CVA)        |
| Formulários    | React Hook Form + Zod                             |
| Backend        | Route Handlers do Next.js (API) + Server Actions  |
| Banco          | Supabase (PostgreSQL) com Row Level Security      |
| Autenticação   | Supabase Auth (usada a partir da Fase 2)          |
| Pagamento      | Mercado Pago (PIX)                                |
| Deploy         | Vercel                                            |

---

## 4. Estrutura de pastas

```
supabase/
  migrations/0001_init.sql   → schema completo (tabelas, enums, RLS, índices)
  seed.sql                   → salão de demonstração + serviços + horários

src/
  app/
    page.tsx                          → landing da plataforma (não de um salão)
    [slug]/page.tsx                   → página pública de um salão
    [slug]/agendar/page.tsx           → wizard de agendamento (passos 1-5)
    [slug]/agendamento/[id]/page.tsx  → tela de PIX / status (passo 6)
    api/appointments/route.ts               → cria agendamento + cobrança PIX
    api/appointments/[id]/status/route.ts   → consulta status (polling)
    api/tenants/[slug]/slots/route.ts       → horários disponíveis de um dia
    api/webhooks/mercadopago/route.ts       → recebe confirmação de pagamento
    api/cron/expire-holds/route.ts          → expira reservas vencidas

  components/
    ui/        → componentes de interface reutilizáveis (botão, input, card…)
    booking/   → componentes específicos do fluxo de agendamento

  lib/
    supabase/  → 3 clientes Supabase, cada um com um propósito (ver seção 5)
    booking/   → cálculo de disponibilidade e de preço do sinal
    validations/ → schemas Zod
    mercadopago.ts → integração com a API do Mercado Pago
    rate-limit.ts  → limitador simples de requisições

  types/       → tipos TypeScript espelhando o schema do banco
```

---

## 5. Decisões de segurança importantes (leia antes de mexer)

Este projeto usa **três clientes Supabase diferentes**, cada um com um nível
de acesso — isso é a parte mais importante de entender:

1. **`lib/supabase/client.ts`** — roda no navegador da cliente. Usa a chave
   pública (`anon key`). Só enxerga o que o RLS liberar publicamente.
2. **`lib/supabase/server.ts`** — roda no servidor, mas "vestindo a roupa"
   do usuário logado (staff/admin). Respeita o RLS igual ao cliente do
   navegador.
3. **`lib/supabase/admin.ts`** — roda **só** no servidor, com a
   `service_role key`, que **ignora completamente o RLS**. Por isso o
   arquivo importa `"server-only"`: se algum componente de tela tentar
   importar esse arquivo por engano, o build quebra antes de vazar a chave
   para o navegador.

Por que isso importa: tabelas como `appointments` e `payments` **não têm
nenhuma política pública no RLS** (veja `supabase/migrations/0001_init.sql`).
Uma cliente não confirmada não consegue, nem que tente pela API do
Supabase diretamente, ler ou criar linhas nessas tabelas. Toda criação de
agendamento e toda consulta de status passam por Route Handlers que usam o
cliente admin, e que decidem exatamente quais campos devolver. É o mesmo
padrão que checkouts como o do Stripe usam: o UUID do agendamento funciona
como uma "senha de acesso" àquele agendamento específico.

Outras decisões deliberadas, para você não achar que é "esquecimento":

- **"Consultar agendamento"** funciona pelo link recebido após o pagamento
  (que a Fase 3 vai enviar por WhatsApp), não por uma busca livre por
  telefone — permitir busca por telefone sem login deixaria qualquer pessoa
  ver o agendamento de qualquer cliente só digitando um número.
- **Fuso horário fixo em `America/Sao_Paulo`** (`lib/booking/availability.ts`).
  Como é um produto para salões brasileiros, isso evita complexidade
  desnecessária. Se um dia precisar suportar outros países, aí sim vale
  adicionar uma coluna `timezone` em `tenants`.
- **Rate limit em memória** (`lib/rate-limit.ts`) é suficiente para começar,
  mas reseta se a função serverless reiniciar e não é compartilhado entre
  instâncias. Antes de crescer de verdade, troque pelo Upstash Ratelimit
  (Redis), que é a integração recomendada da própria Vercel.

---

## 6. Passo a passo: criando o projeto no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e clique em
   "New Project".
2. Anote a **senha do banco** que você definir — vai precisar dela se usar
   a CLI do Supabase.
3. Depois que o projeto for criado, vá em **Project Settings → API** e
   copie:
   - `Project URL` → variável `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → variável `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → variável `SUPABASE_SERVICE_ROLE_KEY` (⚠️ nunca
     coloque essa chave em código que roda no navegador)
4. Rode as migrations. Duas formas:
   - **Mais simples (painel):** abra **SQL Editor** no painel do Supabase,
     cole o conteúdo de `supabase/migrations/0001_init.sql` e clique em
     "Run". Repita o mesmo processo com `supabase/seed.sql` para ter o
     salão de demonstração.
   - **Com a CLI** (recomendado se for continuar desenvolvendo):
     ```bash
     npm install -g supabase
     supabase login
     supabase link --project-ref <seu-project-ref>
     supabase db push
     psql "<connection-string-do-projeto>" -f supabase/seed.sql
     ```

---

## 7. Passo a passo: Mercado Pago (PIX)

1. Crie uma conta em [mercadopago.com.br](https://www.mercadopago.com.br)
   e acesse o [painel de desenvolvedores](https://www.mercadopago.com.br/developers/panel).
2. Crie uma aplicação. Em **Credenciais de teste**, copie o
   **Access Token de teste** → variável `MERCADOPAGO_ACCESS_TOKEN`
   (comece sempre em modo teste antes de ir para produção).
3. Configure o **Webhook**: em **Webhooks → Configurar notificações**,
   cadastre a URL `https://SEU-DOMINIO/api/webhooks/mercadopago` e marque
   o evento **Pagamentos**. O painel vai gerar uma **Assinatura secreta** →
   variável `MERCADOPAGO_WEBHOOK_SECRET`.
4. **Testando localmente**: o Mercado Pago precisa alcançar sua máquina
   pela internet para enviar o webhook. Use um túnel, por exemplo:
   ```bash
   npx ngrok http 3000
   ```
   e cadastre a URL gerada pelo ngrok como webhook (passo 3) e como
   `NEXT_PUBLIC_SITE_URL` no seu `.env.local`.

---

## 8. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha os valores dos passos
6 e 7:

```bash
cp .env.example .env.local
```

---

## 9. Rodando localmente

```bash
npm install
npm run dev
```

Acesse:

- `http://localhost:3000` — landing da plataforma
- `http://localhost:3000/studio-nude` — página pública do salão de demonstração
- `http://localhost:3000/studio-nude/agendar` — fluxo de agendamento

---

## 10. Deploy na Vercel

1. Importe o repositório na Vercel.
2. Em **Settings → Environment Variables**, cadastre todas as variáveis do
   `.env.example` (use as credenciais de produção do Supabase e do
   Mercado Pago quando estiver pronto para ir ao ar).
3. O arquivo `vercel.json` já configura um **Cron Job** que chama
   `/api/cron/expire-holds` a cada 5 minutos para liberar horários cuja
   reserva de 15 minutos expirou.
   > Nota: no plano gratuito (Hobby) da Vercel, cron jobs muito frequentes
   > podem ter restrições. Isso não quebra a regra de negócio: a função
   > `getAvailableSlots` já ignora reservas expiradas na hora de calcular
   > horários livres, então o cron serve para "limpar" o status no banco,
   > não é a única linha de defesa.
4. Depois do primeiro deploy, atualize `NEXT_PUBLIC_SITE_URL` com o domínio
   final e reconfigure a URL do webhook no painel do Mercado Pago.

---

## 11. Roadmap combinado

- **Fase 2 — Dashboard administrativo:** login (Supabase Auth + tabela
  `profiles`), gestão de agenda (dia/semana/mês com as cores definidas no
  briefing), gestão de serviços, bloqueio de horários, cancelamento,
  listagem de clientes e pagamentos.
- **Fase 3 — Relatórios e notificações:** métricas mensais/semanais,
  integração de envio de WhatsApp (confirmação de pagamento + lembrete
  24h antes).

Peça para eu continuar com a Fase 2 quando quiser seguir em frente.
