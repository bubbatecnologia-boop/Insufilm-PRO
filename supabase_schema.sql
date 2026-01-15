-- Create tables for Insufilm Pro

-- 1. Tabela de Produtos
create table if not exists produtos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome text not null,
  categoria text,
  quantidade_atual integer default 0,
  preco_venda numeric default 0,
  preco_custo numeric default 0,
  alerta_minimo integer default 5,
  unidade text default 'UN',
  foto text
);

-- 2. Tabela de Vendas
create table if not exists vendas (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  produto_id uuid references produtos(id),
  produto_nome text,
  quantidade integer,
  valor_total numeric,
  lucro numeric,
  forma_pagamento text,
  data text -- Armazenando como string ISO por enquanto para compatibilidade
);

-- 3. Tabela de Contas (Templates e Lançamentos unificados ou separados? Vamos manter a estrutura do app)
-- Templates
create table if not exists conta_templates (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome text not null,
  dia_vencimento integer,
  categoria text,
  tipo text, -- 'Fixa' or 'Variavel'
  valor_padrao numeric
);

-- Contas (Lançamentos)
create table if not exists contas (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  template_id uuid references conta_templates(id),
  nome text not null,
  valor numeric,
  data_vencimento text, -- YYYY-MM-DD
  pago boolean default false,
  necessita_valor boolean default false,
  categoria text,
  data_pagamento text,
  tipo text
);

-- 4. Tabela de Agendamentos
create table if not exists agendamentos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  data text, -- YYYY-MM-DD
  horario text, -- HH:00
  cliente text,
  veiculo text,
  servico text,
  contato text,
  valor numeric,
  produto_id uuid references produtos(id),
  pago boolean default false,
  venda_id uuid references vendas(id),
  status text default 'Pendente'
);

-- Enable RLS (Optional for now, but good practice)
alter table produtos enable row level security;
alter table vendas enable row level security;
alter table conta_templates enable row level security;
alter table contas enable row level security;
alter table agendamentos enable row level security;

-- Create policies (Opening access for public/anon for this demo)
create policy "Public Access Produtos" on produtos for all using (true);
create policy "Public Access Vendas" on vendas for all using (true);
create policy "Public Access Templates" on conta_templates for all using (true);
create policy "Public Access Contas" on contas for all using (true);
create policy "Public Access Agendamentos" on agendamentos for all using (true);
