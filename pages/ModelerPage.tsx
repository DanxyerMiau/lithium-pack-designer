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
  const [previewMode, setPreviewMode] = useState<'3d' | 'stl' | 'svg'>('3d');
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
    const bracketHeight = 8; // mm - height of brackets at both ends
    const length = series * holder.outerDepth;
    const width = parallel * holder.outerWidth;
    const totalHeight = height + (bracketHeight * 2); // Cell height + top bracket + bottom bracket
    return { length, width, height: totalHeight };
  }, [cellType, series, parallel]);
  
  const handleBuildComplete = useCallback(() => {
    setIsBuilding(false);
  }, []);

  const generateSVGContent = useCallback(() => {
    const holder = HOLDER_DIMENSIONS[cellType];
    const { length, width, height } = dimensions;
    const padding = 20;
    const svgWidth = width + padding * 2;
    const svgHeight = length + padding * 2;

    let svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg" style="background-color: #fff; border: 1px solid #ccc;">`;
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
    svg += `<text x="${width + 12}" y="${length + 20}" text-anchor="middle" font-size="4" fill="#666">Height: ${height.toFixed(1)}mm (inc. brackets)</text>`;
    svg += `</g>`;
    svg += `</g><defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="blue" /></marker></defs></svg>`;
    return svg;
  }, [cellType, dimensions, series, parallel]);
  
  // Cell type is now chosen via segmented control
  
  const handleModelTypeChange = (type: ModelType) => {
    setModelType(type);
  };

  const handleExportSVG = () => {
    const holder = HOLDER_DIMENSIONS[cellType];
    const { length, width, height } = dimensions;
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
    svg += `<text x="${width + 12}" y="${length + 20}" text-anchor="middle" font-size="4" fill="#66666652">Height: ${height.toFixed(1)}mm (inc. brackets)</text>`;
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
        const innerHeight = height + tolerance * 2;
        const outerLength = innerLength + wallThickness * 2;
        const outerWidth = innerWidth + wallThickness * 2;
        const outerHeight = innerHeight + wallThickness;
        
        const group = new THREE.Group();
        
        // Get the bracket geometry from the 3D scene if available
        const sceneContent = threeSceneRef.current?.getExportableMesh();
        if (sceneContent) {
          // Include the brackets from the scene (which should include top and bottom brackets)
          group.add(sceneContent.clone());
        }
        
        // Add enclosure walls around the brackets
        // Bottom plate
        const bottomGeo = new THREE.BoxGeometry(outerWidth, outerLength, wallThickness);
        bottomGeo.translate(0, 0, -outerHeight/2 + wallThickness/2);
        const bottomMesh = new THREE.Mesh(bottomGeo);
        group.add(bottomMesh);
        
        // Four walls
        // Front wall
        const frontWallGeo = new THREE.BoxGeometry(outerWidth, wallThickness, innerHeight);
        frontWallGeo.translate(0, outerLength/2 - wallThickness/2, wallThickness/2);
        const frontWall = new THREE.Mesh(frontWallGeo);
        group.add(frontWall);
        
        // Back wall
        const backWallGeo = new THREE.BoxGeometry(outerWidth, wallThickness, innerHeight);
        backWallGeo.translate(0, -outerLength/2 + wallThickness/2, wallThickness/2);
        const backWall = new THREE.Mesh(backWallGeo);
        group.add(backWall);
        
        // Left wall
        const leftWallGeo = new THREE.BoxGeometry(wallThickness, innerLength, innerHeight);
        leftWallGeo.translate(-outerWidth/2 + wallThickness/2, 0, wallThickness/2);
        const leftWall = new THREE.Mesh(leftWallGeo);
        group.add(leftWall);
        
        // Right wall
        const rightWallGeo = new THREE.BoxGeometry(wallThickness, innerLength, innerHeight);
        rightWallGeo.translate(outerWidth/2 - wallThickness/2, 0, wallThickness/2);
        const rightWall = new THREE.Mesh(rightWallGeo);
        group.add(rightWall);

        // Top/lid as separate part (positioned to the side of the enclosure)
        const topGeo = new THREE.BoxGeometry(outerWidth, outerLength, wallThickness);
        topGeo.translate(outerWidth + 10, 0, -outerHeight/2 + wallThickness/2); // Position to the side, flat on the bed
        const topMesh = new THREE.Mesh(topGeo);
        group.add(topMesh);

        meshToExport = group;
        fileName = `enclosure_with_brackets_${series}s${parallel}p_${cellType}.stl`;
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
          
          {previewMode === '3d' && (
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
          )}
          
          {previewMode === 'svg' && (
            <div 
              key={`svg-preview-${series}-${parallel}-${cellType}`}
              className="w-full h-full flex items-center justify-center bg-white rounded-lg"
            >
              <div 
                className="max-w-full max-h-full overflow-auto"
                dangerouslySetInnerHTML={{ __html: generateSVGContent() }}
              />
            </div>
          )}
          
          {previewMode === 'stl' && (
            <STLPreview 
              key={`stl-preview-${series}-${parallel}-${cellType}-${modelType}-${showBrackets}`}
              modelType={modelType}
              dimensions={dimensions}
              series={series}
              parallel={parallel}
              cellType={cellType}
              wallThickness={wallThickness}
              tolerance={tolerance}
              showBrackets={showBrackets}
              threeSceneRef={threeSceneRef}
            />
          )}
        </div>
        
        <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Pack Details</h3>
                <div className="space-y-4">
                    <ResultDisplay label="Configuration" value={`${series}S${parallel}P`} />
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Cell Type</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-700/60 p-1 rounded-lg">
                          {([CellType.C18650, CellType.C21700, CellType.C26650, CellType.C32700] as CellType[]).map((ct) => {
                            const selected = cellType === ct;
                            const label = ct.replace('C', '');
                            return (
                              <button
                                key={ct}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => { setIsBuilding(true); setCellType(ct); }}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors text-center ${selected ? 'bg-cyan-600 text-white' : 'text-gray-200 hover:bg-gray-600'}`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                    </div>
                     <h4 className="text-lg font-semibold text-cyan-300 pt-2">Overall Dimensions (incl. holders)</h4>
                     <ResultDisplay label="Length (Series)" value={dimensions.length.toFixed(1)} unit="mm" />
                     <ResultDisplay label="Width (Parallel)" value={dimensions.width.toFixed(1)} unit="mm" />
                     <ResultDisplay label="Height" value={dimensions.height.toFixed(1)} unit="mm" />
                </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-3">View</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between bg-gray-700/40 rounded-md px-2 py-1.5">
                  <span className="text-sm text-gray-300 select-none">Grid</span>
                  <ToggleSwitch checked={isGridVisible} onChange={() => setIsGridVisible(!isGridVisible)} />
                </div>
                <div className="flex items-center justify-between bg-gray-700/40 rounded-md px-2 py-1.5">
                  <span className="text-sm text-gray-300 select-none">Brackets</span>
                  <ToggleSwitch checked={showBrackets} onChange={() => setShowBrackets(!showBrackets)} />
                </div>
              </div>
            </div>

            <CompactExport
              modelType={modelType}
              onModelTypeChange={handleModelTypeChange}
              wallThickness={wallThickness}
              tolerance={tolerance}
              onWallThicknessChange={setWallThickness}
              onToleranceChange={setTolerance}
              onExportSTL={handleExportSTL}
              onExportSVG={handleExportSVG}
              isBuilding={isBuilding}
            />

        </div>
      </main>
    </div>
    {/* Floating pill-style color menu (matches left menu styling) */}
    <ColorPillMenu
      cellColor={cellColor}
      posColor={posColor}
      negColor={negColor}
      colorMode={colorMode}
      previewMode={previewMode}
      onCellColorChange={setCellColor}
      onPosColorChange={setPosColor}
      onNegColorChange={setNegColor}
      onToggleExact={() => setColorMode(colorMode === 'unlit' ? 'pbr' : 'unlit')}
      onPreviewModeChange={setPreviewMode}
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
  colorMode: 'pbr' | 'unlit';
  previewMode: '3d' | 'stl' | 'svg';
  onCellColorChange: (c: string) => void;
  onPosColorChange: (c: string) => void;
  onNegColorChange: (c: string) => void;
  onToggleExact: () => void;
  onPreviewModeChange: (mode: '3d' | 'stl' | 'svg') => void;
}> = ({ cellColor, posColor, negColor, colorMode, previewMode, onCellColorChange, onPosColorChange, onNegColorChange, onToggleExact, onPreviewModeChange }) => {
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
        <button
          aria-label="Exact Colors"
          title="Exact Colors"
          onClick={onToggleExact}
          className={`p-2 rounded-full shadow hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${colorMode === 'unlit' ? 'bg-cyan-600 text-white' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 2a7 7 0 110 14 7 7 0 010-14z"/>
            <path d="M12 6a6 6 0 00-6 6h2a4 4 0 018 0h2a6 6 0 00-6-6z"/>
          </svg>
        </button>
        
        {/* Divider */}
        <div className="w-full h-px bg-gray-600 my-1"></div>
        
        {/* Preview Mode Buttons */}
        <button
          aria-label="3D Preview"
          title="3D Preview"
          onClick={() => onPreviewModeChange('3d')}
          className={`p-2 rounded-full shadow hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${previewMode === '3d' ? 'bg-cyan-600 text-white' : 'text-gray-300'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </button>
        
        <button
          aria-label="STL Preview"
          title="STL Preview"
          onClick={() => onPreviewModeChange('stl')}
          className={`p-2 rounded-full shadow hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${previewMode === 'stl' ? 'bg-green-600 text-white' : 'text-gray-300'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3L4 6v12l8 3 8-3V6l-8-3zm6 10.5l-6 2.25-6-2.25V8.5l6 2.25 6-2.25v5z"/>
          </svg>
        </button>
        
        <button
          aria-label="SVG Preview"
          title="SVG Preview"
          onClick={() => onPreviewModeChange('svg')}
          className={`p-2 rounded-full shadow hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${previewMode === 'svg' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2z"/>
          </svg>
        </button>
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

// Minimal, accessible toggle switch
const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; label?: string }> = ({ checked, onChange, label }) => {
  const id = useMemo(() => `tgl-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <div className="relative inline-flex items-center">
      {label && (
        <label htmlFor={id} className="mr-2 text-sm text-gray-300">
          {label}
        </label>
      )}
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-cyan-600' : 'bg-gray-600'} relative focus:outline-none focus:ring-2 focus:ring-cyan-500`}
      >
        <span
          className={`absolute top-0.5 ${checked ? 'right-0.5' : 'left-0.5'} h-5 w-5 bg-white rounded-full shadow transition-all`}
        />
      </button>
    </div>
  );
};

const CompactExport: React.FC<{
  modelType: ModelType;
  onModelTypeChange: (t: ModelType) => void;
  wallThickness: number;
  tolerance: number;
  onWallThicknessChange: (n: number) => void;
  onToleranceChange: (n: number) => void;
  onExportSTL: () => void;
  onExportSVG: () => void;
  isBuilding: boolean;
}> = ({ modelType, onModelTypeChange, wallThickness, tolerance, onWallThicknessChange, onToleranceChange, onExportSTL, onExportSVG, isBuilding }) => {
  const [openSettings, setOpenSettings] = useState(false);
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Export</h3>
        <div className="flex gap-2 rounded-md bg-gray-700/60 p-1">
          <button
            onClick={() => onModelTypeChange(ModelType.ENCLOSURE)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${modelType === ModelType.ENCLOSURE ? 'bg-cyan-600 text-white' : 'text-gray-200 hover:bg-gray-600'}`}
          >
            Enclosure
          </button>
          <button
            onClick={() => onModelTypeChange(ModelType.BRACKET)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${modelType === ModelType.BRACKET ? 'bg-cyan-600 text-white' : 'text-gray-200 hover:bg-gray-600'}`}
          >
            Brackets
          </button>
        </div>
      </div>

      {modelType === ModelType.ENCLOSURE && (
        <div className="mb-3">
          <button
            onClick={() => setOpenSettings(!openSettings)}
            className="w-full flex items-center justify-between bg-gray-700/40 px-3 py-2 rounded-md text-sm text-gray-200 hover:bg-gray-600"
          >
            <span>Enclosure Settings</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${openSettings ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.856a.75.75 0 111.08 1.04l-4.24 4.41a.75.75 0 01-1.08 0l-4.24-4.41a.75.75 0 01.02-1.06z" clipRule="evenodd"/></svg>
          </button>
          {openSettings && (
            <div className="grid grid-cols-1 gap-3 mt-3">
              <div className="bg-gray-700/40 rounded-md p-3">
                <label className="block text-xs font-medium text-gray-300 mb-1">Wall Thickness (mm)</label>
                <input
                  type="number"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-2 py-1.5 focus:ring-cyan-500 focus:border-cyan-500"
                  value={wallThickness}
                  onChange={(e) => onWallThicknessChange(parseFloat(e.target.value))}
                />
              </div>
              <div className="bg-gray-700/40 rounded-md p-3">
                <label className="block text-xs font-medium text-gray-300 mb-1">Fit Tolerance (mm)</label>
                <input
                  type="number"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-2 py-1.5 focus:ring-cyan-500 focus:border-cyan-500"
                  value={tolerance}
                  onChange={(e) => onToleranceChange(parseFloat(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
                <button
          onClick={onExportSTL}
          disabled={isBuilding}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-600"
          title="Export Model (STL)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 3l4 4h-3v6h-2V7H8l4-4z"/><path d="M5 13h14v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6z"/></svg>
          <span className="hidden sm:inline">STL</span>
        </button>
        <button
          onClick={onExportSVG}
          disabled={isBuilding}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600"
          title="Export Layout (SVG)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 9.979.239.019.239.019.479.021C16.799 26.98 22 22.75 22 17V7l-10-5z"/><path d="M9 9l2 2 4-4"/></svg>
          <span className="hidden sm:inline">SVG</span>
        </button>
      </div>
    </div>
  );
};

// STL Preview Component
const STLPreview: React.FC<{
  modelType: ModelType;
  dimensions: { length: number; width: number; height: number };
  series: number;
  parallel: number;
  cellType: CellType;
  wallThickness: number;
  tolerance: number;
  showBrackets: boolean;
  threeSceneRef: React.RefObject<{ getExportableMesh: () => THREE.Object3D | null }>;
}> = ({ modelType, dimensions, series, parallel, cellType, wallThickness, tolerance, showBrackets, threeSceneRef }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const [showMeasurements, setShowMeasurements] = React.useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    // Clear any existing content - remove ALL children
    const mountElement = mountRef.current;
    while (mountElement.firstChild) {
      mountElement.removeChild(mountElement.firstChild);
    }

    let cleanup: (() => void) | null = null;
    let isMounted = true;

    // Import OrbitControls
    import('three/examples/jsm/controls/OrbitControls.js').then(({ OrbitControls }) => {
      if (!isMounted || !mountRef.current) return; // Check if component is still mounted
      if (!isMounted || !mountRef.current) return; // Check if component is still mounted

      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1f2937);
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      cameraRef.current = camera;

      // Create renderer with dynamic sizing
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      const containerWidth = mountRef.current.clientWidth || 400;
      const containerHeight = mountRef.current.clientHeight || 400;
      renderer.setSize(containerWidth, containerHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      // Update camera aspect ratio
      camera.aspect = containerWidth / containerHeight;
      camera.updateProjectionMatrix();

      if (!mountRef.current) return;
      mountRef.current.appendChild(renderer.domElement);

      // Add camera controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 10;
      controls.maxDistance = 500;
      controls.maxPolarAngle = Math.PI;
      controlsRef.current = controls;

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 5, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      // Generate STL geometry based on mode
      const group = new THREE.Group();

      if (modelType === ModelType.ENCLOSURE) {
        // ENCLOSURE MODE: Only show the empty enclosure (no batteries)
        const { length, width, height } = dimensions;
        const innerLength = length + tolerance * 2;
        const innerWidth = width + tolerance * 2;
        const innerHeight = height + tolerance * 2;
        const outerLength = innerLength + wallThickness * 2;
        const outerWidth = innerWidth + wallThickness * 2;
        const outerHeight = innerHeight + wallThickness;
        
        // Enclosure wall material
        const wallMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x8b9dc3, 
          metalness: 0.1, 
          roughness: 0.7,
          transparent: true,
          opacity: 0.8
        });
        
        // Bottom plate
        const bottomGeo = new THREE.BoxGeometry(outerWidth, outerLength, wallThickness);
        bottomGeo.translate(0, 0, -outerHeight/2 + wallThickness/2);
        const bottomMesh = new THREE.Mesh(bottomGeo, wallMaterial);
        group.add(bottomMesh);
        
        // Four walls
        const frontWallGeo = new THREE.BoxGeometry(outerWidth, wallThickness, innerHeight);
        frontWallGeo.translate(0, outerLength/2 - wallThickness/2, wallThickness/2);
        const frontWall = new THREE.Mesh(frontWallGeo, wallMaterial);
        group.add(frontWall);
        
        const backWallGeo = new THREE.BoxGeometry(outerWidth, wallThickness, innerHeight);
        backWallGeo.translate(0, -outerLength/2 + wallThickness/2, wallThickness/2);
        const backWall = new THREE.Mesh(backWallGeo, wallMaterial);
        group.add(backWall);
        
        const leftWallGeo = new THREE.BoxGeometry(wallThickness, innerLength, innerHeight);
        leftWallGeo.translate(-outerWidth/2 + wallThickness/2, 0, wallThickness/2);
        const leftWall = new THREE.Mesh(leftWallGeo, wallMaterial);
        group.add(leftWall);
        
        const rightWallGeo = new THREE.BoxGeometry(wallThickness, innerLength, innerHeight);
        rightWallGeo.translate(outerWidth/2 - wallThickness/2, 0, wallThickness/2);
        const rightWall = new THREE.Mesh(rightWallGeo, wallMaterial);
        group.add(rightWall);

        // Separate lid positioned to the side
        const lidMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x9ca3af, 
          metalness: 0.2, 
          roughness: 0.6
        });
        const topGeo = new THREE.BoxGeometry(outerWidth, outerLength, wallThickness);
        topGeo.translate(outerWidth + 10, 0, -outerHeight/2 + wallThickness/2);
        const topMesh = new THREE.Mesh(topGeo, lidMaterial);
        group.add(topMesh);

      } else {
        // BRACKET MODE: Show battery pack with brackets
        const { diameter, height: cellHeight } = CELL_DIMENSIONS[cellType];
        const spacing = diameter + 1; // 1mm spacing between cells
        
        // Create materials
        const batteryMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x2563eb, 
          metalness: 0.3, 
          roughness: 0.4 
        });
        
        const bracketMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x6b7280, 
          metalness: 0.1, 
          roughness: 0.8 
        });

        // Generate battery cells
        const cellGeometry = new THREE.CylinderGeometry(diameter/2, diameter/2, cellHeight, 16);
        
        for (let s = 0; s < series; s++) {
          for (let p = 0; p < parallel; p++) {
            // Position each battery
            const x = (s - (series - 1) / 2) * spacing;
            const z = (p - (parallel - 1) / 2) * spacing;
            
            const battery = new THREE.Mesh(cellGeometry, batteryMaterial);
            battery.position.set(x, 0, z);
            battery.rotation.x = Math.PI / 2; // Rotate to stand upright
            group.add(battery);
            
            // Add brackets if enabled
            if (showBrackets) {
              const bracketHeight = 8;
              const bracketThickness = 2;
              
              // Top bracket
              const topBracket = new THREE.Mesh(
                new THREE.BoxGeometry(diameter + 2, bracketThickness, diameter + 2),
                bracketMaterial
              );
              topBracket.position.set(x, cellHeight/2 + bracketHeight/2, z);
              group.add(topBracket);
              
              // Bottom bracket  
              const bottomBracket = new THREE.Mesh(
                new THREE.BoxGeometry(diameter + 2, bracketThickness, diameter + 2),
                bracketMaterial
              );
              bottomBracket.position.set(x, -cellHeight/2 - bracketHeight/2, z);
              group.add(bottomBracket);
            }
          }
        }
      }

      // Add the single group to scene
      scene.add(group);
      
      // Calculate bounding box for camera positioning
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // Position camera to fit the entire model and use all available space
      const distance = maxDim * 1.8; // Closer for better space usage
      camera.position.set(center.x + distance * 0.7, center.y + distance * 0.8, center.z + distance * 0.7);
      camera.lookAt(center);
      controls.target.copy(center);
      controls.update();

      // Render loop
      const animate = () => {
        if (!isMounted) return;
        requestAnimationFrame(animate);
        if (controlsRef.current) controlsRef.current.update();
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      };
      animate();

      // Handle resize to maintain aspect ratio and use full space
      const handleResize = () => {
        if (mountRef.current && rendererRef.current && cameraRef.current) {
          const width = mountRef.current.clientWidth;
          const height = mountRef.current.clientHeight;
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        }
      };

      window.addEventListener('resize', handleResize);

      // Set up cleanup function
      cleanup = () => {
        window.removeEventListener('resize', handleResize);
        if (controlsRef.current) {
          controlsRef.current.dispose();
          controlsRef.current = null;
        }
        if (rendererRef.current) {
          if (mountRef.current && rendererRef.current.domElement && mountRef.current.contains(rendererRef.current.domElement)) {
            mountRef.current.removeChild(rendererRef.current.domElement);
          }
          rendererRef.current.dispose();
          rendererRef.current = null;
        }
        // Clear scene
        if (sceneRef.current) {
          while(sceneRef.current.children.length > 0) {
            sceneRef.current.remove(sceneRef.current.children[0]);
          }
          sceneRef.current = null;
        }
        cameraRef.current = null;
      };
    });

    // Return cleanup function for useEffect
    return () => {
      isMounted = false;
      if (cleanup) cleanup();
    };
  }, [modelType, dimensions, series, parallel, cellType, wallThickness, tolerance, showBrackets, threeSceneRef]);

  // Calculate actual dimensions for measurements
  const actualDimensions = React.useMemo(() => {
    if (modelType === ModelType.ENCLOSURE) {
      const { length, width, height } = dimensions;
      const innerLength = length + tolerance * 2;
      const innerWidth = width + tolerance * 2;
      const innerHeight = height + tolerance * 2;
      const outerLength = innerLength + wallThickness * 2;
      const outerWidth = innerWidth + wallThickness * 2;
      const outerHeight = innerHeight + wallThickness;
      return {
        width: outerWidth,
        length: outerLength,
        height: outerHeight,
        lidWidth: outerWidth,
        lidLength: outerLength,
        lidThickness: wallThickness
      };
    } else {
      const { diameter, height: cellHeight } = CELL_DIMENSIONS[cellType];
      const spacing = diameter + 1;
      const totalWidth = (series - 1) * spacing + diameter;
      const totalLength = (parallel - 1) * spacing + diameter;
      return {
        width: totalWidth,
        length: totalLength,  
        height: cellHeight,
        cellDiameter: diameter,
        spacing: spacing
      };
    }
  }, [modelType, dimensions, series, parallel, cellType, wallThickness, tolerance]);

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden relative">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Measurement overlays */}
      {showMeasurements && (
        <>
          {/* Main dimensions */}
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm space-y-1">
            <div className="text-cyan-400 font-semibold">
              {modelType === ModelType.ENCLOSURE ? 'Enclosure Dimensions' : 'Pack Dimensions'}
            </div>
            <div>Width: {actualDimensions.width.toFixed(1)}mm</div>
            <div>Length: {actualDimensions.length.toFixed(1)}mm</div>
            <div>Height: {actualDimensions.height.toFixed(1)}mm</div>
            {modelType === ModelType.ENCLOSURE && (
              <>
                <div className="border-t border-gray-500 pt-1 mt-2">
                  <div className="text-gray-300 font-medium">Lid (separate part):</div>
                  <div>Size: {actualDimensions.lidWidth.toFixed(1)} × {actualDimensions.lidLength.toFixed(1)}mm</div>
                  <div>Thickness: {actualDimensions.lidThickness.toFixed(1)}mm</div>
                </div>
              </>
            )}
            {modelType === ModelType.BRACKET && (
              <>
                <div className="border-t border-gray-500 pt-1 mt-2">
                  <div className="text-gray-300 font-medium">Cell Details:</div>
                  <div>Cell Ø: {actualDimensions.cellDiameter.toFixed(1)}mm</div>
                  <div>Spacing: {actualDimensions.spacing.toFixed(1)}mm</div>
                  <div>Array: {series}S{parallel}P</div>
                </div>
              </>
            )}
          </div>

          {/* Material info */}
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
            <div className="text-green-400 font-semibold">Print Settings</div>
            <div>Wall: {wallThickness.toFixed(1)}mm</div>
            <div>Tolerance: {tolerance.toFixed(1)}mm</div>
            {modelType === ModelType.ENCLOSURE && (
              <div>Type: Enclosure + Lid</div>
            )}
            {modelType === ModelType.BRACKET && (
              <div>Type: {showBrackets ? 'With Brackets' : 'Brackets Only'}</div>
            )}
          </div>
        </>
      )}

      {/* Control buttons */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button
          onClick={() => setShowMeasurements(!showMeasurements)}
          className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
            showMeasurements 
              ? 'bg-cyan-600 text-white hover:bg-cyan-700' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          title={showMeasurements ? 'Hide measurements' : 'Show measurements'}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M4 4h16v2H4z"/>
            <path d="M4 4v2h2V4z"/>
            <path d="M8 4v2h2V4z"/>
            <path d="M12 4v2h2V4z"/>
            <path d="M16 4v2h2V4z"/>
            <path d="M20 4v2h2V4z"/>
            <path d="M4 8v12h2V8z"/>
            <path d="M4 8h2v2H4z"/>
            <path d="M4 12h2v2H4z"/>
            <path d="M4 16h2v2H4z"/>
            <path d="M4 20h2v2H4z"/>
          </svg>
        </button>
      </div>

      {/* Status message */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
        STL Preview - Click and drag to rotate, scroll to zoom
      </div>
    </div>
  );
};