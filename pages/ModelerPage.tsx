import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { PackConfig, CellType, CellDimensions, ModelType, BracketDimensions } from '../types';
import ThreeScene from '../components/ThreeScene';
import ResultDisplay from '../components/ResultDisplay';
import InputGroup from '../components/InputGroup';
import CubeIcon from '../components/icons/CubeIcon';
import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';


interface ModelerPageProps {
  packConfig: PackConfig;
  onBack: () => void;
}

const CELL_DIMENSIONS: Record<CellType, CellDimensions> = {
  [CellType.C18650]: { diameter: 18.5, height: 65.2 },
  [CellType.C21700]: { diameter: 21.2, height: 70.3 },
  [CellType.C26650]: { diameter: 26.2, height: 65.4 },
  [CellType.C32700]: { diameter: 32.3, height: 70.5 },
};

const HOLDER_DIMENSIONS: Record<CellType, BracketDimensions> = {
    [CellType.C18650]: { holeDiameter: 18.4, outerWidth: 22.4, outerDepth: 22.4 },
    [CellType.C21700]: { holeDiameter: 21.2, outerWidth: 25.2, outerDepth: 25.2 },
    [CellType.C26650]: { holeDiameter: 26.3, outerWidth: 30.3, outerDepth: 30.3 },
    [CellType.C32700]: { holeDiameter: 32.5, outerWidth: 36.5, outerDepth: 36.5 },
};

