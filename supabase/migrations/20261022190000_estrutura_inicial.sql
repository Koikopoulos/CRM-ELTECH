-- =====================================================================
-- CRM Eltech Química — Etapa 2: estrutura do banco e permissões por perfil
-- =====================================================================
-- Perfis: diretoria, admin, coordenacao, conferente (operacional conferente),
--         financeiro, operacional, producao (fase futura, sem acesso por ora).
-- As regras de acesso ficam no banco (Row Level Security): mesmo que alguém
-- contorne a tela, o banco só entrega o que o perfil permite.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.perfil_acesso as enum (
  'diretoria', 'admin', 'coordenacao', 'conferente', 'financeiro', 'operacional', 'producao'
);

create type public.tipo_vendedor as enum ('representante', 'vendedor_interno', 'retaguarda');

create type public.estagio_proposta as enum (
  'criacao', 'checagem', 'validado', 'enviado',
  'amostra_enviada', 'amostra_aprovada', 'rejeitado_cliente', 'reprovado'
);

create type public.tipo_tabela as enum ('rad', 'aditivo');

create type public.parecer_financeiro as enum ('recomendado', 'nao_recomendado');

create type public.tipo_pessoa as enum ('juridica', 'fisica');

-- ---------------------------------------------------------------------
-- Usuários do CRM
-- O vínculo com o login (auth.users) é feito pelo e-mail no primeiro acesso.
-- ---------------------------------------------------------------------
create table public.usuarios (
  id              uuid primary key default gen_random_uuid(),
  auth_id         uuid unique references auth.users (id) on delete set null,
  codigo_legado   integer unique,
  nome            text not null,
  email           text,
  telefone        text,
  perfil          public.perfil_acesso not null default 'operacional',
  tipo_vendedor   public.tipo_vendedor,
  ativo           boolean not null default true,
  ultimo_login_legado timestamptz,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);
create unique index usuarios_email_unico on public.usuarios (lower(email)) where email is not null and email <> '';

-- ---------------------------------------------------------------------
-- Funções de apoio às permissões
-- ---------------------------------------------------------------------
create function public.usuario_atual_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select u.id from public.usuarios u where u.auth_id = auth.uid() and u.ativo
$$;

create function public.perfil_atual()
returns public.perfil_acesso
language sql stable security definer set search_path = ''
as $$
  select u.perfil from public.usuarios u where u.auth_id = auth.uid() and u.ativo
$$;

