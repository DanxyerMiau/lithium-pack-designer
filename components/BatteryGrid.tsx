import React from 'react';

interface BatteryGridProps {
  series: number;
  parallel: number;
}

const BatteryGrid: React.FC<BatteryGridProps> = ({ series, parallel }) => {
  const totalCells = series * parallel;
  const MAX_CELLS_TO_RENDER = 200; // Limit rendering to prevent performance issues

  if (totalCells > MAX_CELLS_TO_RENDER || series < 1 || parallel < 1) {
    const reason = totalCells > MAX_CELLS_TO_RENDER 
      ? `large packs (${totalCells} cells)` 
      : 'invalid configuration';
    return (
      <div className="text-center text-sm text-gray-400 mt-4 p-4 bg-gray-900/50 rounded-md">
        Grid view is hidden for {reason} to maintain performance.
      </div>
    );
  }

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${parallel}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${series}, minmax(0, 1fr))`,
  };
  
  // Calculate cell size based on grid dimensions to prevent oversized displays
  const maxCellSize = Math.min(40, 300 / Math.max(series, parallel)); // Max 40px, scale down for larger grids
  const cellSize = `${maxCellSize}px`;
  
  // Determine where the final connection (negative terminal) is
  const endColumn = series % 2 !== 0 ? parallel : 1;

  return (
    <div className="mt-4">
      <p className="text-center text-sm text-gray-400 mb-2">Visual Layout & Connections ({series}S x {parallel}P)</p>
      <div className="bg-gray-900/50 p-3 rounded-lg overflow-hidden flex justify-center">
        <div className="relative" style={{ width: 'fit-content' }}>
          {/* Layer 1: The cells */}
          <div className="grid gap-1.5" style={{
            gridTemplateColumns: `repeat(${parallel}, ${cellSize})`,
            gridTemplateRows: `repeat(${series}, ${cellSize})`,
          }}>
            {Array.from({ length: totalCells }).map((_, i) => (
              <div
                key={i}
                className="rounded-full bg-cyan-700 flex items-center justify-center ring-1 ring-cyan-600"
                style={{ width: cellSize, height: cellSize }}
                title="18650 Cell"
              >
                <div className="w-1/3 h-1/3 rounded-full bg-cyan-500"></div>
              </div>
            ))}
          </div>

          {/* Layer 2: The nickel strips and terminals overlay */}
          <div className="absolute inset-0 grid gap-1.5 pointer-events-none" style={{
            gridTemplateColumns: `repeat(${parallel}, ${cellSize})`,
            gridTemplateRows: `repeat(${series}, ${cellSize})`,
          }}>
            {/* Parallel strips */}
            {Array.from({ length: series }).map((_, s_idx) => (
              <div
                key={`p-strip-${s_idx}`}
                className="flex items-center"
                style={{ gridRow: s_idx + 1, gridColumn: '1 / -1', zIndex: 5 }}
              >
                <div className="w-full h-1/2 bg-slate-400/70 backdrop-blur-sm rounded-sm" />
              </div>
            ))}

            {/* Series strips */}
            {Array.from({ length: series - 1 }).map((_, i) => {
              const s_idx = i + 1;
              // Create an alternating "snake" pattern for series connections
              const column = s_idx % 2 !== 0 ? parallel : 1;
              const isOddRow = s_idx % 2 !== 0;
              
              return (
                <div
                  key={`s-strip-${s_idx}`}
                  className="flex items-center justify-center"
                  style={{
                    gridRow: `${s_idx} / span 2`,
                    gridColumn: column,
                    zIndex: 10,
                  }}
                >
                  {/* Vertical strip with gradient to show connection direction */}
                  <div 
                    className={`h-full w-1/2 rounded-sm ${
                      isOddRow 
                        ? 'bg-gradient-to-b from-slate-500/70 to-slate-600/90' // Top to bottom for odd rows
                        : 'bg-gradient-to-t from-slate-500/70 to-slate-600/90' // Bottom to top for even rows
                    } backdrop-blur-sm`}
                  />
                  {/* Connection indicator dots */}
                  <div className="absolute flex flex-col justify-between h-full py-1">
                    <div className={`w-1 h-1 rounded-full ${isOddRow ? 'bg-orange-400' : 'bg-slate-400/50'}`} />
                    <div className={`w-1 h-1 rounded-full ${!isOddRow ? 'bg-orange-400' : 'bg-slate-400/50'}`} />
                  </div>
                </div>
              );
            })}

            {/* Terminals */}
            <div style={{ gridRow: 1, gridColumn: 1, zIndex: 15 }} className="relative flex items-center">
                <div className="absolute -left-1 sm:-left-2 w-2 sm:w-4 h-1/3 bg-red-500 rounded-l-md" title="Positive Terminal" />
                <span className="absolute -left-4 sm:-left-7 text-red-500 font-bold text-lg select-none">+</span>
            </div>
             <div style={{ gridRow: series, gridColumn: endColumn, zIndex: 15 }} className="relative flex items-center justify-end">
                <div className={`absolute h-1/3 ${endColumn === 1 ? '-left-1 sm:-left-2 rounded-l-md' : '-right-1 sm:-right-2 rounded-r-md'} w-2 sm:w-4 bg-blue-500`} title="Negative Terminal" />
                <span className={`absolute ${endColumn === 1 ? '-left-4 sm:-left-7' : '-right-4 sm:-right-7'} text-blue-500 font-bold text-lg select-none`}>-</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatteryGrid;