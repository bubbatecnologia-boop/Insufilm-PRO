-- Arquitetura de Banco de Dados SaaS Multi-tenant para Insufilm Pro
-- Autor: AntiGravity (Senior DB Architect)
-- Objetivo: Garantir isolamento, performance e escalabilidade.

-- 1. Extensões e Configurações Iniciais
create extension if not exists "uuid-ossp";

-- ENUMs para padronização e integridade de dados
create type product_type as enum ('material_metro', 'unidade');
create type appointment_status as enum ('pending', 'confirmed', 'completed', 'canceled');
create type transaction_type as enum ('income', 'expense');
create type transaction_status as enum ('paid', 'pending');
create type user_role as enum ('admin', 'member');

-- 2. Tabela de Organizações (Tenants)
-- Centraliza as empresas que usarão o sistema.
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique, -- Para URLs amigáveis (ex: app.com/loja-do-pedro)
  created_at timestamptz default now()
);

-- 3. Tabela de Perfis de Usuário
-- Estende a tabela auth.users do Supabase, vinculando o usuário a uma organização.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  full_name text,
  role user_role default 'admin',
  created_at timestamptz default now()
);

-- 4. Tabela de Produtos (Estoque)
-- O campo type diferencia películas (metros) de acessórios (unidades).
create table products (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  type product_type not null default 'unidade',
  stock_quantity numeric default 0, -- Numeric para aceitar frações (ex: 1.5 metros)
  min_stock_alert numeric default 5,
  cost_price numeric default 0,
  sale_price numeric default 0,
  created_at timestamptz default now()
);

-- 5. Tabela de Clientes (CRM)
create table clients (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text,
  car_model text,
  notes text,
  created_at timestamptz default now()
);

-- 6. Tabela de Agendamentos (Agenda)
create table appointments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status appointment_status default 'pending',
  price_total numeric default 0,
  created_at timestamptz default now()
);

-- 7. Tabela de Transações (Financeiro)
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  description text not null,
  amount numeric not null,
  type transaction_type not null,
  status transaction_status default 'pending',
  due_date date,
  payment_method text,
  created_at timestamptz default now()
);

-- 8. Performance Tuning (Índices)
-- Índices em chaves estrangeiras e colunas de filtro frequente para speed.
create index idx_profiles_org on profiles(organization_id);
create index idx_products_org on products(organization_id);
create index idx_clients_org on clients(organization_id);
create index idx_appointments_org on appointments(organization_id);
create index idx_appointments_client on appointments(client_id);
create index idx_transactions_org on transactions(organization_id);
create index idx_appointments_dates on appointments(start_time, end_time);

-- 9. Segurança (Row Level Security - RLS)
-- Habilita segurança em nível de linha para todas as tabelas.
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table products enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;
alter table transactions enable row level security;

-- Função Helper: Recupera o ID da organização do usuário logado
-- Essencial para simplificar as políticas de segurança.
create or replace function get_user_org_id()
returns uuid
language sql
security definer -- Executa com permissões de superusuário para ler profiles
as $$
  select organization_id from profiles
  where id = auth.uid()
  limit 1;
$$;

-- Políticas de Acesso (Policies)
-- Garante que o usuário só veja dados da sua própria organização.

-- Organizations
create policy "Users can view own organization" on organizations
  for select using (id = get_user_org_id());

-- Profiles
create policy "Users can view org profiles" on profiles
  for select using (organization_id = get_user_org_id());

-- Products
create policy "Users can manage org products" on products
  for all using (organization_id = get_user_org_id());

-- Clients
create policy "Users can manage org clients" on clients
  for all using (organization_id = get_user_org_id());

-- Appointments
create policy "Users can manage org appointments" on appointments
  for all using (organization_id = get_user_org_id());

-- Transactions
create policy "Users can manage org transactions" on transactions
  for all using (organization_id = get_user_org_id());


-- 10. Automação de Onboarding (User Trigger)
-- Cria automaticamente uma Organização e um Perfil quando um novo usuário se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  -- 1. Cria uma nova Organização para o usuário
  insert into organizations (name, slug)
  values (
    'Minha Loja',
    -- Gera um slug único baseado no email (ex: joao-123)
    lower(regexp_replace(new.email, '@.*', '')) || '-' || floor(random() * 1000)::text
  )
  returning id into new_org_id;

  -- 2. Cria o Perfil vinculado a essa organização
  insert into profiles (id, organization_id, full_name, role)
  values (
    new.id,
    new_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Admin'),
    'admin'
  );

  return new;
end;
$$;

-- Aciona a função acima sempre que um usuário é inserido em auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
