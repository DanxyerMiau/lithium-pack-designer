
import React from 'react';

interface ResultDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ label, value, unit }) => {
  return (
    <div className="bg-gray-700/50 p-3 rounded-lg">
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-xl font-bold text-cyan-400 font-mono">
        {value} <span className="text-base font-normal text-gray-300">{unit}</span>
      </p>
    </div>
  );
};

export default ResultDisplay;
