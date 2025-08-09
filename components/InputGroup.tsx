
import React from 'react';
import { RangeUnit } from '../types';

interface InputGroupProps {
  label: string;
  type: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit: string;
  onUnitChange?: (unit: RangeUnit) => void;
  unitOptions?: RangeUnit[];
}

const InputGroup: React.FC<InputGroupProps> = ({ label, type, value, onChange, unit, onUnitChange, unitOptions }) => {
  return (
    <div>
      <label htmlFor={label} className="block text-sm font-medium text-gray-400 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={label}
          type={type}
          value={value}
          onChange={onChange}
          min="0"
          step="0.1"
          className="w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 pr-20"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
            {unitOptions && onUnitChange ? (
                <select 
                    value={unit} 
                    onChange={(e) => onUnitChange(e.target.value as RangeUnit)}
                    className="h-full rounded-md border-transparent bg-transparent py-0 pl-2 pr-7 text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm"
                >
                    {unitOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : (
                <span className="text-gray-400 px-4">{unit}</span>
            )}
        </div>
      </div>
    </div>
  );
};

export default InputGroup;
