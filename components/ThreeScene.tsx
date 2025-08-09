import React, { useRef, useEffect, useState, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CellDimensions, BracketDimensions } from '../types';

interface ThreeSceneProps {
  series: number;
  parallel: number;
  cellDimensions: CellDimensions;
  holderDimensions: BracketDimensions;
  isGridVisible: boolean;
  onBuildComplete: () => void;
}

const ThreeScene = forwardRef<
  { getExportableMesh: () => THREE.Object3D | null },
  ThreeSceneProps
>(({ series, parallel, cellDimensions, holderDimensions, isGridVisible, onBuildComplete }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneDataRef = useRef<any>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const exportableMeshRef = useRef<THREE.Object3D | null>(null);

  useImperativeHandle(ref, () => ({
    getExportableMesh: () => {
        // We need to merge the instanced meshes into a single mesh for export
        if (!exportableMeshRef.current) return null;

        const geometries: THREE.BufferGeometry[] = [];
        (exportableMeshRef.current as THREE.Group).children.forEach(child => {
            const instancedMesh = child as THREE.InstancedMesh;
            for (let i = 0; i < instancedMesh.count; i++) {
                const matrix = new THREE.Matrix4();
                instancedMesh.getMatrixAt(i, matrix);
                const singleGeo = instancedMesh.geometry.clone();
                singleGeo.applyMatrix4(matrix);
                geometries.push(singleGeo);
            }
        });

        if (geometries.length === 0) return null;
        
        // A simple (but slow for large packs) merge. A proper merge requires BufferGeometryUtils
        // For the purpose of this tool, we will create a group and export it. STLExporter handles groups.
        return exportableMeshRef.current;
    },
  }));

  // Initialization effect
  useLayoutEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const data = sceneDataRef.current;

    data.scene = new THREE.Scene();
    data.scene.background = new THREE.Color(0x1f2937);

    const initialWidth = Math.max(1, currentMount.clientWidth || Math.round(currentMount.getBoundingClientRect().width) || 1);
    const initialHeight = Math.max(1, currentMount.clientHeight || Math.round(currentMount.getBoundingClientRect().height) || 1);

    data.camera = new THREE.PerspectiveCamera(50, initialWidth / initialHeight, 0.1, 10000);
    data.camera.position.set(200, 200, 200);

    data.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    data.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    data.renderer.setSize(initialWidth, initialHeight, false);
    currentMount.appendChild(data.renderer.domElement);

    data.controls = new OrbitControls(data.camera, data.renderer.domElement);
    data.controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    data.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(100, 100, 50);
    data.scene.add(directionalLight);

    data.gridHelper = new THREE.GridHelper(1000, 20, 0x4b5563, 0x374151);
    data.scene.add(data.gridHelper);

    data.packGroup = new THREE.Group();
    data.scene.add(data.packGroup);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      data.controls.update();
      data.renderer.render(data.scene, data.camera);
    };
    animate();

    const resize = () => {
      if (!data.camera || !data.renderer || !mountRef.current) return;
      const w = Math.max(1, mountRef.current.clientWidth || Math.round(mountRef.current.getBoundingClientRect().width) || 1);
      const h = Math.max(1, mountRef.current.clientHeight || Math.round(mountRef.current.getBoundingClientRect().height) || 1);
      data.camera.aspect = w / h;
      data.camera.updateProjectionMatrix();
      data.renderer.setSize(w, h, false);
    };

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    // Observe element size changes as layout may finalize after first paint
    if (typeof ResizeObserver !== 'undefined') {
      data.resizeObserver = new ResizeObserver(() => resize());
      data.resizeObserver.observe(currentMount);
    }

    // Ensure an initial resize after mount and layout
    requestAnimationFrame(() => resize());

    setIsInitialized(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (data.resizeObserver) {
        try { data.resizeObserver.disconnect(); } catch {}
      }
      cancelAnimationFrame(animationFrameId);
      if (data.controls) data.controls.dispose();
      if (data.renderer) {
          try {
            if (currentMount) currentMount.removeChild(data.renderer.domElement);
          } catch (e) { /* ignore */ }
          data.renderer.dispose();
      }
    };
  }, []);

  // Grid visibility effect
  useEffect(() => {
    if (isInitialized) {
      sceneDataRef.current.gridHelper.visible = isGridVisible;
    }
  }, [isGridVisible, isInitialized]);

  // Pack building effect
  useEffect(() => {
    if (!isInitialized) return;

    const { packGroup, controls } = sceneDataRef.current;
    
    while (packGroup.children.length > 0) {
      const child = packGroup.children[0];
      packGroup.remove(child);
       if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh || child instanceof THREE.Group) {
          child.traverse((object: any) => {
              if (object.geometry) object.geometry.dispose();
              if(object.material) {
                  if (Array.isArray(object.material)) {
                      object.material.forEach((material: THREE.Material) => material.dispose());
                  } else {
                      object.material.dispose();
                  }
              }
          })
      }
    }
    exportableMeshRef.current = null;
    
    const totalCells = series * parallel;
    if (totalCells === 0) {
        onBuildComplete();
        return;
    }
    const dummy = new THREE.Object3D();

    // --- Create Geometries ---
    const { diameter, height: cellHeight } = cellDimensions;
    const { outerWidth, outerDepth, holeDiameter } = holderDimensions;
    const bracketHeight = 8;

    // Cell
    const cellGeo = new THREE.CylinderGeometry(diameter / 2, diameter / 2, cellHeight, 24);
    cellGeo.translate(0, cellHeight / 2, 0);

    // Bracket Frame
    const frameShape = new THREE.Shape();
    frameShape.moveTo(-outerWidth / 2, -outerDepth / 2);
    frameShape.lineTo(outerWidth / 2, -outerDepth / 2);
    frameShape.lineTo(outerWidth / 2, outerDepth / 2);
    frameShape.lineTo(-outerWidth / 2, outerDepth / 2);
    frameShape.lineTo(-outerWidth / 2, -outerDepth / 2);
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, holeDiameter / 2, 0, Math.PI * 2, false);
    frameShape.holes.push(holePath);
    const extrudeSettings = { steps: 1, depth: bracketHeight, bevelEnabled: false };
    const bracketFrameGeo = new THREE.ExtrudeGeometry(frameShape, extrudeSettings).rotateX(Math.PI / 2);

    // Bracket Teeth for interlocking look
    const toothDepth = 1.5;
    const toothWidth = outerWidth / 2.5;
    const bracketToothGeo = new THREE.BoxGeometry(toothDepth, bracketHeight, toothWidth);

    // --- Create Materials ---
    const cellMat = new THREE.MeshStandardMaterial({ color: 0x0891b2, metalness: 0.4, roughness: 0.5 });
    const bracketMat = new THREE.MeshStandardMaterial({ color: 0x6b7280, metalness: 0.2, roughness: 0.8 });
    const stripMaterial = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.2 });
    const posTerminalMaterial = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.5 });
    const negTerminalMaterial = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.5, roughness: 0.5 });
    
    // --- Create Instanced Meshes ---
    const cellIM = new THREE.InstancedMesh(cellGeo, cellMat, totalCells);
    const bracketFrameIM = new THREE.InstancedMesh(bracketFrameGeo, bracketMat, totalCells);
    const toothRightIM = new THREE.InstancedMesh(bracketToothGeo, bracketMat, totalCells);
    const toothTopIM = new THREE.InstancedMesh(bracketToothGeo, bracketMat, totalCells);

    const bracketAssembly = new THREE.Group();
    bracketAssembly.add(bracketFrameIM, toothRightIM, toothTopIM);
    exportableMeshRef.current = bracketAssembly;
    
    packGroup.add(cellIM, bracketAssembly);

    const packWidth = parallel * outerWidth;
    const packLength = series * outerDepth;

    let i = 0;
    for (let s = 0; s < series; s++) {
        for (let p = 0; p < parallel; p++) {
            const x = p * outerWidth - (packWidth / 2) + (outerWidth / 2);
            const z = s * outerDepth - (packLength / 2) + (outerDepth / 2);
            
            // Cell
            dummy.position.set(x, 0, z);
            dummy.updateMatrix();
            cellIM.setMatrixAt(i, dummy.matrix);
            
            // Bracket Frame
            dummy.position.set(x, bracketHeight / 2, z);
            dummy.updateMatrix();
            bracketFrameIM.setMatrixAt(i, dummy.matrix);
            
            // Bracket Teeth
            dummy.position.set(x + outerWidth / 2, bracketHeight / 2, z);
            dummy.updateMatrix();
            toothRightIM.setMatrixAt(i, dummy.matrix);

            dummy.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
            dummy.position.set(x, bracketHeight / 2, z + outerDepth / 2);
            dummy.updateMatrix();
            toothTopIM.setMatrixAt(i, dummy.matrix);
            dummy.quaternion.identity();

            i++;
        }
    }
    cellIM.instanceMatrix.needsUpdate = true;
    bracketFrameIM.instanceMatrix.needsUpdate = true;
    toothRightIM.instanceMatrix.needsUpdate = true;
    toothTopIM.instanceMatrix.needsUpdate = true;
    
    // --- Add Connection Strips ---
    const stripThickness = 0.5;
    const stripYTop = cellHeight + stripThickness / 2;
    const stripYBottom = -stripThickness / 2;

    for (let s = 0; s < series; s++) {
        const y = s % 2 !== 0 ? stripYBottom : stripYTop;
        const z = s * outerDepth - (packLength / 2) + (outerDepth / 2);
        const parallelStripGeo = new THREE.BoxGeometry(packWidth, stripThickness, diameter * 0.75);
        const parallelStrip = new THREE.Mesh(parallelStripGeo, stripMaterial);
        parallelStrip.position.set(0, y, z);
        packGroup.add(parallelStrip);
    }
    
    if (series > 1) {
        for (let s = 0; s < series - 1; s++) {
            const x = s % 2 === 0 ? (packWidth / 2) - (outerWidth / 2) : -(packWidth / 2) + (outerWidth / 2);
            const z = s * outerDepth - (packLength / 2) + outerDepth;
            const y = s % 2 === 0 ? stripYTop : stripYBottom;
            const seriesStripGeo = new THREE.BoxGeometry(outerWidth, stripThickness, diameter * 0.75);
            const seriesStrip = new THREE.Mesh(seriesStripGeo, stripMaterial);
            seriesStrip.position.set(x, y, z);
            seriesStrip.rotation.y = Math.PI / 2;
            packGroup.add(seriesStrip);
        }
    }

    const terminalGeo = new THREE.BoxGeometry(outerWidth * 0.5, stripThickness * 4, diameter * 0.75);
    const posTerminal = new THREE.Mesh(terminalGeo, posTerminalMaterial);
    posTerminal.position.set(-(packWidth / 2) + (outerWidth / 2), stripYTop, -(packLength/2) + (outerDepth / 2));
    packGroup.add(posTerminal);

    const negTerminal = new THREE.Mesh(terminalGeo, negTerminalMaterial);
    const lastRowIndex = series - 1;
    const negY = lastRowIndex % 2 !== 0 ? stripYBottom : stripYTop;
    const negX = lastRowIndex % 2 === 0 ? (packWidth / 2) - (outerWidth/2) : -(packWidth / 2) + (outerWidth / 2);
    negTerminal.position.set(negX, negY, lastRowIndex * outerDepth - (packLength / 2) + (outerDepth / 2));
    packGroup.add(negTerminal);
    
    controls.target.set(0, cellHeight / 2, 0);
    controls.update();
    
    onBuildComplete();

  }, [series, parallel, cellDimensions, holderDimensions, isInitialized, onBuildComplete]);

  return <div ref={mountRef} className="absolute inset-0 rounded-lg overflow-hidden" />;
});

export default ThreeScene;