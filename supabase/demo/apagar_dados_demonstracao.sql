-- CRM Eltech — apaga os DADOS DE DEMONSTRAÇÃO (não mexe em regras de comissão nem em segmentos).
begin;
delete from public.propostas where codigo like '9%' and cliente_id in (select id from public.clientes where codigo_legado >= 90000);
delete from public.clientes where codigo_legado >= 90000;
delete from public.usuarios where codigo_legado >= 9000;
delete from public.produtos;
commit;
