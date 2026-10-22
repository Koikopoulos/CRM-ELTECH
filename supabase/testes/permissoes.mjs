import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const migration = readFileSync(process.argv[2], "utf8");
const db = new PGlite();

// --- Emula o ambiente do Supabase (schema auth, auth.uid(), papéis) ---
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated;
`);

await db.exec(migration);
console.log("✓ Migração aplicada sem erros");

let falhas = 0;
const ok = (cond, msg) => {
  if (cond) console.log("  ✓ " + msg);
  else { falhas++; console.log("  ✗ FALHOU: " + msg); }
};

// --- Usuários de teste (um por perfil) ---
const U = {
  dir: ["11111111-0000-0000-0000-000000000001", "diretoria"],
  adm: ["11111111-0000-0000-0000-000000000002", "admin"],
  coord: ["11111111-0000-0000-0000-000000000003", "coordenacao"],
  conf: ["11111111-0000-0000-0000-000000000004", "conferente"],
  fin: ["11111111-0000-0000-0000-000000000005", "financeiro"],
  op1: ["11111111-0000-0000-0000-000000000006", "operacional"],
  op2: ["11111111-0000-0000-0000-000000000007", "operacional"],
  prod: ["11111111-0000-0000-0000-000000000008", "producao"],
};
for (const [k, [, perfil]] of Object.entries(U)) {
  await db.query(
    `insert into public.usuarios (nome, email, perfil, tipo_vendedor) values ($1, $2, $3, 'representante')`,
    [k.toUpperCase(), `${k}@eltech.test`, perfil],
  );
}
// Criar os logins: o gatilho deve ligar cada login ao usuário pelo e-mail.
for (const [k, [authId]] of Object.entries(U)) {
  await db.query(`insert into auth.users (id, email) values ($1, $2)`, [authId, `${k.toUpperCase()}@ELTECH.TEST`]);
}
const ids = Object.fromEntries(
  (await db.query(`select lower(nome) n, id from public.usuarios`)).rows.map((r) => [r.n, r.id]),
);
const vinculados = (await db.query(`select count(*)::int c from public.usuarios where auth_id is not null`)).rows[0].c;

console.log("\nVínculo login ↔ usuário");
ok(vinculados === 8, "os 8 logins foram ligados aos usuários pelo e-mail (ignorando maiúsculas)");

// --- Dados de teste (como importação, sem usuário logado) ---
await db.exec(`
  insert into public.clientes (razao_social, representante_id) values
    ('Cliente do OP1', '${ids.op1}'), ('Cliente do OP2', '${ids.op2}'), ('Cliente da COORD', '${ids.coord}');
  insert into public.propostas (codigo, cliente_id, representante_id, criado_por, estagio, valor) values
    ('P1', 1, '${ids.op1}', '${ids.op1}', 'criacao', 1000),
    ('P2', 2, '${ids.op2}', '${ids.op2}', 'validado', 2000),
    ('P3', 3, '${ids.coord}', '${ids.coord}', 'checagem', 3000);
  insert into public.produtos (nome, preco, tipo_tabela) values ('Produto teste', 100, 'rad');
