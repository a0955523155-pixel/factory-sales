import React, { useState, useEffect, useRef, Suspense } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { Tv, Save, MonitorPlay, Loader2, Box, PlusCircle, Trash2, Move, RotateCw, List, Copy, ClipboardPaste } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, CameraControls, Html, useProgress, TransformControls, Line } from '@react-three/drei';
import * as THREE from 'three';

const getSafeName = (name) => {
  if (!name) return "";
  try { return decodeURIComponent(name); } catch (e) { return name; }
};

function Loader() {
  const { progress } = useProgress();
  return <Html center><div className="text-orange-600 font-bold bg-white/90 p-3 rounded-lg shadow-lg whitespace-nowrap">編輯器載入中... {Math.round(progress)}%</div></Html>;
}

// 🌟 全域防護：防止拖曳結束瞬間誤觸地板導致取消選取
const isGlobalDraggingRef = { current: false };
const dragEndTime = { current: 0 };

// === 🧱 靜態廠房主體 ===
function AdminFactoryModel({ selectedUnit, placementMode, onPlaceElement, viewMode, onDeselect }) {
  const { scene } = useGLTF('/park.glb');
  
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        const trueName = getSafeName(child.name);
        if (trueName.includes('屋頂') || trueName.includes('Ceiling')) {
          child.visible = viewMode !== 'topdown'; 
        }
        if (child.material && child.material.emissive) child.material.emissive.setHex(0x000000);
      }
    });

    if (selectedUnit) {
      scene.traverse((child) => {
        if (child.isMesh && getSafeName(child.name).startsWith(selectedUnit) && child.material && child.material.emissive) {
          child.material.emissive.setHex(0x1a3a5a);
        }
      });
    }
  }, [selectedUnit, viewMode, scene]);

  return (
    <primitive 
      object={scene} 
      onClick={(e) => {
        if (Date.now() - dragEndTime.current < 200) return; 
        e.stopPropagation();
        if (placementMode) onPlaceElement(e.point); 
        else onDeselect(); 
      }}
      onPointerOver={() => { if (placementMode) document.body.style.cursor = 'crosshair'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    />
  );
}

// === 🤖 編輯物件 (🌟 雙重事件保險，保證擷取最新座標) ===
function DraggableObject({ obj, isSelected, onSelect, onUpdate, transformMode, setIsGlobalDragging, unitBox }) {
  const groupRef = useRef(); 
  const { type, dimensions: { l, w, h }, position, rotation } = obj;
  
  let color = type === 'power' ? "#9e9e9e" : type === 'water' ? "#2196f3" : "#ff9800";
  const isLine = type === 'power' || type === 'water';

  // 提取儲存座標的共用邏輯，保證每次抓到的都是最新實體位置
  const saveLatestTransform = () => {
    if (groupRef.current) {
      onUpdate(obj.id, {
        position: { x: groupRef.current.position.x, y: groupRef.current.position.y, z: groupRef.current.position.z },
        rotation: { y: groupRef.current.rotation.y }
      });
    }
  };

  return (
    <>
      {isSelected && (
        <TransformControls 
          object={groupRef}
          mode={transformMode} 
          showY={transformMode === 'rotate'} 
          showX={transformMode !== 'rotate'} 
          showZ={transformMode !== 'rotate'}
          rotationSnap={Math.PI / 2} 
          
          // 🛡️ 雙重保險一：滑鼠實體放開時強制擷取
          onMouseUp={() => saveLatestTransform()}

          // 🛡️ 雙重保險二：拖拉狀態改變時擷取
          onDraggingChanged={(e) => {
            isGlobalDraggingRef.current = e.value;
            setIsGlobalDragging(e.value);
            
            if (!e.value) {
              dragEndTime.current = Date.now(); 
              saveLatestTransform();
            }
          }}

          onChange={() => {
            // 🛡️ 即時防穿牆：極限 5 公分貼牆距離
            if (unitBox && groupRef.current) {
              const target = groupRef.current;
              const isRotated = Math.abs(Math.sin(target.rotation.y)) > 0.5;
              
              let radiusX = (isRotated ? l : w) * 0.5;
              let radiusZ = (isRotated ? w : l) * 0.5;
              if (isLine) {
                radiusX = isRotated ? 0.5 : l * 0.5;
                radiusZ = isRotated ? l * 0.5 : 0.5;
              }

              const WALL_MARGIN = 0.05; // 🌟 極限 5 公分防護網
              const minX = unitBox.min.x + radiusX + WALL_MARGIN;
              const maxX = unitBox.max.x - radiusX - WALL_MARGIN;
              const minZ = unitBox.min.z + radiusZ + WALL_MARGIN;
              const maxZ = unitBox.max.z - radiusZ - WALL_MARGIN;

              target.position.x = THREE.MathUtils.clamp(target.position.x, minX, maxX);
              target.position.z = THREE.MathUtils.clamp(target.position.z, minZ, maxZ);

              // 高度絕對鎖死
              const floorY = unitBox.min.y;
              target.position.y = isLine ? (type === 'power' ? floorY + 0.3 : floorY + 0.05) : (floorY + (h / 2)); 
            }
          }}
        />
      )}
      
      <group 
        ref={groupRef} 
        position={[position.x, position.y, position.z]} 
        rotation={[0, rotation.y, 0]}
        onClick={(e) => { e.stopPropagation(); onSelect(obj.id); }}
      >
        {isLine ? (
          <>
            <Line points={[[-l/2, 0, 0], [l/2, 0, 0]]} color={color} lineWidth={12} />
            <mesh visible={false}>
              <cylinderGeometry args={[0.5, 0.5, l, 8]} rotation={[0, 0, Math.PI / 2]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          </>
        ) : (
          <mesh castShadow receiveShadow>
            <boxGeometry args={[w, h, l]} />
            <meshStandardMaterial color={color} emissive={isSelected ? color : "#000000"} emissiveIntensity={0.4} />
          </mesh>
        )}
        
        {(type === 'machine' || isSelected) && (
          <Html distanceFactor={15} position={[0, isLine ? 1 : h/2 + 0.5, 0]} center>
            <div className={`text-white text-[10px] px-2 py-1 rounded-full whitespace-nowrap shadow-md pointer-events-none ${isSelected ? 'bg-blue-600 font-bold' : 'bg-slate-800/80'}`}>
              {obj.name}
            </div>
          </Html>
        )}
      </group>
    </>
  );
}

// === 主控制台 UI ===
export default function TvControlPanel() {
  const [tvSettings, setTvSettings] = useState({ 
    mode: 'image', selectedIds: [], marqueeText: "", interval: 8, 
    target3DUnit: "", view3DMode: "topdown", layout_objects: [], savedTemplates: [] 
  });
  
  const [loading, setLoading] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedObjId, setSelectedObjId] = useState(null);
  const [transformMode, setTransformMode] = useState('translate'); 
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [placementMode, setPlacementMode] = useState(null);
  const [newElement, setNewElement] = useState({ type: 'machine', name: '新機台', l: 3, w: 2, h: 2 });
  
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [unitBox, setUnitBox] = useState(null); 
  const cameraControlRef = useRef();
  const { scene } = useGLTF('/park.glb');

  // 📡 初次載入資料
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tvSnap = await getDoc(doc(db, 'settings', 'tv_mode'));
        if (tvSnap.exists()) {
          const data = tvSnap.data();
          setTvSettings({ mode: 'image', layout_objects: [], savedTemplates: [], ...data, view3DMode: data.view3DMode || 'topdown' });
        }
      } catch (error) { console.error(error); } finally { 
        setIsDataLoaded(true); 
        setLoading(false); 
      }
    };
    fetchData();
  }, []);

  // 🌟 真・純淨背景同步引擎 (只看 tvSettings 的變化，0.5秒後必定送出)
  useEffect(() => {
    if (!isDataLoaded || loading) return; 

    const syncTimer = setTimeout(async () => {
      setSaving(true);
      try { await setDoc(doc(db, 'settings', 'tv_mode'), tvSettings); } 
      catch (error) { console.error("同步失敗:", error); } 
      finally { setTimeout(() => setSaving(false), 800); }
    }, 500);

    return () => clearTimeout(syncTimer); // 若 0.5 秒內繼續拖拉，則重新計時防手震
  }, [tvSettings, isDataLoaded, loading]);

  const handleSave = async () => {
    setSaving(true);
    try { await setDoc(doc(db, 'settings', 'tv_mode'), tvSettings); } 
    catch (error) { alert('儲存失敗'); } finally { setTimeout(() => setSaving(false), 800); }
  };

  const handleTypeChange = (type) => {
    if (type === 'power') setNewElement({ type, name: '電力線', l: 5, w: 0.15, h: 0.15 });
    else if (type === 'water') setNewElement({ type, name: '排水管', l: 5, w: 0.25, h: 0.25 });
    else setNewElement({ type: 'machine', name: '新機台', l: 3, w: 2, h: 2 });
  };

  const activatePlacementMode = () => {
    const { type, name, l, w, h } = newElement;
    setPlacementMode({ id: Date.now().toString(), type, name, dimensions: { l: Number(l), w: Number(w), h: Number(h) }, rotation: { y: 0 }, startPoint: null });
    setSelectedObjId(null);
  };

  const handlePlaceElement = (clickPoint) => {
    const isMachine = placementMode.type === 'machine';
    const floorY = unitBox ? unitBox.min.y : 0; 
    let safeX = clickPoint.x, safeZ = clickPoint.z;
    
    if (unitBox) {
      safeX = THREE.MathUtils.clamp(safeX, unitBox.min.x + 1, unitBox.max.x - 1);
      safeZ = THREE.MathUtils.clamp(safeZ, unitBox.min.z + 1, unitBox.max.z - 1);
    }

    if (isMachine) {
      const newObj = { ...placementMode, position: { x: safeX, y: floorY + (placementMode.dimensions.h / 2), z: safeZ } };
      setTvSettings(prev => ({ ...prev, layout_objects: [...(prev.layout_objects || []), newObj] }));
      setPlacementMode(null); document.body.style.cursor = 'auto'; setSelectedObjId(newObj.id); 
    } else {
      if (!placementMode.startPoint) {
        setPlacementMode({ ...placementMode, startPoint: { x: safeX, z: safeZ } });
      } else {
        const start = placementMode.startPoint;
        const end = { x: safeX, z: safeZ };
        const dx = end.x - start.x;
        const dz = end.z - start.z;
        const distance = Math.sqrt(dx*dx + dz*dz);
        const angleY = Math.atan2(-dz, dx); 
        
        let targetY = floorY + 0.3;
        if (placementMode.type === 'water') targetY = floorY + 0.05;

        const newObj = {
          ...placementMode, dimensions: { ...placementMode.dimensions, l: distance }, 
          position: { x: (start.x + safeX) / 2, y: targetY, z: (start.z + safeZ) / 2 }, 
          rotation: { y: angleY }
        };
        
        setTvSettings(prev => ({ ...prev, layout_objects: [...(prev.layout_objects || []), newObj] }));
        setPlacementMode(null); document.body.style.cursor = 'auto'; setSelectedObjId(newObj.id); 
      }
    }
  };

  // =========================================================
  // 🌟 [採用您的神級巧思]：先刪除舊座標，再推入新座標！徹底切斷殘留！
  // =========================================================
  const updateObject = (id, newTransform) => { 
    setTvSettings(prev => {
      const targetObj = prev.layout_objects.find(o => o.id === id);
      if (!targetObj) return prev;

      // 1. 先把這個物件從清單中「無情拔除」
      const filteredLayouts = prev.layout_objects.filter(o => o.id !== id);
      // 2. 塞入帶有「絕對最新座標」的全新物件
      filteredLayouts.push({ ...targetObj, ...newTransform });

      return { ...prev, layout_objects: filteredLayouts };
    }); 
  };
  // =========================================================

  const deleteObject = (id) => { 
    setTvSettings(prev => ({ ...prev, layout_objects: prev.layout_objects.filter(obj => obj.id !== id) })); 
    setSelectedObjId(null); 
  };

  const updateObjectDimensions = (id, newDims) => {
    updateObject(id, { dimensions: { ...tvSettings.layout_objects.find(o=>o.id===id).dimensions, ...newDims } });
  };

  const setExactRotation = (id, angleDegree) => {
    const rad = (angleDegree * Math.PI) / 180;
    updateObject(id, { rotation: { y: rad } });
  };

  const handleSaveAsTemplate = () => {
    if (!unitBox) return alert("請先選定戶號。");
    if (tvSettings.layout_objects.length === 0) return alert("畫布上沒有物件。");
    const templateName = prompt("請輸入佈局範本名稱:");
    if (!templateName) return;

    const center = new THREE.Vector3(); unitBox.getCenter(center);
    const templateObjects = tvSettings.layout_objects.map(obj => ({
      ...obj, relX: obj.position.x - center.x, relZ: obj.position.z - center.z, relY: obj.position.y - unitBox.min.y 
    }));
    setTvSettings(prev => ({ ...prev, savedTemplates: [...(prev.savedTemplates || []), { id: Date.now().toString(), name: templateName, objects: templateObjects }] }));
  };

  const handleApplyTemplate = () => {
    if (!unitBox) return alert("請先選定目標戶號。");
    if (!selectedTemplateId) return alert("請先選擇範本。");
    const template = tvSettings.savedTemplates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    const center = new THREE.Vector3(); unitBox.getCenter(center);
    const newObjects = template.objects.map(tObj => ({
      ...tObj, id: Date.now().toString() + Math.random().toString(36).substring(7),
      position: { x: center.x + tObj.relX, y: unitBox.min.y + tObj.relY, z: center.z + tObj.relZ }
    }));
    setTvSettings(prev => ({ ...prev, layout_objects: [...(prev.layout_objects || []), ...newObjects] }));
  };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') { setPlacementMode(null); document.body.style.cursor = 'auto'; } };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (!cameraControlRef.current || !scene) return;
    const { target3DUnit: selectedUnit, view3DMode: viewMode } = tvSettings;

    if (viewMode === 'global') {
      cameraControlRef.current.setLookAt(0, 80, 50, 0, 0, -30, true);
      setUnitBox(null);
    } else if (selectedUnit) {
      const box = new THREE.Box3(); box.makeEmpty(); let found = false;
      scene.traverse((c) => { if (c.isMesh && getSafeName(c.name).startsWith(selectedUnit)) { box.expandByObject(c); found = true; } });

      if (found) {
        setUnitBox(box); 
        const center = new THREE.Vector3(); box.getCenter(center);
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
  }, [tvSettings.target3DUnit, tvSettings.view3DMode, scene]);

  if (loading) return <div className="p-8"><Loader2 className="animate-spin text-orange-500" /></div>;
  const selectedObject = (tvSettings.layout_objects || []).find(o => o.id === selectedObjId);

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans h-[calc(100vh-80px)] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><MonitorPlay className="text-blue-600"/> 電視牆控制中心</h2>
        <div className="flex gap-3">
          <div className={`px-4 py-3 font-bold rounded-xl text-sm transition-all shadow-sm flex items-center gap-2 ${saving ? 'bg-orange-100 text-orange-700 animate-pulse' : 'bg-green-100 text-green-700'}`}>
            {saving ? <><Loader2 size={16} className="animate-spin"/> 正在同步至電視...</> : '✓ 已與電視同步'}
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition">
            <Save size={18}/> 強制寫入
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 bg-slate-100 p-2 rounded-2xl">
        <button onClick={() => setTvSettings(prev => ({...prev, mode: 'image'}))} className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${tvSettings.mode === 'image' ? 'bg-white shadow text-orange-600' : 'text-slate-500'}`}><Tv /> 照片輪播模式</button>
        <button onClick={() => setTvSettings(prev => ({...prev, mode: '3d'}))} className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${tvSettings.mode === '3d' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><Box /> 3D 互動規劃模式</button>
      </div>

      {tvSettings.mode === '3d' && (
        <div className="flex flex-col xl:flex-row gap-6 h-[800px]">
          <div className="w-full xl:w-80 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-hide">
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 shrink-0">
              <label className="block text-sm font-bold text-slate-500 mb-2">1. 編輯戶號與視角</label>
              <input type="text" value={tvSettings.target3DUnit} onChange={(e) => setTvSettings(prev => ({...prev, target3DUnit: e.target.value.toUpperCase()}))} placeholder="例如: A1-01" className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none uppercase font-bold mb-3" />
              <select value={tvSettings.view3DMode} onChange={(e) => setTvSettings(prev => ({...prev, view3DMode: e.target.value}))} className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-blue-500 outline-none font-bold">
                <option value="topdown">📐 佈局俯視 (推薦畫圖)</option>
                <option value="pano">🚶‍♂️ 室內漫遊</option>
                <option value="exterior">🏠 戶型外觀</option>
              </select>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl shrink-0">
              <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2"><Copy size={18}/> 佈局範本管理</h3>
              <button onClick={handleSaveAsTemplate} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm mb-3 hover:bg-indigo-700">將目前配置存為範本</button>
              {(tvSettings.savedTemplates || []).length > 0 && (
                <div className="flex gap-2">
                  <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="flex-1 p-2 border rounded-lg text-sm outline-none">
                    <option value="">選擇範本...</option>
                    {tvSettings.savedTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button onClick={handleApplyTemplate} className="px-3 bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-200" title="貼上佈局"><ClipboardPaste size={16}/></button>
                </div>
              )}
            </div>

            <div className={`p-5 rounded-2xl shadow-sm border-2 shrink-0 transition-all ${placementMode ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white'}`}>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PlusCircle size={18} className={placementMode ? 'text-orange-500 animate-spin' : 'text-slate-500'}/> 生成空間元素</h3>
              
              <div className="flex gap-2 mb-4">
                <button onClick={() => handleTypeChange('machine')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${newElement.type === 'machine' ? 'bg-orange-500 text-white' : 'bg-white text-slate-500'}`}>機台</button>
                <button onClick={() => handleTypeChange('power')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${newElement.type === 'power' ? 'bg-slate-500 text-white' : 'bg-white text-slate-500'}`}>電力</button>
                <button onClick={() => handleTypeChange('water')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${newElement.type === 'water' ? 'bg-blue-500 text-white' : 'bg-white text-slate-500'}`}>排水</button>
              </div>

              <input type="text" value={newElement.name} onChange={e=>setNewElement({...newElement, name: e.target.value})} className="w-full p-2 mb-3 border rounded focus:border-blue-500 outline-none text-sm" placeholder="自訂名稱" />

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div><label className="text-[10px] text-slate-400 font-bold">長度(M)</label><input type="number" value={newElement.l} onChange={e=>setNewElement({...newElement, l: Math.max(0.1, Number(e.target.value))})} className="w-full p-2 border rounded font-bold text-sm" step="0.5" /></div>
                <div><label className="text-[10px] text-slate-400 font-bold">寬度</label><input type="number" value={newElement.w} onChange={e=>setNewElement({...newElement, w: Math.max(0.1, Number(e.target.value))})} className="w-full p-2 border rounded font-bold text-sm" step="0.1" /></div>
                <div><label className="text-[10px] text-slate-400 font-bold">高度</label><input type="number" value={newElement.h} onChange={e=>setNewElement({...newElement, h: Math.max(0.1, Number(e.target.value))})} className="w-full p-2 border rounded font-bold text-sm" step="0.1" /></div>
              </div>

              <button onClick={placementMode ? () => setPlacementMode(null) : activatePlacementMode} className={`w-full py-3 rounded-lg font-bold text-sm transition ${placementMode ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                {placementMode ? '❌ 取消放置 (ESC)' : '🎯 準備放置 (單擊地板)'}
              </button>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 shrink-0">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><List size={18}/> 已放置清單</h3>
              {tvSettings.layout_objects?.length === 0 && <p className="text-[11px] text-slate-400">目前尚無放置任何物件</p>}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {(tvSettings.layout_objects || []).map(obj => (
                  <div key={obj.id} onClick={() => setSelectedObjId(obj.id)} className={`p-2 rounded-lg cursor-pointer border text-sm flex justify-between items-center transition ${selectedObjId === obj.id ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}>
                    <span className="font-bold truncate">{obj.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteObject(obj.id); }} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>

            {selectedObject && (
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl shrink-0 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-blue-900 truncate">{selectedObject.name}</h4>
                  <button onClick={() => deleteObject(selectedObject.id)} className="text-red-400 hover:text-red-600 p-1 bg-white rounded-md shadow-sm"><Trash2 size={16}/></button>
                </div>
                
                <div className="flex gap-2 bg-white p-1 rounded-lg border border-blue-100 shadow-sm mb-4">
                  <button onClick={() => setTransformMode('translate')} className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1 rounded ${transformMode === 'translate' ? 'bg-blue-500 text-white' : 'text-slate-500'}`}><Move size={14}/> 移動控制</button>
                  <button onClick={() => setTransformMode('rotate')} className={`flex-1 py-1.5 text-xs font-bold flex items-center justify-center gap-1 rounded ${transformMode === 'rotate' ? 'bg-blue-500 text-white' : 'text-slate-500'}`}><RotateCw size={14}/> 旋轉控制</button>
                </div>

                <div className="mb-4 bg-white p-2 rounded-lg border border-blue-100 shadow-sm">
                  <label className="block text-[10px] text-blue-800 font-bold mb-1">一鍵精準轉向</label>
                  <div className="flex gap-1">
                    <button onClick={() => setExactRotation(selectedObject.id, 0)} className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700">0°</button>
                    <button onClick={() => setExactRotation(selectedObject.id, 90)} className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700">90°</button>
                    <button onClick={() => setExactRotation(selectedObject.id, 180)} className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700">180°</button>
                    <button onClick={() => setExactRotation(selectedObject.id, 270)} className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700">270°</button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-[10px] text-blue-800 font-bold">修改長度</label><input type="number" value={selectedObject.dimensions.l} onChange={e=>updateObjectDimensions(selectedObject.id, { l: Math.max(0.1, Number(e.target.value)) })} className="w-full p-1 border border-blue-200 rounded text-sm font-bold" step="0.1" /></div>
                  <div><label className="text-[10px] text-blue-800 font-bold">修改寬度</label><input type="number" value={selectedObject.dimensions.w} onChange={e=>updateObjectDimensions(selectedObject.id, { w: Math.max(0.1, Number(e.target.value)) })} className="w-full p-1 border border-blue-200 rounded text-sm font-bold" step="0.1" /></div>
                  <div><label className="text-[10px] text-blue-800 font-bold">修改高度</label><input type="number" value={selectedObject.dimensions.h} onChange={e=>updateObjectDimensions(selectedObject.id, { h: Math.max(0.1, Number(e.target.value)) })} className="w-full p-1 border border-blue-200 rounded text-sm font-bold" step="0.1" /></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 bg-slate-900 rounded-3xl overflow-hidden relative shadow-inner">
            {placementMode && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-orange-500 text-white px-6 py-2 rounded-full font-black tracking-widest shadow-[0_0_20px_rgba(249,115,22,0.6)] animate-pulse pointer-events-none">
                📍 {placementMode.type==='power'||placementMode.type==='water' ? (!placementMode.startPoint?"點擊地板設【起點】":"點擊地板設【終點】") : `點擊廠房地板放置 (${placementMode.name})`}
              </div>
            )}
            
            <Canvas 
              camera={{ position: [0, 80, 50], fov: 80 }} 
              dpr={[1, 1.5]} 
              gl={{ powerPreference: "high-performance" }} 
              onPointerMissed={() => { 
                if (!placementMode && !isGlobalDraggingRef.current) setSelectedObjId(null); 
              }}
            >
              <CameraControls ref={cameraControlRef} makeDefault enabled={!isGlobalDragging} />
              <ambientLight intensity={0.6} />
              <directionalLight position={[100, 150, 50]} intensity={1.5} />
              <Environment preset="city" />
              <Suspense fallback={<Loader />}>
                <AdminFactoryModel selectedUnit={tvSettings.target3DUnit} placementMode={placementMode} onPlaceElement={handlePlaceElement} viewMode={tvSettings.view3DMode} onDeselect={() => { if(!isGlobalDraggingRef.current) setSelectedObjId(null); }} />
                {(tvSettings.layout_objects || []).map((obj) => (
                  <DraggableObject key={obj.id} obj={obj} isSelected={obj.id === selectedObjId} onSelect={setSelectedObjId} onUpdate={updateObject} transformMode={transformMode} setIsGlobalDragging={setIsGlobalDragging} unitBox={unitBox} />
                ))}
              </Suspense>
            </Canvas>
          </div>

        </div>
      )}
    </div>
  );
}