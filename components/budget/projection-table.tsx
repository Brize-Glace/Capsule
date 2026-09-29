import type { ProjectionRow } from "@/lib/budget";
import { formatFr, iso, money } from "@/lib/format";

type ProjectionTableProps = { rows: ProjectionRow[]; startAccount: number; startSavings: number };

export function ProjectionTable({ rows, startAccount, startSavings }: ProjectionTableProps) {
  return (
    <div className="table-scroll">
      <table className="data-table projection-table">
        <thead>
          <tr>
            <th scope="col">Mois</th>
            <th scope="col">Revenus</th>
            <th scope="col">Dépenses</th>
            <th scope="col">Vers l’épargne</th>
            <th scope="col">
              Compte courant<small>fin de mois</small>
            </th>
            <th scope="col">
              Épargne<small>fin de mois</small>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="today-row">
            <th scope="row">Aujourd’hui</th>
            <td />
            <td />
            <td />
            <td>{money(startAccount)}</td>
            <td>{money(startSavings)}</td>
          </tr>
          {rows.map((row) => (
            <tr key={iso(row.month)}>
              <th scope="row">{formatFr(row.month, "MMMM yyyy")}</th>
              <td>+ {money(row.income)}</td>
              <td>− {money(row.expenses)}</td>
              <td>− {money(row.transfer)}</td>
              <td className={row.account < 0 ? "negative" : ""}>{money(row.account)}</td>
              <td>{money(row.savings)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
