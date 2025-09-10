import React from 'react';
import { COMBAT_ARMS_PATENTS, getPatentIcon } from '../../types/patent.types';

interface PatentDropdownProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
}

const PatentDropdown: React.FC<PatentDropdownProps> = ({
  name,
  value,
  onChange,
  className = "w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors",
  required = false,
  placeholder = "Selecione uma patente"
}) => {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`${className} [&>option:checked]:bg-green-600 [&>option:checked]:text-white scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-gray-800 scrollbar-thumb-rounded-full scrollbar-track-rounded-full`}
        size={6}
        required={required}
      >
        <option value="">{placeholder}</option>
        {COMBAT_ARMS_PATENTS.map((patent) => (
          <option 
            key={patent.gradeLevel} 
            value={patent.gradeLevel}
            style={{
              backgroundImage: `url(${getPatentIcon(patent.gradeLevel)})`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '4px center',
              paddingLeft: '40px',
              paddingTop: '8px',
              paddingBottom: '8px',
              lineHeight: '1.6'
            }}
          >
            {patent.name} (Nível {patent.gradeLevel})
          </option>
        ))}
      </select>
    </div>
  );
};

export default PatentDropdown;