import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, CameraControls, Html, Line } from '@react-three/drei';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc } from 'firebase/firestore'; 
import { Compass } from 'lucide-react';
import * as THREE from 'three';

const getSafeName = (name) => {
  if (!name) return "";
  try { return decodeURIComponent(name); } catch (e) { return name; }
};

// 🌟 即時動態指南針同步引擎
function DynamicCompass({ cameraControlRef }) {
  useFrame(() => {
    const compassEl = document.getElementById('dynamic-compass-dial');
    if (compassEl && cameraControlRef.current) {
      const azimuth = cameraControlRef.current.azimuthAngle;
      compassEl.style.transform = `rotate(${azimuth}rad)`;
    }
  });
  return null;
}

// 🌟 全區模式：智慧浮空地標
function GlobalUnitHighlight({ targetUnit, viewMode }) {
  const { scene } = useGLTF('/park.glb');
  const [center, setCenter] = useState(null);

  useEffect(() => {
    if (viewMode !== 'global' || !targetUnit) { setCenter(null); return; }
    
    const box = new THREE.Box3();
    box.makeEmpty();
    let found = false;
    
    scene.traverse((c) => {
      if (c.isMesh && getSafeName(c.name).startsWith(targetUnit)) {
        box.expandByObject(c);
        found = true;
      }
    });

    if (found) {
      const c = new THREE.Vector3();
      box.getCenter(c);
      setCenter([c.x, box.max.y + 6, c.z]); 
    } else {
      setCenter(null);
    }
  }, [targetUnit, viewMode, scene]);

  if (!center) return null;

  return (
    <Html position={center} center zIndexRange={[100, 0]}>
      <div className="animate-bounce flex flex-col items-center">
        <div className="bg-red-600 text-white px-5 py-2 rounded-full font-black shadow-[0_10px_20px_rgba(220,38,38,0.6)] text-2xl border-4 border-white whitespace-nowrap">
          📍 {targetUnit}
        </div>
        <div className="w-1.5 h-12 bg-red-600 shadow-lg"></div>
        <div className="w-6 h-3 bg-red-600/50 rounded-[100%] blur-md mt-1"></div>
      </div>
    </Html>
  );
}

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
        <Html distanceFactor={15} position={[0, h/2 + 0.5, 0]} center>
          <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-700 text-white text-[10px] px-3 py-1 rounded-full shadow-2xl tracking-widest font-bold">{name}</div>
        </Html>
      )}
    </group>
  );
}

