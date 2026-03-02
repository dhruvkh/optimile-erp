import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Maximize2, RotateCw, Box } from 'lucide-react';

export const LineHaul3DLoad: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [utilization, setUtilization] = useState(68);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- Three.js Setup ---
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // slate-100

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(40, 30, 50);
    camera.lookAt(0, 5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // --- Trailer Container (Wireframe) ---
    // Standard 53ft Trailer approx dimensions scaled down
    const trailerGeo = new THREE.BoxGeometry(40, 10, 10);
    const edges = new THREE.EdgesGeometry(trailerGeo);
    const trailerLines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x1e293b }));
    scene.add(trailerLines);

    // --- Floor ---
    const floorGeo = new THREE.PlaneGeometry(40, 10);
    const floorMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = Math.PI / 2;
    floor.position.y = -5;
    scene.add(floor);

    // --- Cargo Boxes (Bin Packing Simulation) ---
    const boxes: THREE.Mesh[] = [];
    const colors = [0x3b82f6, 0x10b981, 0xf59e0b, 0xef4444]; // Blue, Green, Yellow, Red

    // Generate some random stacked boxes
    const numBoxes = 25;
    let currentX = -18;
    
    for (let i = 0; i < numBoxes; i++) {
        // Random box sizes
        const sx = 2 + Math.random() * 2;
        const sy = 2 + Math.random() * 3;
        const sz = 2 + Math.random() * 2;
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const boxGeo = new THREE.BoxGeometry(sx - 0.1, sy - 0.1, sz - 0.1); // gap
        const boxMat = new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: 0.9 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        
        // Simple stacking logic for demo
        const xPos = -18 + (i % 8) * 4.5;
        const zPos = -3 + Math.floor(i / 8) * 3;
        
        // Randomize height based on "stack"
        const yPos = -5 + sy / 2;

        box.position.set(
            (Math.random() * 35) - 17.5, // Random X within trailer
            -5 + sy/2 + (Math.random() > 0.5 ? 0 : 3), // Simple 2-layer stacking logic
            (Math.random() * 8) - 4  // Random Z within trailer
        );

        // Edges for box
        const boxEdges = new THREE.EdgesGeometry(boxGeo);
        const boxLines = new THREE.LineSegments(boxEdges, new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 }));
        box.add(boxLines);

        scene.add(box);
        boxes.push(box);
    }

    // --- Animation Loop ---
    let frameId: number;
    let angle = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Auto rotate
      angle += 0.002;
      camera.position.x = 50 * Math.sin(angle);
      camera.position.z = 50 * Math.cos(angle);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <Card className="h-full flex flex-col p-0 relative overflow-hidden bg-slate-50 border-slate-200">
      <div className="absolute top-4 left-4 z-10">
         <h3 className="font-bold text-slate-800 bg-white/80 backdrop-blur px-2 py-1 rounded shadow-sm">Trailer Load Plan</h3>
         <p className="text-xs text-slate-500 mt-1 bg-white/80 backdrop-blur px-2 py-1 rounded inline-block">MH-04-TR-8822</p>
      </div>

      <div className="absolute top-4 right-4 z-10 flex space-x-2">
         <button className="p-2 bg-white rounded shadow text-slate-600 hover:text-primary"><RotateCw className="h-4 w-4" /></button>
         <button className="p-2 bg-white rounded shadow text-slate-600 hover:text-primary"><Maximize2 className="h-4 w-4" /></button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur p-3 rounded-lg border border-slate-200 shadow-sm">
         <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Volume Util</span>
            <span className="text-sm font-bold text-primary">{utilization}%</span>
         </div>
         <div className="w-32 bg-slate-200 rounded-full h-1.5 mb-3">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${utilization}%` }}></div>
         </div>
         <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
            <div className="flex items-center"><div className="w-2 h-2 bg-blue-500 mr-1 rounded"></div> General</div>
            <div className="flex items-center"><div className="w-2 h-2 bg-red-500 mr-1 rounded"></div> Hazmat</div>
            <div className="flex items-center"><div className="w-2 h-2 bg-yellow-500 mr-1 rounded"></div> Fragile</div>
            <div className="flex items-center"><div className="w-2 h-2 bg-emerald-500 mr-1 rounded"></div> Priority</div>
         </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10">
          <Button size="sm" className="shadow-lg">
             <Box className="h-4 w-4 mr-2" /> Auto-Pack
          </Button>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-move" />
    </Card>
  );
};
