
import React from 'react';

interface CalculatorCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const CalculatorCard: React.FC<CalculatorCardProps> = ({ title, icon, children, actions }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-lg">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-cyan-400">
              {icon}
            </div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default CalculatorCard;