create function public.perfil_em(variadic perfis public.perfil_acesso[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(public.perfil_atual() = any (perfis), false)
$$;

-- Liga o login recém-criado ao cadastro de usuário com o mesmo e-mail.
create function public.vincular_login_ao_usuario()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.usuarios
     set auth_id = new.id, atualizado_em = now()
   where lower(email) = lower(new.email)
     and auth_id is null;
  return new;
end;
$$;

create trigger ao_criar_login
  after insert on auth.users
  for each row execute function public.vincular_login_ao_usuario();

-- Atualiza "atualizado_em" automaticamente.
create function public.marcar_atualizacao()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger usuarios_atualizacao before update on public.usuarios
  for each row execute function public.marcar_atualizacao();

-- ---------------------------------------------------------------------
-- Segmentos de clientes
-- ---------------------------------------------------------------------
create table public.segmentos (
  id    bigint generated always as identity primary key,
  nome  text not null unique,
  grupo text
);

-- ---------------------------------------------------------------------
-- Clientes (carteira)
-- ---------------------------------------------------------------------
create table public.clientes (
  id                 bigint generated always as identity primary key,
  codigo_legado      integer unique,
  tipo_pessoa        public.tipo_pessoa,
  nome_fantasia      text,
  razao_social       text not null,
  codigo_erp         text,
  cnpj               text,
  cpf                text,
  contato            text,
  segmento_id        bigint references public.segmentos (id) on delete set null,
  segmento_original  text,
  cidade             text,
  uf                 text,
  status             text,
  origem             text,
  representante_id   uuid references public.usuarios (id) on delete set null,
  telefone           text,
  email              text,
  proxima_atividade  date,
  -- Dados de faturamento (editáveis pelo Financeiro)
  inscricao_estadual     text,
  email_faturamento      text,
  endereco_faturamento   text,
  cond_pagamento_padrao  text,
  obs_faturamento        text,
  criado_em          timestamptz not null default now(),
  criado_por         uuid references public.usuarios (id) on delete set null default public.usuario_atual_id(),
  atualizado_em      timestamptz not null default now(),
  atualizado_por     uuid references public.usuarios (id) on delete set null
);
create index clientes_representante on public.clientes (representante_id);
create index clientes_cnpj on public.clientes (cnpj);
create index clientes_razao on public.clientes (lower(razao_social));

-- Financeiro só altera os dados de faturamento.
create function public.clientes_antes_de_salvar()
returns trigger
language plpgsql set search_path = ''
as $$
declare
  campos_faturamento text[] := array[
    'inscricao_estadual', 'email_faturamento', 'endereco_faturamento',
    'cond_pagamento_padrao', 'obs_faturamento', 'atualizado_em', 'atualizado_por'
  ];
begin
  if tg_op = 'UPDATE' and public.perfil_atual() = 'financeiro'
     and (to_jsonb(new) - campos_faturamento) is distinct from (to_jsonb(old) - campos_faturamento) then
    raise exception 'O perfil Financeiro só pode alterar os dados de faturamento do cliente.'
      using errcode = '42501';
  end if;
  new.atualizado_em := now();
  if auth.uid() is not null then
    new.atualizado_por := public.usuario_atual_id();
  end if;
  return new;
end;
$$;

create trigger clientes_salvar before update on public.clientes
  for each row execute function public.clientes_antes_de_salvar();

-- ---------------------------------------------------------------------
-- Propostas
-- ---------------------------------------------------------------------
create table public.propostas (
  id                  bigint generated always as identity primary key,
  codigo              text not null unique,
  cliente_id          bigint references public.clientes (id) on delete set null,
  razao_social_original text,
  representante_id    uuid references public.usuarios (id) on delete set null,
  criado_por          uuid references public.usuarios (id) on delete set null default public.usuario_atual_id(),
  estagio             public.estagio_proposta not null default 'criacao',
  estagio_desde       timestamptz not null default now(),
  valor               numeric(14, 2) not null default 0,
  possibilidade       numeric(5, 2) check (possibilidade between 0 and 100),
  ganho_estimado      numeric(14, 2),
  data_fechamento     date,
  cond_pagamento      text,
  observacao          text,
  -- Comissão
  tipo_tabela         public.tipo_tabela,
  dmp                 numeric(6, 4) check (dmp between 0 and 1),
  com_cce             boolean not null default false,
  -- Validação (nunca pelo próprio criador)
  validado_por        uuid references public.usuarios (id) on delete set null,
  validado_em         timestamptz,
  -- Parecer do Financeiro
  parecer_financeiro      public.parecer_financeiro,
  parecer_financeiro_obs  text,
  parecer_financeiro_por  uuid references public.usuarios (id) on delete set null,
  parecer_financeiro_em   timestamptz,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),
  atualizado_por      uuid references public.usuarios (id) on delete set null,
  atualizado_por_original text
);
create index propostas_representante on public.propostas (representante_id);
create index propostas_criado_por on public.propostas (criado_por);
create index propostas_estagio on public.propostas (estagio, estagio_desde);
create index propostas_cliente on public.propostas (cliente_id);

create table public.historico_estagios (
  id           bigint generated always as identity primary key,
  proposta_id  bigint not null references public.propostas (id) on delete cascade,
  de           public.estagio_proposta,
  para         public.estagio_proposta not null,
  alterado_por uuid references public.usuarios (id) on delete set null,
  alterado_em  timestamptz not null default now()
);
create index historico_proposta on public.historico_estagios (proposta_id, alterado_em);

create function public.propostas_antes_de_salvar()
returns trigger
language plpgsql set search_path = ''
as $$
declare
  eu     uuid := public.usuario_atual_id();
  perfil public.perfil_acesso := public.perfil_atual();
  campos_parecer text[] := array[
    'parecer_financeiro', 'parecer_financeiro_obs', 'parecer_financeiro_por',
    'parecer_financeiro_em', 'atualizado_em', 'atualizado_por'
  ];
begin
  -- Chamadas sem usuário logado (importação feita pelo administrador do banco) não passam pelas regras.
  if auth.uid() is null then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Autoria, validação e carimbos do parecer não podem ser editados à mão.
    if new.criado_por is distinct from old.criado_por then
      raise exception 'O autor da proposta não pode ser alterado.' using errcode = '42501';
    end if;
    new.validado_por := old.validado_por;
    new.validado_em  := old.validado_em;
    new.parecer_financeiro_por := old.parecer_financeiro_por;
    new.parecer_financeiro_em  := old.parecer_financeiro_em;

    -- Financeiro: só o parecer.
    if perfil = 'financeiro'
       and (to_jsonb(new) - campos_parecer) is distinct from (to_jsonb(old) - campos_parecer) then
      raise exception 'O perfil Financeiro só pode registrar o parecer (recomendado / não recomendado).'
        using errcode = '42501';
    end if;

    -- Parecer financeiro: só Financeiro, Admin ou Diretoria.
    if new.parecer_financeiro is distinct from old.parecer_financeiro then
      if perfil not in ('financeiro', 'admin', 'diretoria') then
        raise exception 'Só o Financeiro, Admin ou Diretoria registram o parecer financeiro.'
          using errcode = '42501';
      end if;
      new.parecer_financeiro_por := eu;
      new.parecer_financeiro_em  := now();
    end if;

    -- Mudança de estágio.
    if new.estagio is distinct from old.estagio then
      new.estagio_desde := now();
      if new.estagio = 'validado' then
        if perfil not in ('conferente', 'coordenacao', 'admin', 'diretoria') then
          raise exception 'Seu perfil não pode validar propostas. A validação é feita a partir do perfil Operacional conferente.'
            using errcode = '42501';
        end if;
        if eu = old.criado_por then
          raise exception 'Quem criou a proposta não pode validá-la. Peça a outro usuário (Operacional conferente ou acima).'
            using errcode = '42501';
        end if;
        new.validado_por := eu;
        new.validado_em  := now();
      end if;
    end if;

    new.atualizado_por := eu;
  end if;

  if tg_op = 'INSERT' then
    -- Ninguém cria proposta já validada.
    if new.estagio = 'validado' then
      raise exception 'Uma proposta nova não pode nascer validada. Ela precisa ser validada por outro usuário.'
        using errcode = '42501';
    end if;
    new.criado_por := coalesce(eu, new.criado_por);
    new.estagio_desde := now();
    new.validado_por := null;
    new.validado_em  := null;
    new.parecer_financeiro := null;
    new.parecer_financeiro_obs := null;
    new.parecer_financeiro_por := null;
    new.parecer_financeiro_em  := null;
  end if;

  new.atualizado_em := now();
  return new;
end;
$$;

create trigger propostas_salvar before insert or update on public.propostas
  for each row execute function public.propostas_antes_de_salvar();

create function public.propostas_registrar_estagio()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.estagio is distinct from old.estagio then
    insert into public.historico_estagios (proposta_id, de, para, alterado_por, alterado_em)
    values (
      new.id,
      case when tg_op = 'UPDATE' then old.estagio end,
      new.estagio,
      public.usuario_atual_id(),
      case when auth.uid() is null then new.estagio_desde else now() end
    );
  end if;
  return null;
end;
$$;

create trigger propostas_historico after insert or update on public.propostas
  for each row execute function public.propostas_registrar_estagio();

-- ---------------------------------------------------------------------
-- Produtos / Tabela de preços
-- ---------------------------------------------------------------------
create table public.produtos (
  id             bigint generated always as identity primary key,
  codigo_totvs   text,
  nome           text not null,
  linha          text,          -- ex.: ADITIVOS PARA CONCRETO
  grupo          text,          -- ex.: PLASTIFICANTE
  ncm            text,
  densidade      text,
  consumo        text,
  embalagem      text,
  unidade        text,
  preco          numeric(14, 2),
  ipi            numeric(6, 2),
  st             boolean,
  mi_objetivo    numeric(10, 4),
  mi_atual       numeric(10, 4),
  custo          numeric(14, 4),
  preco_icms_7   numeric(14, 4),
  preco_icms_12  numeric(14, 4),
  preco_icms_18  numeric(14, 4),
  tipo_tabela    public.tipo_tabela,
  ativo          boolean not null default true,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
create index produtos_codigo on public.produtos (codigo_totvs);
create trigger produtos_atualizacao before update on public.produtos
  for each row execute function public.marcar_atualizacao();

-- ---------------------------------------------------------------------
-- Regras de comissão (DMP = desconto médio ponderado)
-- Cada linha vale ATÉ "desconto_max" (inclusive), a partir da faixa anterior.
-- Ex.: DMP 0% → faixa 0; DMP acima de 0% até 10% → faixa 10%; acima de 10% até 20% → faixa 20%...
-- ---------------------------------------------------------------------
create table public.regras_comissao (
  id             bigint generated always as identity primary key,
  com_cce        boolean not null,
  tipo_tabela    public.tipo_tabela not null,
  tipo_vendedor  public.tipo_vendedor not null,
  desconto_max   numeric(5, 4) not null check (desconto_max between 0 and 1),
  percentual     numeric(6, 4) not null check (percentual between 0 and 1),
  unique (com_cce, tipo_tabela, tipo_vendedor, desconto_max)
);

create table public.faixas_cce (
  id            bigint generated always as identity primary key,
  desconto_max  numeric(5, 4) not null unique check (desconto_max between 0 and 1),
  percentual    numeric(6, 4) not null check (percentual between 0 and 1)
);

create table public.parametros_comerciais (
  chave      text primary key,
  valor      numeric(10, 4) not null,
  descricao  text not null
);

-- Calcula a comissão de uma proposta a partir do DMP.
create function public.calcular_comissao(
  p_dmp numeric, p_tipo_tabela public.tipo_tabela, p_tipo_vendedor public.tipo_vendedor, p_com_cce boolean
)
returns table (percentual numeric, percentual_cce numeric, exige_autorizacao_diretoria boolean)
language plpgsql stable set search_path = ''
as $$
declare
  limite numeric;
begin
  select pc.valor into limite
    from public.parametros_comerciais pc
   where pc.chave = case p_tipo_tabela when 'rad' then 'desconto_max_rad' else 'desconto_max_aditivo' end;

  if limite is not null and p_dmp > limite then
    return query
      select pc.valor, 0::numeric, true
        from public.parametros_comerciais pc where pc.chave = 'comissao_acima_do_maximo';
    return;
  end if;

  return query
    select
      (select r.percentual from public.regras_comissao r
        where r.com_cce = p_com_cce and r.tipo_tabela = p_tipo_tabela and r.tipo_vendedor = p_tipo_vendedor
          and r.desconto_max >= p_dmp
        order by r.desconto_max asc limit 1),
      case when p_com_cce then
        (select f.percentual from public.faixas_cce f where f.desconto_max >= p_dmp
          order by f.desconto_max asc limit 1)
      else 0::numeric end,
      false;
end;
$$;

-- ---------------------------------------------------------------------
-- Permissões (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.usuarios              enable row level security;
alter table public.segmentos             enable row level security;
alter table public.clientes              enable row level security;
alter table public.propostas             enable row level security;
alter table public.historico_estagios    enable row level security;
alter table public.produtos              enable row level security;
alter table public.regras_comissao       enable row level security;
alter table public.faixas_cce            enable row level security;
alter table public.parametros_comerciais enable row level security;

-- Visitantes sem login não acessam nada.
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.historico_estagios from authenticated;

-- Qualquer usuário ativo do CRM (exceto Produção, ainda sem acesso).
create function public.usuario_comercial()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.perfil_em('diretoria', 'admin', 'coordenacao', 'conferente', 'financeiro', 'operacional')
$$;

-- Usuários
create policy "usuarios: ver" on public.usuarios for select to authenticated
  using (public.usuario_comercial() or auth_id = auth.uid());
create policy "usuarios: incluir" on public.usuarios for insert to authenticated
  with check (public.perfil_em('diretoria', 'admin'));
create policy "usuarios: editar" on public.usuarios for update to authenticated
  using (public.perfil_em('diretoria', 'admin')) with check (public.perfil_em('diretoria', 'admin'));
create policy "usuarios: excluir" on public.usuarios for delete to authenticated
  using (public.perfil_em('diretoria', 'admin'));

-- Segmentos
create policy "segmentos: ver" on public.segmentos for select to authenticated
  using (public.usuario_comercial());
create policy "segmentos: incluir" on public.segmentos for insert to authenticated
  with check (public.perfil_em('diretoria', 'admin'));
create policy "segmentos: editar" on public.segmentos for update to authenticated
  using (public.perfil_em('diretoria', 'admin')) with check (public.perfil_em('diretoria', 'admin'));
create policy "segmentos: excluir" on public.segmentos for delete to authenticated
  using (public.perfil_em('diretoria', 'admin'));

-- Clientes
create policy "clientes: ver" on public.clientes for select to authenticated
  using (
    public.perfil_em('diretoria', 'admin', 'coordenacao', 'conferente', 'financeiro')
    or (public.perfil_em('operacional') and representante_id = public.usuario_atual_id())
  );
create policy "clientes: incluir" on public.clientes for insert to authenticated
  with check (
    public.perfil_em('diretoria', 'admin')
    or (public.perfil_em('operacional') and representante_id = public.usuario_atual_id())
  );
create policy "clientes: editar" on public.clientes for update to authenticated
  using (
    public.perfil_em('diretoria', 'admin', 'financeiro')
    or (public.perfil_em('operacional') and representante_id = public.usuario_atual_id())
  )
  with check (
    public.perfil_em('diretoria', 'admin', 'financeiro')
    or (public.perfil_em('operacional') and representante_id = public.usuario_atual_id())
  );
create policy "clientes: excluir" on public.clientes for delete to authenticated
  using (public.perfil_em('diretoria', 'admin'));

-- Propostas
create policy "propostas: ver" on public.propostas for select to authenticated
  using (
    public.perfil_em('diretoria', 'admin', 'coordenacao', 'financeiro')
    or (public.perfil_em('conferente')
        and (estagio in ('criacao', 'checagem')
             or criado_por = public.usuario_atual_id()
             or validado_por = public.usuario_atual_id()))
    or (public.perfil_em('operacional')
        and (representante_id = public.usuario_atual_id() or criado_por = public.usuario_atual_id()))
  );
create policy "propostas: incluir" on public.propostas for insert to authenticated
  with check (
    public.perfil_em('diretoria', 'admin', 'coordenacao', 'conferente')
    or (public.perfil_em('operacional') and representante_id = public.usuario_atual_id())
  );
create policy "propostas: editar" on public.propostas for update to authenticated
  using (
    public.perfil_em('diretoria', 'admin', 'coordenacao', 'financeiro')
    or (public.perfil_em('conferente') and estagio in ('criacao', 'checagem'))
    or (public.perfil_em('operacional')
        and (representante_id = public.usuario_atual_id() or criado_por = public.usuario_atual_id()))
  )
  with check (
    public.perfil_em('diretoria', 'admin', 'coordenacao', 'financeiro', 'conferente')
    or (public.perfil_em('operacional') and representante_id = public.usuario_atual_id())
  );
create policy "propostas: excluir" on public.propostas for delete to authenticated
  using (public.perfil_em('diretoria', 'admin'));

-- Histórico de estágios: visível para quem vê a proposta; gravado só pelo sistema.
create policy "historico: ver" on public.historico_estagios for select to authenticated
  using (exists (select 1 from public.propostas p where p.id = proposta_id));

-- Produtos / tabela de preços
create policy "produtos: ver" on public.produtos for select to authenticated
  using (public.usuario_comercial());
create policy "produtos: incluir" on public.produtos for insert to authenticated
  with check (public.perfil_em('diretoria', 'admin'));
create policy "produtos: editar" on public.produtos for update to authenticated
  using (public.perfil_em('diretoria', 'admin')) with check (public.perfil_em('diretoria', 'admin'));
create policy "produtos: excluir" on public.produtos for delete to authenticated
  using (public.perfil_em('diretoria', 'admin'));

-- Regras de comissão, faixas CCE e parâmetros:
-- todos consultam; Diretoria e Admin alteram; só a Diretoria exclui parâmetros.
create policy "regras: ver" on public.regras_comissao for select to authenticated
  using (public.usuario_comercial());
create policy "regras: incluir" on public.regras_comissao for insert to authenticated
  with check (public.perfil_em('diretoria', 'admin'));
create policy "regras: editar" on public.regras_comissao for update to authenticated
  using (public.perfil_em('diretoria', 'admin')) with check (public.perfil_em('diretoria', 'admin'));
create policy "regras: excluir" on public.regras_comissao for delete to authenticated
  using (public.perfil_em('diretoria'));

create policy "cce: ver" on public.faixas_cce for select to authenticated
  using (public.usuario_comercial());
create policy "cce: incluir" on public.faixas_cce for insert to authenticated
  with check (public.perfil_em('diretoria', 'admin'));
create policy "cce: editar" on public.faixas_cce for update to authenticated
  using (public.perfil_em('diretoria', 'admin')) with check (public.perfil_em('diretoria', 'admin'));
create policy "cce: excluir" on public.faixas_cce for delete to authenticated
  using (public.perfil_em('diretoria'));

create policy "parametros: ver" on public.parametros_comerciais for select to authenticated
  using (public.usuario_comercial());
create policy "parametros: incluir" on public.parametros_comerciais for insert to authenticated
  with check (public.perfil_em('diretoria', 'admin'));
create policy "parametros: editar" on public.parametros_comerciais for update to authenticated
  using (public.perfil_em('diretoria', 'admin')) with check (public.perfil_em('diretoria', 'admin'));
create policy "parametros: excluir" on public.parametros_comerciais for delete to authenticated
  using (public.perfil_em('diretoria'));

-- ---------------------------------------------------------------------
-- Dados de referência (planilha DADOS_GERAIS_CRM, aba REGRA COMISSIONAMENTO)
-- ---------------------------------------------------------------------
insert into public.parametros_comerciais (chave, valor, descricao) values
  ('desconto_max_rad', 0.55, 'Desconto máximo na tabela RAD sem autorização da Diretoria'),
  ('desconto_max_aditivo', 0.65, 'Desconto máximo na tabela Aditivos sem autorização da Diretoria'),
  ('comissao_acima_do_maximo', 0.01, 'Comissão quando o desconto passa do máximo (com autorização da Diretoria)');

-- Sem CCE
insert into public.regras_comissao (com_cce, tipo_tabela, tipo_vendedor, desconto_max, percentual)
select false, t.tabela::public.tipo_tabela, t.vendedor::public.tipo_vendedor, v.d, v.p
from (values
  ('rad', 'representante'), ('aditivo', 'representante'),
  ('rad', 'vendedor_interno'), ('aditivo', 'vendedor_interno')
) as t (tabela, vendedor)
join lateral (
  select * from (values
    -- desconto, RAD repr., ADIT repr., RAD interno, ADIT interno
    (0.00, 0.100, 0.100, 0.040, 0.040),
    (0.10, 0.095, 0.095, 0.038, 0.038),
    (0.20, 0.090, 0.090, 0.036, 0.036),
    (0.30, 0.085, 0.085, 0.034, 0.034),
    (0.40, 0.080, 0.080, 0.032, 0.032),
    (0.50, 0.060, 0.060, 0.024, 0.024),
    (0.55, 0.050, 0.020, 0.020, 0.020),
    (0.60, null,  0.015, null,  0.015),
    (0.65, null,  0.010, null,  0.010)
  ) as f (d, rad_r, adi_r, rad_i, adi_i)
) as linhas on true
cross join lateral (
  select linhas.d as d,
         case t.tabela || '/' || t.vendedor
           when 'rad/representante'        then linhas.rad_r
           when 'aditivo/representante'    then linhas.adi_r
           when 'rad/vendedor_interno'     then linhas.rad_i
           when 'aditivo/vendedor_interno' then linhas.adi_i
         end as p
) as v
where v.p is not null;

-- Com CCE (comissão complementar Eltech)
insert into public.regras_comissao (com_cce, tipo_tabela, tipo_vendedor, desconto_max, percentual)
select true, t.tabela::public.tipo_tabela, t.vendedor::public.tipo_vendedor, v.d, v.p
from (values
  ('rad', 'representante'), ('aditivo', 'representante'),
  ('rad', 'vendedor_interno'), ('aditivo', 'vendedor_interno')
) as t (tabela, vendedor)
join lateral (
  select * from (values
    (0.00, 0.090, 0.090, 0.038, 0.038),
    (0.10, 0.085, 0.085, 0.036, 0.036),
    (0.20, 0.080, 0.080, 0.034, 0.034),
    (0.30, 0.060, 0.060, 0.032, 0.032),
    (0.40, 0.040, 0.040, 0.024, 0.024),
    (0.50, 0.030, 0.030, 0.020, 0.020),
    (0.55, 0.030, 0.030, 0.015, 0.015),
    (0.60, null,  0.015, null,  0.010),
    (0.65, null,  0.010, null,  0.010)
  ) as f (d, rad_r, adi_r, rad_i, adi_i)
) as linhas on true
cross join lateral (
  select linhas.d as d,
         case t.tabela || '/' || t.vendedor
           when 'rad/representante'        then linhas.rad_r
           when 'aditivo/representante'    then linhas.adi_r
           when 'rad/vendedor_interno'     then linhas.rad_i
           when 'aditivo/vendedor_interno' then linhas.adi_i
         end as p
) as v
where v.p is not null;

insert into public.faixas_cce (desconto_max, percentual) values
  (0.00, 0.10), (0.10, 0.10), (0.20, 0.10), (0.30, 0.05), (0.40, 0.04),
  (0.50, 0.03), (0.55, 0.02), (0.60, 0.00), (0.65, 0.00);
