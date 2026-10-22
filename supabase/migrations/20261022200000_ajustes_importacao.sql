-- =====================================================================
-- CRM Eltech Química — ajustes para a importação da planilha
-- =====================================================================

-- Na tabela de preços, a coluna ao lado do "% MI objetivo" é a quantidade
-- da embalagem (kg ou L), usada no cálculo do preço do kit.
alter table public.produtos rename column mi_atual to quantidade_embalagem;

comment on column public.produtos.mi_objetivo is '% MI objetivo';
comment on column public.produtos.quantidade_embalagem is 'Quantidade da embalagem (kg ou L)';
comment on column public.produtos.custo is 'Custo atual por kg/L';
comment on column public.produtos.preco_icms_7 is 'Preço por kg/L com ICMS 7%';
comment on column public.produtos.preco_icms_12 is 'Preço por kg/L com ICMS 12%';
comment on column public.produtos.preco_icms_18 is 'Preço por kg/L com ICMS 18%';
comment on column public.produtos.preco is 'Preço de venda do kit/embalagem (preço ICMS 18% × quantidade × IPI)';

-- Guarda o nome original de quem criou a proposta quando ele não está no cadastro de usuários.
alter table public.propostas add column criado_por_original text;
