-- =====================================================================
-- CRM Eltech Química — Etapa 4: resumo do pipeline e proteção de custo/margem
-- =====================================================================

-- Resumo das propostas por estágio. Roda com as permissões de quem consulta:
-- cada perfil só soma as propostas que pode ver.
create function public.resumo_pipeline()
returns table (
  estagio        public.estagio_proposta,
  quantidade     bigint,
  valor          numeric,
  ganho_estimado numeric,
  paradas_7d     bigint
)
language sql stable security invoker set search_path = ''
as $$
  select p.estagio,
         count(*),
         coalesce(sum(p.valor), 0),
         coalesce(sum(p.valor * coalesce(p.possibilidade, 0) / 100), 0),
         count(*) filter (where p.estagio_desde < now() - interval '7 days')
    from public.propostas p
   group by p.estagio
$$;
revoke execute on function public.resumo_pipeline() from public, anon;
grant execute on function public.resumo_pipeline() to authenticated;

-- Custo e % MI dos produtos: somente Diretoria e Admin enxergam.
-- Os demais perfis consultam a tabela de preços sem essas duas colunas.
revoke select on public.produtos from authenticated;
grant select (
  id, codigo_totvs, nome, grupo, ncm, densidade, consumo, embalagem, unidade, preco, ipi, st,
  quantidade_embalagem, preco_icms_7, preco_icms_12, preco_icms_18, tipo_tabela, ativo, criado_em, atualizado_em
) on public.produtos to authenticated;

create function public.produtos_custos()
returns table (id bigint, custo numeric, mi_objetivo numeric)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.custo, p.mi_objetivo
    from public.produtos p
   where public.perfil_em('diretoria', 'admin')
$$;
revoke execute on function public.produtos_custos() from public, anon;
grant execute on function public.produtos_custos() to authenticated;

-- Código automático para propostas novas: NNNNNN_AAMM (mesmo padrão da planilha).
create sequence public.propostas_numero start 20000;
grant usage on sequence public.propostas_numero to authenticated;

create function public.gerar_codigo_proposta()
returns text
language sql volatile set search_path = ''
as $$
  select lpad(nextval('public.propostas_numero')::text, 6, '0') || '_' ||
         to_char(now() at time zone 'America/Sao_Paulo', 'YYMM')
$$;

alter table public.propostas alter column codigo set default public.gerar_codigo_proposta();

-- Perfis: ninguém altera o próprio perfil; só a Diretoria concede ou retira o perfil Diretoria.
create function public.usuarios_proteger_perfil()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.auth_id = auth.uid()
     and (new.perfil is distinct from old.perfil or new.ativo is distinct from old.ativo) then
    raise exception 'Você não pode alterar o seu próprio perfil ou desativar o seu próprio acesso.'
      using errcode = '42501';
  end if;
  if (new.perfil = 'diretoria' or (tg_op = 'UPDATE' and old.perfil = 'diretoria'))
     and not public.perfil_em('diretoria') then
    raise exception 'Somente a Diretoria pode conceder ou alterar o perfil Diretoria.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger usuarios_perfil before insert or update on public.usuarios
  for each row execute function public.usuarios_proteger_perfil();
