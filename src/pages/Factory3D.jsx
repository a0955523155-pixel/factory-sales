import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, CameraControls, Html, Line } from '@react-three/drei';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore'; 
import * as THREE from 'three';

const getSafeName = (name) => {
  if (!name) return "";
  try { return decodeURIComponent(name); } catch (e) { return name; }
};

function FactoryShell({ viewMode }) {
  const { scene } = useGLTF('/park.glb');
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        const trueName = getSafeName(child.name);
        if (trueName.includes('屋頂') || trueName.includes('Ceiling')) {
          child.visible = viewMode !== 'topdown'; 
        }
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [viewMode, scene]);
  return <primitive object={scene} />;
}

// 🌟 同步渲染機台與管線
function TvElement({ obj }) {
  const { type, name, dimensions: { l, w, h }, position, rotation } = obj;
  let color = type === 'power' ? "#9e9e9e" : type === 'water' ? "#2196f3" : "#ff9800";
  const isLine = type === 'power' || type === 'water';

  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotation.y, 0));

  return (
    <group position={[position.x, position.y, position.z]} quaternion={quaternion}>
      {isLine ? (
        <Line points={[[-l/2, 0, 0], [l/2, 0, 0]]} color={color} lineWidth={12} />
      ) : (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[w, h, l]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
        </mesh>
      )}
      
      {type === 'machine' && (
        <Html distanceFactor={15} position={[0, isLine ? 1 : h/2 + 0.5, 0]} center>
          <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-700 text-white text-[10px] px-3 py-1 rounded-full shadow-2xl tracking-widest font-bold">{name}</div>
        </Html>
      )}
    </group>
  );
}

export default function FactoryViewer() {
  const [tvCommand, setTvCommand] = useState({ target3DUnit: "", view3DMode: "global", marqueeText: "", layout_objects: [] });
  const cameraControlRef = useRef();
  const { scene } = useGLTF('/park.glb');

  // 🌟 即時監聽後台，並自動更新
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'tv_mode'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.mode === '3d') {
          setTvCommand({ target3DUnit: data.target3DUnit || "", view3DMode: data.view3DMode || "global", marqueeText: data.marqueeText || "", layout_objects: data.layout_objects || [] });
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!cameraControlRef.current) return;
    const { target3DUnit: selectedUnit, view3DMode: viewMode } = tvCommand;

    if (viewMode === 'global') {
      cameraControlRef.current.setLookAt(0, 80, 30, 0, 0, -50, true);
    } else if (selectedUnit) {
      const box = new THREE.Box3();
      box.makeEmpty();
      let found = false;
      
      scene.traverse((c) => {
        if (c.isMesh && getSafeName(c.name).startsWith(selectedUnit)) {
          box.expandByObject(c);
          found = true;
        }
      });

      if (found) {
        const center = new THREE.Vector3();
        box.getCenter(center);
        const centerX = center.x, centerZ = center.z;

        if (viewMode === 'exterior') {
          const isRight = selectedUnit.includes('1-'); const isLeft = selectedUnit.includes('2-'); const isCross = selectedUnit.includes('3-');
          let camX = centerX, camZ = centerZ;
          if (isRight) camX -= 15; if (isLeft) camX += 15; if (isCross) camZ += 15;
          cameraControlRef.current.setLookAt(camX, 3.5, camZ, centerX, 1.6, centerZ, true);
        } else if (viewMode === 'pano') {
          let dx = 0, dz = 0;
          if (selectedUnit.includes('1-')) dx = -0.1; if (selectedUnit.includes('2-')) dx = 0.1; if (selectedUnit.includes('3-')) dz = 0.1;  
          cameraControlRef.current.setLookAt(centerX, box.min.y + 1.6, centerZ, centerX + dx, box.min.y + 1.6, centerZ + dz, true);
        } else if (viewMode === 'topdown') {
          let camX = centerX, camZ = centerZ;
          if (selectedUnit.includes('1-')) camX += 0.01; if (selectedUnit.includes('2-')) camX -= 0.01; if (selectedUnit.includes('3-')) camZ -= 0.01;
          cameraControlRef.current.setLookAt(camX, box.max.y + 15, camZ, centerX, box.min.y, centerZ, true);
        }
      }
    }
  }, [tvCommand, scene]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
      <div className="absolute bottom-0 left-0 w-full h-16 bg-slate-900 border-t border-slate-800 z-30 flex items-center overflow-hidden">
        <div className="bg-blue-600 h-full px-6 flex items-center justify-center z-40 shadow-[10px_0_20px_rgba(0,0,0,0.5)]"><span className="text-white font-black text-xl tracking-widest whitespace-nowrap">園區快報</span></div>
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="animate-marquee text-white text-2xl font-bold tracking-wider opacity-90 whitespace-nowrap inline-block" style={{ animation: 'marquee 25s linear infinite' }}>{tvCommand.marqueeText}</div>
          <style>{`@keyframes marquee { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }`}</style>
        </div>
      </div>
      <div className="absolute top-8 left-8 z-20 flex items-center gap-4 opacity-80 pointer-events-none">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-white/20 text-white px-5 py-2.5 rounded-xl font-black text-2xl tracking-widest shadow-2xl">綠芽團隊 3D 引擎</div>
        <span className="text-slate-800 text-xl font-bold tracking-[0.3em] drop-shadow-md">大成工業城 虛擬展示中心</span>
      </div>

      <Canvas shadows camera={{ position: [0, 80, 30], fov: 80 }} dpr={[1, 1.5]} gl={{ powerPreference: "high-performance" }}>
        <CameraControls ref={cameraControlRef} makeDefault maxPolarAngle={Math.PI / 1.9} minDistance={0} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[100, 150, 50]} intensity={1.5} castShadow />
        <Environment preset="city" />
        <Suspense fallback={<Html center><div className="text-blue-500 font-bold text-2xl">載入中...</div></Html>}>
          <FactoryShell viewMode={tvCommand.view3DMode} />
          {tvCommand.layout_objects.map((obj) => <TvElement key={obj.id} obj={obj} />)}
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/park.glb');