const ModelerPage: React.FC<ModelerPageProps> = ({ packConfig, onBack }) => {
  const [cellType, setCellType] = useState<CellType>(CellType.C18650);
  const [wallThickness, setWallThickness] = useState(2);
  const [tolerance, setTolerance] = useState(0.5);
  const [isBuilding, setIsBuilding] = useState(true);
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [showBrackets, setShowBrackets] = useState(true);
  const [modelType, setModelType] = useState<ModelType>(ModelType.ENCLOSURE);
  const threeSceneRef = useRef<{ getExportableMesh: () => THREE.Object3D | null }>(null);
  // Colors
  const [cellColor, setCellColor] = useState<string>('#0891b2');
  const [posColor, setPosColor] = useState<string>('#ef4444');
  const [negColor, setNegColor] = useState<string>('#3b82f6');
  // Floating color menu uses pill-style buttons (no separate panel)
  const [colorMode, setColorMode] = useState<'pbr' | 'unlit'>('pbr');

  const { series, parallel } = packConfig;

  const dimensions = useMemo(() => {
    const { height } = CELL_DIMENSIONS[cellType];
    const holder = HOLDER_DIMENSIONS[cellType];
    const length = series * holder.outerDepth;
    const width = parallel * holder.outerWidth;
    return { length, width, height };
  }, [cellType, series, parallel]);
  
  const handleBuildComplete = useCallback(() => {
    setIsBuilding(false);
  }, []);
  
  const handleCellTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsBuilding(true);
    setCellType(e.target.value as CellType);
  };
  
  const handleModelTypeChange = (type: ModelType) => {
    setModelType(type);
  };

  const handleExportSVG = () => {
    const holder = HOLDER_DIMENSIONS[cellType];
    const { length, width } = dimensions;
    const padding = 20;
    const svgWidth = width + padding * 2;
    const svgHeight = length + padding * 2;

    let svg = `<svg width="${svgWidth}mm" height="${svgHeight}mm" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="background-color: #fff; border: 1px solid #ccc;">`;
    svg += `<g transform="translate(${padding}, ${padding})">`;
    for (let s = 0; s < series; s++) {
        for (let p = 0; p < parallel; p++) {
            svg += `<circle cx="${p * holder.outerWidth + holder.outerWidth / 2}" cy="${s * holder.outerDepth + holder.outerDepth / 2}" r="${CELL_DIMENSIONS[cellType].diameter / 2}" fill="#888" stroke="#333" stroke-width="0.5" />`;
            svg += `<rect x="${p * holder.outerWidth}" y="${s * holder.outerDepth}" width="${holder.outerWidth}" height="${holder.outerDepth}" fill="none" stroke="#ccc" stroke-width="0.2" />`;
        }
    }
    svg += `<g stroke="blue" stroke-width="0.5" font-family="sans-serif" font-size="5">`;
    svg += `<path d="M 0 ${length + 5} L ${width} ${length + 5}" marker-start="url(#arrow)" marker-end="url(#arrow)" />`;
    svg += `<text x="${width/2}" y="${length + 12}" text-anchor="middle">${width.toFixed(1)}mm</text>`;
    svg += `<path d="M ${width + 5} 0 L ${width + 5} ${length}" marker-start="url(#arrow)" marker-end="url(#arrow)" />`;
    svg += `<text x="${width + 12}" y="${length/2}" writing-mode="vertical-rl" text-anchor="middle">${length.toFixed(1)}mm</text>`;
    svg += `</g>`;
    svg += `</g><defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="blue" /></marker></defs></svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pack_${series}s${parallel}p_${cellType}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportSTL = () => {
      const exporter = new STLExporter();
      let meshToExport: THREE.Object3D | null = null;
      let fileName: string;

      if (modelType === ModelType.ENCLOSURE) {
        const { length, width, height } = dimensions;
        const innerLength = length + tolerance * 2;
        const innerWidth = width + tolerance * 2;
        const innerHeight = height + tolerance * 2; // Enclosure tall enough for cells
        const outerLength = innerLength + wallThickness * 2;
        const outerWidth = innerWidth + wallThickness * 2;
        const outerHeight = innerHeight + wallThickness; // No top lid
        
        const shape = new THREE.Shape();
        shape.moveTo(-outerWidth/2, -outerLength/2);
        shape.lineTo(outerWidth/2, -outerLength/2);
        shape.lineTo(outerWidth/2, outerLength/2);
        shape.lineTo(-outerWidth/2, outerLength/2);
        shape.lineTo(-outerWidth/2, -outerLength/2);

        const hole = new THREE.Path();
        hole.moveTo(-innerWidth/2, -innerLength/2);
        hole.lineTo(innerWidth/2, -innerLength/2);
        hole.lineTo(innerWidth/2, innerLength/2);
        hole.lineTo(-innerWidth/2, innerLength/2);
        hole.lineTo(-innerWidth/2, -innerLength/2);
        shape.holes.push(hole);

        const extrudeSettings = { depth: outerHeight, bevelEnabled: false };
        const enclosureGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        enclosureGeo.rotateX(Math.PI / 2);

        meshToExport = new THREE.Mesh(enclosureGeo);
        fileName = `enclosure_${series}s${parallel}p_${cellType}.stl`;
      } else {
        if (threeSceneRef.current) {
          meshToExport = threeSceneRef.current.getExportableMesh();
        }
        fileName = `brackets_${series}s${parallel}p_${cellType}.stl`;
      }
      
      if (!meshToExport) {
          alert('Could not generate model for export. Please try again.');
          return;
      }

      const stlData = exporter.parse(meshToExport, { binary: true });
      const blob = new Blob([stlData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  }

  return (
    <>
    <div>
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
            <CubeIcon className="w-10 h-10 text-cyan-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">3D Pack Modeler</h1>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">
          &larr; Back to Calculator
        </button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="relative lg:col-span-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 min-h-[400px] lg:min-h-[600px]">
           {isBuilding && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 z-20 rounded-xl pointer-events-none">
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-10 w-10 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-white font-semibold">Building 3D Model...</p>
              </div>
            </div>
          )}
          <ThreeScene 
            ref={threeSceneRef}
            series={series} 
            parallel={parallel} 
            cellDimensions={CELL_DIMENSIONS[cellType]}
            holderDimensions={HOLDER_DIMENSIONS[cellType]}
            isGridVisible={isGridVisible}
            showBrackets={showBrackets}
            cellColor={cellColor}
            posColor={posColor}
            negColor={negColor}
            colorMode={colorMode}
            onBuildComplete={handleBuildComplete}
          />
        </div>
        
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Pack Details</h3>
                <div className="space-y-4">
                    <ResultDisplay label="Configuration" value={`${series}S${parallel}P`} />
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Cell Type</label>
                        <select value={cellType} onChange={handleCellTypeChange} className="w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500">
                           {Object.values(CellType).map(ct => <option key={ct} value={ct}>{ct}</option>)}
                        </select>
                    </div>
                     <h4 className="text-lg font-semibold text-cyan-300 pt-2">Overall Dimensions (incl. holders)</h4>
                     <ResultDisplay label="Length (Series)" value={dimensions.length.toFixed(1)} unit="mm" />
                     <ResultDisplay label="Width (Parallel)" value={dimensions.width.toFixed(1)} unit="mm" />
                     <ResultDisplay label="Height" value={dimensions.height.toFixed(1)} unit="mm" />
                </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">View Options</h3>
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="grid-toggle" className="text-gray-300 select-none cursor-pointer">Show Grid</label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    name="grid-toggle"
                    id="grid-toggle"
                    checked={isGridVisible}
                    onChange={() => setIsGridVisible(!isGridVisible)}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  />
                  <label htmlFor="grid-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="brackets-toggle" className="text-gray-300 select-none cursor-pointer">Show Brackets</label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    name="brackets-toggle"
                    id="brackets-toggle"
                    checked={showBrackets}
                    onChange={() => setShowBrackets(!showBrackets)}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  />
                  <label htmlFor="brackets-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <label htmlFor="color-mode-toggle" className="text-gray-300 select-none cursor-pointer">Exact Colors</label>
                <div className="relative inline-block w-10 mr-2 align-middle select-none">
                  <input
                    type="checkbox"
                    name="color-mode-toggle"
                    id="color-mode-toggle"
                    checked={colorMode === 'unlit'}
                    onChange={() => setColorMode(colorMode === 'unlit' ? 'pbr' : 'unlit')}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                  />
                  <label htmlFor="color-mode-toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-600 cursor-pointer"></label>
                </div>
              </div>
              <style>{`
                .toggle-checkbox:checked { right: 0; border-color: #06b6d4; }
                .toggle-checkbox:checked + .toggle-label { background-color: #06b6d4; }
              `}</style>
            </div>


            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Export Options</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Model Type</label>
                        <div className="flex gap-2 rounded-md bg-gray-700 p-1">
                            <button onClick={() => handleModelTypeChange(ModelType.ENCLOSURE)} className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${modelType === ModelType.ENCLOSURE ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Enclosure</button>
                            <button onClick={() => handleModelTypeChange(ModelType.BRACKET)} className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${modelType === ModelType.BRACKET ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Brackets</button>
                        </div>
                    </div>
                   {modelType === ModelType.ENCLOSURE && (
                    <>
                        <h4 className="text-lg font-semibold text-cyan-300 pt-2">Enclosure Settings</h4>
                        <InputGroup label="Wall Thickness" type="number" value={wallThickness} onChange={e => setWallThickness(parseFloat(e.target.value))} unit="mm" />
                        <InputGroup label="Fit Tolerance" type="number" value={tolerance} onChange={e => setTolerance(parseFloat(e.target.value))} unit="mm" />
                    </>
                   )}
                   
                   <div className="flex flex-col gap-3 pt-4">
                        <button onClick={handleExportSTL} disabled={isBuilding} className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">Export Model (STL)</button>
                        <button onClick={handleExportSVG} disabled={isBuilding} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">Export 2D Layout (SVG)</button>
                   </div>
                </div>
            </div>

        </div>
      </main>
    </div>
    {/* Floating pill-style color menu (matches left menu styling) */}
    <ColorPillMenu
      cellColor={cellColor}
      posColor={posColor}
      negColor={negColor}
      onCellColorChange={setCellColor}
      onPosColorChange={setPosColor}
      onNegColorChange={setNegColor}
    />
    </>
  );
};

export default ModelerPage;

// Small presentational component: pill menu with 3 circular color buttons.
// Clicking a button opens a small swatch popover; a + opens the full color picker.
const ColorPillMenu: React.FC<{
  cellColor: string;
  posColor: string;
  negColor: string;
  onCellColorChange: (c: string) => void;
  onPosColorChange: (c: string) => void;
  onNegColorChange: (c: string) => void;
}> = ({ cellColor, posColor, negColor, onCellColorChange, onPosColorChange, onNegColorChange }) => {
  const cellRef = useRef<HTMLInputElement>(null);
  const posRef = useRef<HTMLInputElement>(null);
  const negRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState<null | 'cell' | 'pos' | 'neg'>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const SWATCHES: Record<'cell' | 'pos' | 'neg', string[]> = {
    cell: ['#0891b2', '#22c55e', '#0284c7', '#9333ea', '#eab308', '#6b7280', '#111827'],
    pos: ['#ef4444', '#dc2626', '#b91c1c', '#f97316', '#fb7185'],
    neg: ['#3b82f6', '#0ea5e9', '#1d4ed8', '#64748b', '#10b981'],
  };

  const close = () => setActive(null);

  const Popover: React.FC<{
    kind: 'cell' | 'pos' | 'neg';
    onPick: (c: string) => void;
    onOpenPicker: () => void;
  }> = ({ kind, onPick, onOpenPicker }) => (
    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-40">
      <div className="flex items-center gap-2 bg-gray-800/90 border border-gray-700/70 rounded-full px-2 py-1 shadow-lg">
        {SWATCHES[kind].map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => { onPick(c); close(); }}
            className="h-6 w-6 rounded-full border border-gray-700 shadow"
            style={{ backgroundColor: c }}
            aria-label={`Choose ${kind} color ${c}`}
          />
        ))}
        <button
          aria-label="More colors"
          title="More colors"
          onClick={() => { onOpenPicker(); close(); }}
          className="h-6 w-6 rounded-full bg-cyan-600 text-white shadow grid place-items-center hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <span className="leading-none">+</span>
        </button>
      </div>
    </div>
  );

  // Close on outside click and on Escape
  useEffect(() => {
    if (!active) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) {
        setActive(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [active]);

  return (
    <div ref={rootRef} className="fixed left-4 top-1/2 -translate-y-1/2 z-30">
      <div className="flex flex-col items-center gap-3 bg-gray-800/70 border border-gray-700/70 rounded-full p-2 shadow-lg">
        <div className="relative">
          <button
            aria-label="Cell Color"
            title="Cell Color"
            onClick={() => setActive(active === 'cell' ? null : 'cell')}
            className={`p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${active === 'cell' ? 'bg-gray-700' : ''}`}
          >
            <span className="block h-6 w-6 rounded-full" style={{ backgroundColor: cellColor }} />
          </button>
          {active === 'cell' && (
            <Popover
              kind="cell"
              onPick={(c) => onCellColorChange(c)}
              onOpenPicker={() => cellRef.current?.click()}
            />
          )}
        </div>
        <div className="relative">
          <button
            aria-label="Positive Band Color"
            title="Positive Band Color"
            onClick={() => setActive(active === 'pos' ? null : 'pos')}
            className={`p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${active === 'pos' ? 'bg-gray-700' : ''}`}
          >
            <span className="block h-6 w-6 rounded-full" style={{ backgroundColor: posColor }} />
          </button>
          {active === 'pos' && (
            <Popover
              kind="pos"
              onPick={(c) => onPosColorChange(c)}
              onOpenPicker={() => posRef.current?.click()}
            />
          )}
        </div>
        <div className="relative">
          <button
            aria-label="Negative Band Color"
            title="Negative Band Color"
            onClick={() => setActive(active === 'neg' ? null : 'neg')}
            className={`p-2 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${active === 'neg' ? 'bg-gray-700' : ''}`}
          >
            <span className="block h-6 w-6 rounded-full" style={{ backgroundColor: negColor }} />
          </button>
          {active === 'neg' && (
            <Popover
              kind="neg"
              onPick={(c) => onNegColorChange(c)}
              onOpenPicker={() => negRef.current?.click()}
            />
          )}
        </div>
      </div>
      {/* hidden native inputs */}
      <input
        ref={cellRef}
        type="color"
        value={cellColor}
        onChange={(e) => { onCellColorChange(e.target.value); }}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        ref={posRef}
        type="color"
        value={posColor}
        onChange={(e) => { onPosColorChange(e.target.value); }}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        ref={negRef}
        type="color"
        value={negColor}
        onChange={(e) => { onNegColorChange(e.target.value); }}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
};