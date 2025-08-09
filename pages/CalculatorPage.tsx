import React, { useState, useEffect, useCallback } from 'react';
import { PackConfig, EbikeResult, RangeUnit, RidingStyle } from '../types';
import CalculatorCard from '../components/CalculatorCard';
import InputGroup from '../components/InputGroup';
import ResultDisplay from '../components/ResultDisplay';
import BatteryGrid from '../components/BatteryGrid';
import BoltIcon from '../components/icons/BoltIcon';
import BikeIcon from '../components/icons/BikeIcon';
import BatteryIcon from '../components/icons/BatteryIcon';
import CubeIcon from '../components/icons/CubeIcon';

interface CalculatorPageProps {
    onNavigateToModeler: (config: PackConfig) => void;
}

const CalculatorPage: React.FC<CalculatorPageProps> = ({ onNavigateToModeler }) => {
  type Panel = 'pack' | 'ebike';
  const [activePanel, setActivePanel] = useState<Panel>('pack');
  // General Pack Calculator State
  const [desiredVoltage, setDesiredVoltage] = useState<number>(48);
  const [desiredCapacity, setDesiredCapacity] = useState<number>(10);
  const [cellVoltage, setCellVoltage] = useState<number>(3.7);
  const [cellCapacity, setCellCapacity] = useState<number>(2.6);
  const [packConfig, setPackConfig] = useState<PackConfig | null>(null);

  // E-bike Calculator State
  const [ebikeVoltage, setEbikeVoltage] = useState<number>(48);
  const [range, setRange] = useState<number>(30);
  const [rangeUnit, setRangeUnit] = useState<RangeUnit>(RangeUnit.KM);
  const [ridingStyle, setRidingStyle] = useState<RidingStyle>(RidingStyle.CONSTANT);
  const [ebikeResult, setEbikeResult] = useState<EbikeResult | null>(null);
  
  const EBIKE_VOLTAGES = [24, 36, 48, 52, 60, 72];

  const calculatePack = useCallback(() => {
    if (desiredVoltage > 0 && desiredCapacity > 0 && cellVoltage > 0 && cellCapacity > 0) {
      const series = Math.ceil(desiredVoltage / cellVoltage);
      const parallel = Math.ceil(desiredCapacity / cellCapacity);
      const totalCells = series * parallel;
      const actualVoltage = series * cellVoltage;
      const actualCapacity = parallel * cellCapacity;
      const totalEnergy = actualVoltage * actualCapacity;

      setPackConfig({
        series,
        parallel,
        totalCells,
        actualVoltage,
        actualCapacity,
        totalEnergy,
      });
    } else {
      setPackConfig(null);
    }
  }, [desiredVoltage, desiredCapacity, cellVoltage, cellCapacity]);

  const calculateEbikeBattery = useCallback(() => {
    if (ebikeVoltage > 0 && range > 0) {
      const consumption = {
        [RangeUnit.KM]: {
          [RidingStyle.CONSTANT]: 10.5, // Avg of 9-12 Wh/km
          [RidingStyle.FREQUENT_START]: 17, // Avg of 14-20 Wh/km
        },
        [RangeUnit.MILES]: {
          [RidingStyle.CONSTANT]: 17, // Avg of 14-20 Wh/mile
          [RidingStyle.FREQUENT_START]: 27.5, // Avg of 22-33 Wh/mile
        },
      };

      const whPerDistance = consumption[rangeUnit][ridingStyle];
      const totalEnergy = range * whPerDistance;
      const requiredCapacity = totalEnergy / ebikeVoltage;

      setEbikeResult({
        totalEnergy,
        requiredCapacity,
      });
    } else {
      setEbikeResult(null);
    }
  }, [ebikeVoltage, range, rangeUnit, ridingStyle]);

  useEffect(() => {
    calculatePack();
  }, [calculatePack]);

  useEffect(() => {
    calculateEbikeBattery();
  }, [calculateEbikeBattery]);

  return (
    <>
      <header className="text-center mb-10">
        <div className="flex justify-center items-center gap-4">
          <BatteryIcon className="w-10 h-10 text-cyan-400"/>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Battery Pack Calculator
          </h1>
        </div>
        <p className="mt-4 text-lg text-gray-400 max-w-3xl mx-auto">
          Design your custom battery pack by calculating series/parallel configuration and estimate e-bike battery needs.
        </p>
      </header>
      {/* Floating left menu */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-30">
        <div className="flex flex-col items-center gap-3 bg-gray-800/70 border border-gray-700/70 rounded-full p-2 shadow-lg">
          <button
            aria-label="Pack Designer"
            title="Pack Designer"
            onClick={() => setActivePanel('pack')}
            className={`p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${activePanel === 'pack' ? 'bg-cyan-600 text-white' : 'text-gray-200'}`}
          >
            <BoltIcon className="w-6 h-6" />
          </button>
          <button
            aria-label="E-Bike Estimator"
            title="E-Bike Estimator"
            onClick={() => setActivePanel('ebike')}
            className={`p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${activePanel === 'ebike' ? 'bg-cyan-600 text-white' : 'text-gray-200'}`}
          >
            <BikeIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto">
        {activePanel === 'pack' && (
          <CalculatorCard 
            title="Pack Configuration Designer" 
            icon={<BoltIcon />} 
            actions={packConfig && (
              <button 
                onClick={() => onNavigateToModeler(packConfig)}
                disabled={packConfig.totalCells > 200}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-75 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                <CubeIcon className="w-5 h-5" />
                Visualize in 3D
              </button>
            )}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputGroup label="Desired Pack Voltage" type="number" value={desiredVoltage} onChange={(e) => setDesiredVoltage(parseFloat(e.target.value))} unit="V" />
                <InputGroup label="Desired Pack Capacity" type="number" value={desiredCapacity} onChange={(e) => setDesiredCapacity(parseFloat(e.target.value))} unit="Ah" />
              </div>
              <div className="border-t border-gray-700 pt-6">
                <h4 className="text-lg font-semibold text-cyan-300 mb-4">Cell Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputGroup label="Individual Cell Voltage" type="number" value={cellVoltage} onChange={(e) => setCellVoltage(parseFloat(e.target.value))} unit="V" />
                  <InputGroup label="Individual Cell Capacity" type="number" value={cellCapacity} onChange={(e) => setCellCapacity(parseFloat(e.target.value))} unit="Ah" />
                </div>
              </div>
              {packConfig && (
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
                  <h3 className="text-xl font-bold text-center text-white">
                    Pack Configuration: <span className="text-cyan-400 font-mono">{packConfig.series}S{packConfig.parallel}P</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <ResultDisplay label="Total Cells" value={packConfig.totalCells} />
                    <ResultDisplay label="Total Energy" value={packConfig.totalEnergy.toFixed(2)} unit="Wh" />
                    <ResultDisplay label="Actual Voltage" value={packConfig.actualVoltage.toFixed(2)} unit="V" />
                    <ResultDisplay label="Actual Capacity" value={packConfig.actualCapacity.toFixed(2)} unit="Ah" />
                  </div>
                  <BatteryGrid series={packConfig.series} parallel={packConfig.parallel} />
                </div>
              )}
            </div>
          </CalculatorCard>
        )}

        {activePanel === 'ebike' && (
          <CalculatorCard title="E-Bike Battery Estimator" icon={<BikeIcon />}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">E-Bike Voltage</label>
                  <select value={ebikeVoltage} onChange={(e) => setEbikeVoltage(Number(e.target.value))} className="w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500">
                    {EBIKE_VOLTAGES.map(v => <option key={v} value={v}>{v}V</option>)}
                  </select>
                </div>
                <InputGroup label="Desired Range" type="number" value={range} onChange={(e) => setRange(parseFloat(e.target.value))} unit={rangeUnit} onUnitChange={setRangeUnit} unitOptions={Object.values(RangeUnit)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Riding Style</label>
                <div className="flex gap-4 rounded-md bg-gray-700 p-1">
                  <button onClick={() => setRidingStyle(RidingStyle.CONSTANT)} className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${ridingStyle === RidingStyle.CONSTANT ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Constant</button>
                  <button onClick={() => setRidingStyle(RidingStyle.FREQUENT_START)} className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${ridingStyle === RidingStyle.FREQUENT_START ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Hilly / Frequent Start</button>
                </div>
              </div>
              {ebikeResult && (
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
                  <h3 className="text-xl font-bold text-center text-white">Estimated Battery Requirements</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                    <ResultDisplay label="Required Energy" value={ebikeResult.totalEnergy.toFixed(2)} unit="Wh" />
                    <ResultDisplay label="Required Capacity" value={ebikeResult.requiredCapacity.toFixed(2)} unit="Ah" />
                  </div>
                  <p className="text-xs text-center text-gray-500 pt-2">
                    Note: This is an estimate. It's recommended to choose a battery with slightly higher capacity.
                  </p>
                </div>
              )}
            </div>
          </CalculatorCard>
        )}
      </main>
      <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Calculations are based on simplified models. Always consult with a professional for critical applications.</p>
      </footer>
    </>
  );
};

export default CalculatorPage;