export default function FactoryViewer() {
  const [tvCommand, setTvCommand] = useState({ targetProject: "大成工業城", target3DUnit: "", view3DMode: "global", marqueeText: "", layout_objects: [] });
  const [unitInfo, setUnitInfo] = useState(null); 
  const cameraControlRef = useRef();
  const { scene } = useGLTF('/park.glb');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'tv_mode'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.mode === '3d') {
          setTvCommand({ 
            targetProject: data.targetProject || "大成工業城",
            target3DUnit: data.target3DUnit || "", 
            view3DMode: data.view3DMode || "global", 
            marqueeText: data.marqueeText || "", 
            layout_objects: data.layout_objects || [] 
          });
        }
      }
    });
    return () => unsub();
  }, []);

  // ==========================================
  // 🌟 雙軌資料庫掃描引擎 (完美解決層級誤判問題)
  // ==========================================
  useEffect(() => {
    if (!tvCommand.target3DUnit) { setUnitInfo(null); return; }
    
    const fetchUnitInfo = async () => {
      try {
        const targetUnit = tvCommand.target3DUnit.trim().toUpperCase(); 
        const PROJECT_DOC_ID = 'mAOdqHZvJYGbNOxRKLkJ'; 
        let data = null;

        // 🔍 掃描路線 1：作為「子集合 (Subcollection)」搜尋
        const unitsRef = collection(db, 'properties', PROJECT_DOC_ID, 'units');
        const allDocs = await getDocs(unitsRef);
        if (!allDocs.empty) {
          for (let d of allDocs.docs) {
            const dData = d.data();
            const dbNumber = String(dData.number || d.id || '').trim().toUpperCase();
            if (dbNumber === targetUnit) {
              data = dData;
              break;
            }
          }
        }

        // 🔍 掃描路線 2：作為「單一文件內的陣列/物件欄位 (Document Field)」搜尋
        if (!data) {
          const docRef = doc(db, 'properties', PROJECT_DOC_ID);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const pData = docSnap.data();
            if (pData.units) {
              // 如果是陣列 (Array)
              if (Array.isArray(pData.units)) {
                data = pData.units.find(u => String(u.number || '').trim().toUpperCase() === targetUnit);
              } 
              // 如果是物件 (Map/Object)
              else if (typeof pData.units === 'object') {
                const keys = Object.keys(pData.units);
                for (let k of keys) {
                  const u = pData.units[k];
                  const dbNumber = String(u.number || k || '').trim().toUpperCase();
                  if (dbNumber === targetUnit) {
                    data = u;
                    break;
                  }
                }
              }
            }
          }
        }

        // 處理並顯示資料
        if (data) {
          // 狀態翻譯與色彩判斷
          let displayStatus = '銷售中';
          const rawStatus = String(data.status || '').toLowerCase().trim();
          if (rawStatus === 'sold' || rawStatus === '已售出') displayStatus = '已售出';
          else if (rawStatus === 'reserved' || rawStatus === '保留') displayStatus = '已保留';

          // 清理價格中的 "萬" 字避免 UI 重複
          const rawPrice = String(data.price || '--').replace(/萬/g, '').trim();

          setUnitInfo({
            size: data.ping || '--',
            price: rawPrice,
            unitPrice: data.unitPrice || '--',
            status: displayStatus,
            // 坐向判斷 (A1/B1/C1朝西, A2/B2/C2朝東)
            orientation: targetUnit.includes('1-') ? '朝西' : targetUnit.includes('2-') ? '朝東' : '朝南'
          });
        } else {
          setUnitInfo({ notFound: true, size: '--', price: '--', unitPrice: '--', orientation: '--', status: '未建檔' });
        }
      } catch (e) {
        console.error("無法取得戶別資訊:", e);
        setUnitInfo({ notFound: true, size: '--', price: '--', unitPrice: '--', orientation: '--', status: '讀取錯誤' });
      }
    };
    fetchUnitInfo();
  }, [tvCommand.target3DUnit]);
  // ==========================================

  useEffect(() => {
    if (!cameraControlRef.current) return;
    const { target3DUnit: selectedUnit, view3DMode: viewMode } = tvCommand;

    if (viewMode === 'global') {
      cameraControlRef.current.setLookAt(0, 100, 80, 0, 0, 0, true);
    } else if (selectedUnit) {
      const box = new THREE.Box3(); box.makeEmpty(); let found = false;
      scene.traverse((c) => { if (c.isMesh && getSafeName(c.name).startsWith(selectedUnit)) { box.expandByObject(c); found = true; } });

      if (found) {
        const center = new THREE.Vector3(); box.getCenter(center);
        const centerX = center.x, centerZ = center.z;

        if (viewMode === 'exterior') {
          const isRight = selectedUnit.includes('1-'); 
          const isLeft = selectedUnit.includes('2-');  
          const isCross = selectedUnit.includes('3-'); 
          
          let camX = centerX, camZ = centerZ;
          if (isRight) camX -= 15; 
          if (isLeft) camX += 15; 
          if (isCross) camZ += 15;
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
        <span className="text-slate-800 text-xl font-bold tracking-[0.3em] drop-shadow-md">{tvCommand.targetProject} 虛擬展示中心</span>
      </div>

      {/* 🌟 數位動態指南針 */}
      <div className="absolute top-8 right-8 z-50 flex flex-col items-center">
         <div className="w-[72px] h-[72px] bg-slate-900/80 backdrop-blur-md rounded-full border-2 border-slate-500/50 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-red-500 z-10"></div>
            <div id="dynamic-compass-dial" className="w-full h-full relative transition-transform duration-75 ease-linear">
                <span className="absolute top-1 left-1/2 -translate-x-1/2 text-red-500 font-bold text-[12px]">北</span>
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-slate-300 font-bold text-[12px]">南</span>
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-[12px]">東</span>
                <span className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-[12px]">西</span>
                <Compass className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 opacity-30" size={24}/>
            </div>
         </div>
         <span className="text-slate-700 text-[10px] font-black mt-2 drop-shadow-sm tracking-widest bg-white/70 px-2 py-0.5 rounded">攝影機方位</span>
      </div>

      {/* 🌟 戶別銷控資訊科技面板 */}
      {tvCommand.target3DUnit && unitInfo && (
        <div className="absolute bottom-24 left-8 z-40 bg-slate-900/90 backdrop-blur-md border-l-4 border-blue-500 p-6 rounded-r-2xl shadow-2xl w-80 text-white animate-fade-in-up">
           <div className="flex justify-between items-start mb-4">
              <div>
                 <p className="text-blue-400 text-xs font-bold tracking-widest mb-1">{tvCommand.targetProject}</p>
                 <h2 className="text-4xl font-black">{tvCommand.target3DUnit}</h2>
              </div>
              <div className={`px-3 py-1 rounded-lg text-sm font-bold border whitespace-nowrap ${unitInfo.status === '已售出' ? 'bg-red-600/30 text-red-400 border-red-500/30' : 'bg-blue-600/30 text-blue-300 border-blue-500/30'}`}>
                 {unitInfo.status}
              </div>
           </div>
           <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                 <span className="text-slate-400 font-bold">權狀坪數</span>
                 <span className="font-bold text-xl">{unitInfo.size} <span className="text-sm text-slate-400">坪</span></span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                 <span className="text-slate-400 font-bold">每坪單價</span>
                 <span className="font-bold text-xl text-yellow-400">{unitInfo.unitPrice} <span className="text-sm text-slate-400">萬/坪</span></span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                 <span className="text-slate-400 font-bold">總價</span>
                 <span className="font-black text-2xl text-orange-400">{unitInfo.price} <span className="text-sm text-slate-300">萬</span></span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-slate-400 font-bold">房屋坐向</span>
                 <span className="font-bold text-lg">{unitInfo.orientation}</span>
              </div>
           </div>
        </div>
      )}

      <Canvas shadows camera={{ position: [0, 80, 30], fov: 80 }} dpr={[1, 1.5]} gl={{ powerPreference: "high-performance" }}>
        <CameraControls ref={cameraControlRef} makeDefault maxPolarAngle={Math.PI / 1.9} minDistance={0} />
        <DynamicCompass cameraControlRef={cameraControlRef} />
        
        <ambientLight intensity={0.6} />
        <directionalLight position={[100, 150, 50]} intensity={1.5} castShadow />
        <Environment preset="city" />
        
        <Suspense fallback={<Html center><div className="text-blue-500 font-bold text-2xl">載入中...</div></Html>}>
          <FactoryShell viewMode={tvCommand.view3DMode} />
          <GlobalUnitHighlight targetUnit={tvCommand.target3DUnit} viewMode={tvCommand.view3DMode} />
          {tvCommand.layout_objects.map((obj) => <TvElement key={obj.id} obj={obj} />)}
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/park.glb');