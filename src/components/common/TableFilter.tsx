import React from 'react';

export interface FilterField {
  key: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

interface TableFilterProps {
  filters: FilterField[];
  columnsPerRow?: 2 | 3 | 4;
}

const TableFilter: React.FC<TableFilterProps> = ({ filters, columnsPerRow = 3 }) => {
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }[columnsPerRow];

  return (
    <div className="bg-[#1d1e24] rounded-lg p-4">
      <div className={`grid ${gridClass} gap-4`}>
        {filters.map((filter) => (
          <div key={filter.key}>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              {filter.label}
            </label>
            <input
              type="text"
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              placeholder={filter.placeholder}
              className="w-full px-3 py-2 bg-[#111216] text-white text-sm rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableFilter;