`);

async function como(user, sql, params = []) {
  return db.transaction(async (tx) => {
    if (user === "anon") {
      await tx.exec(`set local role anon; select set_config('request.jwt.claim.sub', '', true);`);
    } else {
      await tx.exec(`set local role authenticated; select set_config('request.jwt.claim.sub', '${U[user][0]}', true);`);
    }
    return tx.query(sql, params);
  });
}
async function erro(user, sql, params = []) {
  try { await como(user, sql, params); return null; } catch (e) { return e.message; }
}
const contar = async (user, tabela) => (await como(user, `select count(*)::int c from public.${tabela}`)).rows[0].c;

// --- Comissão ---
console.log("\nCálculo de comissão (DMP)");
const com = async (d, t, v, cce) =>
  (await db.query(`select * from public.calcular_comissao($1, $2, $3, $4)`, [d, t, v, cce])).rows[0];
const casos = [
  // [DMP, tabela, vendedor, com CCE, comissão esperada, CCE esperada, exige Diretoria, descrição]
  [0, "rad", "representante", false, 0.1, 0, false, "RAD, representante, DMP 0% → 10%"],
  [0, "rad", "vendedor_interno", false, 0.04, 0, false, "RAD, vendedor interno, DMP 0% → 4%"],
  [0.001, "rad", "representante", false, 0.095, 0, false, "RAD, representante, DMP 0,1% → 9,5% (já muda de faixa)"],
  [0.001, "aditivo", "vendedor_interno", false, 0.038, 0, false, "Aditivos, vendedor interno, DMP 0,1% → 3,8%"],
  [0.1, "rad", "representante", false, 0.095, 0, false, "RAD, representante, DMP exatamente 10% → 9,5%"],
  [0.1001, "rad", "representante", false, 0.09, 0, false, "RAD, representante, DMP 10,01% → 9%"],
  [0.25, "aditivo", "vendedor_interno", false, 0.034, 0, false, "Aditivos, vendedor interno, DMP 25% → 3,4%"],
  [0.55, "rad", "representante", false, 0.05, 0, false, "RAD, representante, DMP 55% (limite) → 5%"],
  [0.58, "rad", "representante", false, 0.01, 0, true, "RAD, DMP 58% (acima do limite) → 1% e exige Diretoria"],
  [0.65, "aditivo", "representante", false, 0.01, 0, false, "Aditivos, representante, DMP 65% (limite) → 1%"],
  [0.7, "aditivo", "representante", false, 0.01, 0, true, "Aditivos, DMP 70% (acima do limite) → 1% e exige Diretoria"],
  [0, "rad", "representante", true, 0.09, 0.1, false, "RAD com CCE, DMP 0% → 9% + CCE 10%"],
  [0.35, "rad", "representante", true, 0.04, 0.04, false, "RAD com CCE, DMP 35% → 4% + CCE 4%"],
  [0.62, "aditivo", "representante", true, 0.01, 0, false, "Aditivos com CCE, DMP 62% → 1% + CCE 0%"],
];
for (const [d, t, v, cce, pEsp, cceEsp, autEsp, desc] of casos) {
  const r = await com(d, t, v, cce);
  ok(+r.percentual === pEsp && +r.percentual_cce === cceEsp && r.exige_autorizacao_diretoria === autEsp,
     `${desc} (obtido ${+r.percentual * 100}% + CCE ${+r.percentual_cce * 100}%)`);
}

// --- Visibilidade ---
console.log("\nO que cada perfil enxerga (clientes / propostas)");
const vis = {};
for (const k of Object.keys(U)) vis[k] = [await contar(k, "clientes"), await contar(k, "propostas")];
ok(vis.dir[0] === 3 && vis.dir[1] === 3, `Diretoria vê tudo: ${vis.dir}`);
ok(vis.adm[0] === 3 && vis.adm[1] === 3, `Admin vê tudo: ${vis.adm}`);
ok(vis.coord[0] === 3 && vis.coord[1] === 3, `Coordenação vê a equipe toda: ${vis.coord}`);
ok(vis.fin[0] === 3 && vis.fin[1] === 3, `Financeiro vê tudo: ${vis.fin}`);
ok(vis.conf[0] === 3 && vis.conf[1] === 2, `Conferente vê a carteira toda e só a fila (criação/checagem): ${vis.conf}`);
ok(vis.op1[0] === 1 && vis.op1[1] === 1, `Operacional 1 vê só a própria carteira: ${vis.op1}`);
ok(vis.op2[0] === 1 && vis.op2[1] === 1, `Operacional 2 vê só a própria carteira: ${vis.op2}`);
ok(vis.prod[0] === 0 && vis.prod[1] === 0 && (await contar("prod", "produtos")) === 0, `Produção ainda sem acesso: ${vis.prod}`);
ok((await erro("anon", "select * from public.clientes")) !== null, "Visitante sem login é bloqueado");

// --- Regra: ninguém valida a própria proposta ---
console.log("\nValidação de propostas");
let r;
let e = await erro("coord", `update public.propostas set estagio = 'validado' where codigo = 'P3'`);
ok(e?.includes("não pode validá-la"), "Coordenação NÃO valida a própria proposta → " + e);
e = await erro("op1", `update public.propostas set estagio = 'validado' where codigo = 'P1'`);
ok(e?.includes("não pode validar"), "Operacional NÃO valida propostas → " + e);
e = await erro("coord", `update public.propostas set criado_por = '${ids.op1}' where codigo = 'P3'`);
ok(e?.includes("não pode ser alterado"), "Ninguém troca o autor para burlar a regra → " + e);
e = await erro("conf", `update public.propostas set estagio = 'validado' where codigo = 'P3'`);
ok(e === null, "Conferente valida proposta criada pela Coordenação → " + e);
r = (await db.query(`select validado_por, estagio from public.propostas where codigo = 'P3'`)).rows[0];
ok(r.validado_por === ids.conf && r.estagio === "validado", "Fica registrado quem validou");
r = (await db.query(`select count(*)::int c from public.historico_estagios h join public.propostas p on p.id = h.proposta_id where p.codigo = 'P3'`)).rows[0];
ok(r.c === 2, `Histórico de estágios registrado (importação + validação): ${r.c} registros`);
e = await erro("op1", `insert into public.propostas (codigo, representante_id, estagio) values ('P9', '${ids.op1}', 'validado')`);
ok(e?.includes("não pode nascer validada"), "Proposta nova não pode nascer validada → " + e);

// --- Criação de propostas ---
console.log("\nCriação de propostas");
e = await erro("op1", `insert into public.propostas (codigo, representante_id) values ('P4', '${ids.op2}')`);
ok(e !== null, "Operacional NÃO cria proposta na carteira de outro vendedor");
e = await erro("op1", `insert into public.propostas (codigo, representante_id) values ('P5', '${ids.op1}')`);
ok(e === null, "Operacional cria proposta na própria carteira");
e = await erro("conf", `insert into public.propostas (codigo, representante_id) values ('P6', '${ids.op2}')`);
r = (await db.query(`select criado_por from public.propostas where codigo = 'P6'`)).rows[0];
ok(e === null && r?.criado_por === ids.conf, "Conferente cria proposta para outro vendedor (fica registrado como autor)");

// --- Financeiro ---
console.log("\nFinanceiro");
e = await erro("fin", `update public.propostas set parecer_financeiro = 'recomendado' where codigo = 'P1'`);
r = (await db.query(`select parecer_financeiro_por from public.propostas where codigo = 'P1'`)).rows[0];
ok(e === null && r.parecer_financeiro_por === ids.fin, "Financeiro registra parecer 'recomendado'");
e = await erro("fin", `update public.propostas set valor = 1 where codigo = 'P1'`);
ok(e?.includes("só pode registrar o parecer"), "Financeiro NÃO altera o valor da proposta → " + e);
e = await erro("coord", `update public.propostas set parecer_financeiro = 'nao_recomendado' where codigo = 'P1'`);
ok(e?.includes("parecer financeiro"), "Coordenação NÃO registra parecer financeiro → " + e);
e = await erro("fin", `update public.clientes set cond_pagamento_padrao = '30 DDL' where id = 1`);
ok(e === null, "Financeiro edita dados de faturamento do cliente");
e = await erro("fin", `update public.clientes set razao_social = 'X' where id = 1`);
ok(e?.includes("dados de faturamento"), "Financeiro NÃO edita outros dados do cliente → " + e);

// --- Clientes ---
console.log("\nClientes");
r = await como("coord", `update public.clientes set razao_social = 'X' where id = 1`);
ok(r.affectedRows === 0, "Coordenação só consulta clientes (não edita)");
r = await como("op1", `update public.clientes set telefone = '1199' where id = 2`);
ok(r.affectedRows === 0, "Operacional NÃO edita cliente de outro vendedor");
r = await como("op1", `update public.clientes set telefone = '1199' where id = 1`);
ok(r.affectedRows === 1, "Operacional edita cliente da própria carteira");
e = await erro("op1", `update public.clientes set representante_id = '${ids.op2}' where id = 1`);
ok(e !== null, "Operacional NÃO transfere cliente para outro vendedor");
r = await como("adm", `delete from public.clientes where id = 3`);
ok(r.affectedRows === 1, "Admin exclui cliente");

// --- Regras de comissão ---
console.log("\nRegras de comissão");
r = await como("adm", `update public.regras_comissao set percentual = 0.11 where desconto_max = 0 and not com_cce and tipo_tabela = 'rad' and tipo_vendedor = 'representante'`);
ok(r.affectedRows === 1, "Admin altera regra de comissão");
r = await como("adm", `delete from public.regras_comissao where desconto_max = 0.65`);
ok(r.affectedRows === 0, "Admin NÃO exclui parâmetro de comissão");
r = await como("coord", `update public.regras_comissao set percentual = 0.2`);
ok(r.affectedRows === 0, "Coordenação só consulta as regras");
r = await como("dir", `delete from public.faixas_cce where desconto_max = 0.65`);
ok(r.affectedRows === 1, "Diretoria exclui parâmetro");

// --- Tabela de preços e usuários ---
console.log("\nTabela de preços e usuários");
r = await como("adm", `update public.produtos set preco = 120`);
ok(r.affectedRows === 1, "Admin altera preço");
r = await como("op1", `update public.produtos set preco = 1`);
ok(r.affectedRows === 0 && (await contar("op1", "produtos")) === 1, "Operacional consulta, mas NÃO altera preços");
r = await como("op1", `update public.usuarios set perfil = 'diretoria' where nome = 'OP1'`);
ok(r.affectedRows === 0, "Usuário NÃO muda o próprio perfil");
e = await erro("op1", `insert into public.historico_estagios (proposta_id, para) values (1, 'enviado')`);
ok(e !== null, "Ninguém grava histórico à mão");

console.log(falhas ? `\n${falhas} teste(s) falharam` : "\nTodos os testes passaram");
process.exit(falhas ? 1 : 0);
