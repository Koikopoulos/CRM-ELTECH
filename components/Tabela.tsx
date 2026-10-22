export function CabecalhoTabela({ colunas }: { colunas: { nome: string; direita?: boolean }[] }) {
  return (
    <thead>
      <tr className="border-b border-linha bg-nevoa/70 text-left">
        {colunas.map((c) => (
          <th
            key={c.nome}
            scope="col"
            className={`whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-apagado ${c.direita ? "text-right" : ""}`}
          >
            {c.nome}
          </th>
        ))}
      </tr>
    </thead>
  );
}
