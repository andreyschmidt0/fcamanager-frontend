import React from 'react';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  maxHeight?: string;
  emptyMessage?: string;
  showCount?: boolean;
  totalCount?: number;
}

const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  maxHeight = '500px',
  emptyMessage = 'Nenhum registro encontrado',
  showCount = true,
  totalCount
}: DataTableProps<T>) => {
  const displayCount = totalCount !== undefined ? totalCount : data.length;

  return (
    <div className="bg-[#1d1e24] rounded-lg overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar" style={{ maxHeight }}>
        <table className="w-full">
          <thead className="bg-[#111216] sticky top-0 z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={
                    column.headerClassName ||
                    'px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700'
                  }
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-[#252631] transition-colors">
                  {columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column.key}`}
                      className={column.className || 'px-4 py-3 text-sm text-white'}
                    >
                      {column.render
                        ? column.render(row, rowIndex)
                        : row[column.key] !== null && row[column.key] !== undefined
                        ? String(row[column.key])
                        : '-'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Total de registros */}
      {showCount && data.length > 0 && (
        <div className="bg-[#111216] px-4 py-3 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            {totalCount !== undefined && totalCount !== data.length ? (
              <>
                Mostrando <span className="text-white font-semibold">{data.length}</span> de{' '}
                <span className="text-white font-semibold">{displayCount}</span> registros
              </>
            ) : (
              <>
                Total de registros: <span className="text-white font-semibold">{displayCount}</span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(DataTable) as typeof DataTable;