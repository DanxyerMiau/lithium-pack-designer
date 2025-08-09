import React, { useState, useCallback } from 'react';
import { PackConfig } from './types';
import CalculatorPage from './pages/CalculatorPage';
import ModelerPage from './pages/ModelerPage';

type Page = 'calculator' | 'modeler';

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('calculator');
  const [modelerConfig, setModelerConfig] = useState<PackConfig | null>(null);

  const navigateToModeler = useCallback((config: PackConfig) => {
    setModelerConfig(config);
    setPage('modeler');
  }, []);

  const navigateToCalculator = useCallback(() => {
    setModelerConfig(null);
    setPage('calculator');
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {page === 'calculator' && <CalculatorPage onNavigateToModeler={navigateToModeler} />}
        {page === 'modeler' && modelerConfig && (
          <ModelerPage packConfig={modelerConfig} onBack={navigateToCalculator} />
        )}
      </div>
    </div>
  );
};

export default App;
