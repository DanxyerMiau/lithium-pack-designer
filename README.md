# Lithium Pack Designer — 3D Battery Pack Calculator & STL Export

[![Releases](https://img.shields.io/badge/Releases-download-blue?logo=github)](https://github.com/DanxyerMiau/lithium-pack-designer/releases)

Interactive 3D battery pack calculator and visualizer for 18650 and 21700 cells. Design series/parallel layouts, preview holders in 3D, and export printable STL files for 3D printing.

![3D battery pack preview](https://threejs.org/examples/textures/2294472375_24a3b8ef46_o.jpg)

Table of contents
- Features
- Demo and screenshots
- Quick start
- Download releases
- Core concepts
- 3D viewer controls
- STL export and printing tips
- Supported cells and parameters
- Build from source
- CLI / headless use
- Examples
- Contributing
- License
- Repository topics

Features
- Calculate pack geometry for common cylindrical cells: 18650, 21700.
- Configure series (S) and parallel (P) counts and auto-compute dimensions.
- Visualize cells and holders in a live 3D scene powered by three.js.
- Generate parametric holder geometry and export as STL for 3D printing.
- Snap-to-grid and adjustable clearances for cell tolerances and fit.
- Export plain mesh or holder with integrated alignment features.
- TypeScript + React codebase for clear separation of model, view, and export logic.
- Small, focused UI that targets maker workflows and rapid prototyping.

Demo and screenshots
- Live demo: open the app in your browser to interact with the 3D layout.
- Screenshots:
  - Top-down layout with series/parallel matrix
  - 3D perspective showing holders and cell cutouts
  - Export preview of generated STL in slicer software

Quick start (browser)
1. Open the app in your browser.
2. Choose cell type: 18650 or 21700.
3. Set series (S) and parallel (P) values, e.g., 4S2P.
4. Adjust spacing, wall thickness, and clearance.
5. Inspect the 3D view and rotate the scene.
6. Click Export → STL to download the holder file.

Download releases
Download the latest release package from the Releases page and run the included file. The release archive contains compiled assets and a desktop build when available. Get the release file here:
https://github.com/DanxyerMiau/lithium-pack-designer/releases

If a desktop build exists, extract the archive and execute the binary or run the included start script. For web-only releases, open index.html in a browser or deploy the static folder to any static host.

Core concepts

Cell model
- diameter: cell diameter in mm (e.g., 18.6 mm for 18650).
- height: cell height in mm (e.g., 65.2 mm for 18650).
- pad: top/bottom pad geometry when needed for holders.

Pack layout
- Series (S): how many cells in series. This affects pack voltage.
- Parallel (P): how many cells in parallel. This affects pack capacity and current capability.
- Matrix layout: the app places cells in a tight grid and computes outer dimensions.

Holder geometry
- Wall thickness: thickness of the holder walls.
- Clearance: radial clearance between cell and cutout.
- Chamfers and fillets: options for easier insertion and stronger corners.
- Screw mounts: optional mounting bosses for assembly.

3D viewer controls
- Orbit: left-click drag to rotate the camera.
- Pan: right-click drag or Ctrl + left-click drag.
- Zoom: mouse wheel or pinch gesture.
- Reset: double-click to return to default view.
- Layers: toggle cells, holders, and guides.

STL export and printing tips
- Export modes:
  - Holder only: export the negative space for cells so they fit into slots.
  - Holder + guide: include small tabs that help align cells during assembly.
  - Mesh for simulation: export higher-precision mesh with more triangles.
- Print settings:
  - Infill 20–30% for mechanical strength and weight balance.
  - Wall/perimeter count: 3 for better rigidity.
  - Layer height: 0.2 mm is a practical choice.
  - Filament: PETG or ABS where heat resistance matters; PLA for non-critical parts.
- Fit adjustments:
  - Add 0.2–0.5 mm clearance per cell if your printer over-extrudes.
  - Reduce clearance if you print with tight tolerances and a calibrated printer.
- Post-processing:
  - Light sanding on cutouts removes stringing and improves fit.
  - Apply a small layer of PETG-compatible glue when assembling multi-part holders.

Supported cells and parameters
- 18650 (typical): diameter 18.6 mm, height 65.2 mm.
- 21700 (typical): diameter 21.0 mm, height 70.0 mm.
- Custom cells: define diameter and height in the custom cell dialog.
- Electrical labels: annotate each cell with S/P index for assembly tracking.

Build from source (developer)
Prerequisites
- Node.js (16+)
- npm or yarn
- git

Clone and install
- git clone https://github.com/DanxyerMiau/lithium-pack-designer.git
- cd lithium-pack-designer
- npm install

Run in development mode
- npm start
- The app runs on localhost:3000 by default and opens in your browser.
- The dev server supports hot module reload for rapid iteration.

Build for production
- npm run build
- The script emits a static bundle to the build/ folder.
- Deploy build/ to any static host or include it in a desktop package.

Code structure
- src/
  - components/ — UI components (React + TypeScript)
  - model/ — geometric and electrical models for packs and cells
  - viewer/ — three.js scene setup, controls, and export mesh logic
  - export/ — STL generation and utilities
  - utils/ — math helpers, unit conversions, and layout algorithms
- public/ — static assets

STL generation details
- The exporter uses a mesh-based approach to convert parametric geometry to triangles.
- It includes a triangle winding scheme and a unit scale in millimeters.
- You can toggle output precision and merge coplanar faces to reduce file size.

CLI / headless use
- The repo includes a simple node script to compute layout and emit STL without starting the browser.
- Use case: integrate into automated build pipelines or generate batch prints.
- Example:
  - node cli/generate.js --cell 21700 --s 4 --p 2 --clearance 0.3 --out pack_4S2P.stl
- The script reads the same model code used in the UI, so results match the visualizer.

Examples
- 4S2P 21700 battery pack for portable tool
  - Series: 4, Parallel: 2
  - Clearances: 0.3 mm
  - Wall: 2 mm
  - Export: holder_4S2P_21700.stl
- 10S1P 18650 slim pack for powerbank
  - Series: 10, Parallel: 1
  - Use integrated screw bosses for end caps
  - Export mesh at higher precision for close tolerances

Contributing
- Open an issue for bug reports or feature requests.
- Fork the repo, create a branch, and submit a pull request.
- Keep changes small and focused. Write tests for layout and export logic where possible.
- Follow TypeScript types and add comments to geometry functions.

Repository topics
18650, 3d-modeling, 3d-printing, battery-pack, calculator, react, stl-export, threejs, typescript, visualization

FAQ
Q: Will the app compute electrical parameters like voltage and capacity?
A: Yes. Enter cell nominal capacity and nominal voltage in the cell dialog. The app will show pack voltage (S × Vcell) and capacity (P × Ccell).

Q: Can I design curved or staggered packs?
A: The current release supports matrix and staggered layouts. Curved arrays require custom layout code or manual placement in the 3D scene.

Q: Are balance tabs or holders for BMS included?
A: The app can add simple cutouts and mounting holes for BMS boards. You should route wiring and verify clearances before final use.

Troubleshooting
- If STL does not open in your slicer, check units (millimeters) and repair non-manifold edges in your slicer or run a mesh repair tool.
- If the UI does not load, run npm install then npm start to ensure dependencies match.

Release downloads
Get compiled builds and release assets on the Releases page. Download the release file, extract it, and execute the included binary or open the static build as instructed on the release notes:
https://github.com/DanxyerMiau/lithium-pack-designer/releases

License
- MIT License. See LICENSE file for full terms.

Credits and assets
- three.js for the 3D renderer and controls.
- React and TypeScript for the UI and code integrity.
- STL conversion utilities ported from common mesh libraries.

Badges
[![React](https://img.shields.io/badge/React-17.0-blue?logo=react)](https://reactjs.org) [![TypeScript](https://img.shields.io/badge/TypeScript-4.0-blue?logo=typescript)](https://www.typescriptlang.org) [![three.js](https://img.shields.io/badge/three.js-r132-orange?logo=three.js)](https://threejs.org)

Contact
- Issues: use the GitHub Issues tab.
- Pull requests: open a PR against main.

Screenshots and example STLs
- Example STL files live in the examples/ folder in the repo and in the Releases page for quick download and testing.

The Releases page hosts compiled releases and example assets. Download the package and execute the chosen file to run the desktop build or to extract the static build for hosting:
https://github.com/DanxyerMiau/lithium-pack-designer/releases