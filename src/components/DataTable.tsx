interface DataTableProps {
  title: string;
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: Record<string, string | number>[];
}

export function DataTable({ title, columns, rows }: DataTableProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-[#1d1d1f]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-5 py-3 font-medium ${col.align === "right" ? "text-right" : ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-8 text-center text-gray-400"
                >
                  Sin datos
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-5 py-3 text-[#1d1d1f] ${col.align === "right" ? "text-right tabular-nums" : ""}`}
                    >
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
