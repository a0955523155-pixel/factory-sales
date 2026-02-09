import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Wand2, ChevronLeft, ChevronRight, Download, Image as ImageIcon, Loader2, Users, Save, Plus, Trash2, ArrowUp, ArrowDown, Key } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

const DEFAULT_MEMBERS = ["余珮婷", "侯彥旭", "李晙揚", "蘇昱誠"];

const SchedulePanel = () => {
  const [scheduleData, setScheduleData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // ★★★ 修改：新增 startMemberIndexSunday (週日起始人員) ★★★
  const [autoBatch, setAutoBatch] = useState({ 
    startDate: '', 
    days: 30, 
    startMemberIndex: 0,       // 平日輪序起始
    startMemberIndexSunday: 0  // 週日輪序起始
  });
  
  const [teamMembers, setTeamMembers] = useState(DEFAULT_MEMBERS);
  const [memberIds, setMemberIds] = useState({});
  
  const [newMemberName, setNewMemberName] = useState("");
  const [isEditingMembers, setIsEditingMembers] = useState(false);
  const [exportingImg, setExportingImg] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "schedule"));
        if (docSnap.exists()) setScheduleData(docSnap.data());

        const teamSnap = await getDoc(doc(db, "settings", "team"));
        if (teamSnap.exists()) {
          const data = teamSnap.data();
          if (data.members) setTeamMembers(data.members);
          if (data.ids) setMemberIds(data.ids);
        }
      } catch (e) { console.error("Fetch error", e); }
    };
    fetchData();
  }, []);

  // --- 成員管理邏輯 ---
  const handleSaveMembers = async () => {
    try {
      await setDoc(doc(db, "settings", "team"), { 
        members: teamMembers,
        ids: memberIds 
      }, { merge: true });
      alert("團隊名單與 LINE ID 已儲存！");
      setIsEditingMembers(false);
    } catch (e) { alert("儲存失敗"); console.error(e); }
  };

  const updateMemberId = (name, id) => {
    setMemberIds(prev => ({ ...prev, [name]: id }));
  };

  const moveMember = (index, direction) => {
    const newMembers = [...teamMembers];
    if (direction === 'up' && index > 0) {
      [newMembers[index], newMembers[index - 1]] = [newMembers[index - 1], newMembers[index]];
    } else if (direction === 'down' && index < newMembers.length - 1) {
      [newMembers[index], newMembers[index + 1]] = [newMembers[index + 1], newMembers[index]];
    }
    setTeamMembers(newMembers);
  };

  const addMember = () => {
    if (!newMemberName.trim()) return;
    setTeamMembers([...teamMembers, newMemberName.trim()]);
    setNewMemberName("");
  };

  const removeMember = (index) => {
    if (!window.confirm("確定移除此成員？")) return;
    const nameToRemove = teamMembers[index];
    const newMembers = teamMembers.filter((_, i) => i !== index);
    setTeamMembers(newMembers);
    const newIds = { ...memberIds };
    delete newIds[nameToRemove];
    setMemberIds(newIds);
  };

  // --- ★★★ 核心修改：排班邏輯 (週日獨立) ★★★ ---
  const handleBatchSchedule = async () => {
    if (!autoBatch.startDate) return alert("請選擇開始日期");
    if (teamMembers.length === 0) return alert("沒有團隊成員可排班");

    const newSchedule = { ...scheduleData };
    let currentDate = new Date(autoBatch.startDate);
    
    // 設定兩個獨立的計數器
    let weekdayIndex = parseInt(autoBatch.startMemberIndex);      // 用於週一到週六
    let sundayIndex = parseInt(autoBatch.startMemberIndexSunday); // 用於週日
    
    for (let i = 0; i < autoBatch.days; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay(); // 0 是週日, 1-6 是週一到週六

      if (dayOfWeek === 0) {
        // ★ 如果是週日：使用週日專用輪序
        newSchedule[dateStr] = teamMembers[sundayIndex % teamMembers.length];
        sundayIndex++; // 只有週日計數器往前
      } else {
        // ★ 如果是平日(週一至週六)：使用平日輪序
        newSchedule[dateStr] = teamMembers[weekdayIndex % teamMembers.length];
        weekdayIndex++; // 只有平日計數器往前
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setScheduleData(newSchedule);
    await setDoc(doc(db, "settings", "schedule"), newSchedule);
    alert(`已完成排班！\n週一至週六：依序輪值\n週日：獨立依序輪值`);
  };

  const handleDayChange = async (dateStr, member) => {
    const newSchedule = { ...scheduleData, [dateStr]: member };
    setScheduleData(newSchedule);
    await setDoc(doc(db, "settings", "schedule"), newSchedule);
  };

  const handleExportExcel = () => {
    if (Object.keys(scheduleData).length === 0) return alert("無資料可匯出");
    const dataToExport = Object.entries(scheduleData)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([date, member]) => {
        const d = new Date(date);
        const days = ['日','一','二','三','四','五','六'];
        return { "日期": date, "星期": days[d.getDay()], "值班人員": member };
      });
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "排班表");
    XLSX.writeFile(wb, `綠芽團隊排班_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportImage = async () => {
    if (!calendarRef.current) return;
    setExportingImg(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const canvas = await html2canvas(calendarRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff',
        ignoreElements: (element) => element.classList.contains('no-print')
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `綠芽團隊_${currentMonth.getFullYear()}年${currentMonth.getMonth()+1}月班表.png`;
      link.click();
    } catch (error) { console.error(error); alert("圖片生成失敗"); }
    setExportingImg(false);
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const days = Array(startDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        days.push({ day: i, dateStr, member: scheduleData[dateStr] || '' });
    }
    return days;
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full overflow-y-auto">
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-black">排班管理系統</h1>
        <div className="flex gap-2">
            <button onClick={handleExportExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 shadow-md transition text-sm">
                <Download size={16}/> Excel
            </button>
            <button onClick={handleExportImage} disabled={exportingImg} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md transition text-sm">
                {exportingImg ? <Loader2 size={16} className="animate-spin"/> : <ImageIcon size={16}/>}
                匯出圖片
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* 左側：團隊排序管理 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800"><Users size={20} className="text-blue-600"/> 團隊設定</h3>
                {!isEditingMembers ? (
                    <button onClick={()=>setIsEditingMembers(true)} className="text-xs bg-slate-100 px-3 py-1 rounded hover:bg-slate-200 font-bold">編輯 ID 與排序</button>
                ) : (
                    <button onClick={handleSaveMembers} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 font-bold flex items-center gap-1"><Save size={12}/> 儲存全部</button>
                )}
            </div>
            
            <div className="space-y-3 mb-4">
                {teamMembers.map((member, index) => (
                    <div key={index} className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">{index + 1}. {member}</span>
                            {isEditingMembers && (
                                <div className="flex gap-1">
                                    <button onClick={()=>moveMember(index, 'up')} disabled={index===0} className="p-1 hover:bg-white rounded text-slate-400 hover:text-blue-600 disabled:opacity-30"><ArrowUp size={14}/></button>
                                    <button onClick={()=>moveMember(index, 'down')} disabled={index===teamMembers.length-1} className="p-1 hover:bg-white rounded text-slate-400 hover:text-blue-600 disabled:opacity-30"><ArrowDown size={14}/></button>
                                    <button onClick={()=>removeMember(index)} className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                            )}
                        </div>
                        {isEditingMembers && (
                            <div className="flex items-center gap-2">
                                <Key size={12} className="text-slate-400"/>
                                <input 
                                    value={memberIds[member] || ""} 
                                    onChange={(e) => updateMemberId(member, e.target.value)} 
                                    placeholder="貼上 LINE User ID (U...)" 
                                    className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-600 outline-none focus:border-blue-500"
                                />
                            </div>
                        )}
                        {!isEditingMembers && memberIds[member] && (
                            <div className="text-[10px] text-green-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> 已綁定 ID: {memberIds[member].substring(0, 4)}...
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {isEditingMembers && (
                <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <input value={newMemberName} onChange={e=>setNewMemberName(e.target.value)} placeholder="新成員姓名" className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500"/>
                    <button onClick={addMember} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"><Plus size={16}/></button>
                </div>
            )}
        </div>
      
        {/* 右側：批量工具 (更新版) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800"><Wand2 size={20} className="text-purple-600"/> 一鍵智慧排班 (平日/假日分流)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* 第一行：日期設定 */}
                <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">開始日期</label>
                    <input type="date" value={autoBatch.startDate} onChange={e=>setAutoBatch({...autoBatch, startDate: e.target.value})} className="border p-2 rounded w-full bg-slate-50 outline-none focus:border-purple-500" />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">產生天數</label>
                    <input type="number" value={autoBatch.days} onChange={e=>setAutoBatch({...autoBatch, days: parseInt(e.target.value)})} className="border p-2 rounded w-full bg-slate-50 outline-none focus:border-purple-500" />
                </div>
                
                {/* 第二行：人員設定 */}
                <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">週一至週六 起始人員</label>
                    <select value={autoBatch.startMemberIndex} onChange={e=>setAutoBatch({...autoBatch, startMemberIndex: e.target.value})} className="border p-2 rounded w-full bg-slate-50 cursor-pointer outline-none focus:border-purple-500">
                        {teamMembers.map((m, i)=><option key={m} value={i}>{m}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-red-400 block mb-1">週日 起始人員 (獨立輪序)</label>
                    <select value={autoBatch.startMemberIndexSunday} onChange={e=>setAutoBatch({...autoBatch, startMemberIndexSunday: e.target.value})} className="border p-2 rounded w-full bg-red-50 border-red-100 cursor-pointer outline-none focus:border-red-500 text-red-700 font-bold">
                        {teamMembers.map((m, i)=><option key={m} value={i}>{m}</option>)}
                    </select>
                </div>
            </div>

            <button onClick={handleBatchSchedule} className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-purple-700 shadow transition active:scale-95 flex justify-center items-center gap-2">
                <Wand2 size={18}/> 開始自動排班
            </button>
            
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                <p>說明：系統會自動將「平日」與「週日」分開輪替。例如：週六排完 A，下週一會接續排 B；週日則會依照您指定的順序獨立循環。</p>
            </div>
        </div>
      </div>

      {/* 月曆截圖區塊 (ref={calendarRef}) */}
      <div ref={calendarRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 bg-slate-900 text-white">
           <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 hover:bg-white/20 rounded-full transition no-print"><ChevronLeft/></button>
           <div className="text-center">
             <h2 className="text-2xl font-black tracking-widest">{currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月</h2>
             <p className="text-xs text-slate-400 font-bold tracking-widest mt-1 uppercase">Duty Schedule</p>
           </div>
           <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 hover:bg-white/20 rounded-full transition no-print"><ChevronRight/></button>
        </div>

        <div className="grid grid-cols-7 text-center bg-slate-50 text-xs font-bold text-slate-500 py-3 border-b border-slate-200">
            {['週日','週一','週二','週三','週四','週五','週六'].map((d, i) => (
                <div key={d} className={i===0 ? "text-red-500" : ""}>{d}</div>
            ))}
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-200 gap-[1px]"> 
           {generateCalendarDays().map((d, i) => (
              <div key={i} className={`min-h-[120px] p-3 flex flex-col justify-between transition ${!d ? 'bg-slate-50' : 'bg-white hover:bg-orange-50/10'}`}>
                 {d && (
                    <>
                       <div className="flex justify-between items-start">
                          <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${new Date().toISOString().split('T')[0] === d.dateStr ? 'bg-slate-900 text-white' : (new Date(d.dateStr).getDay() === 0 ? 'text-red-500 bg-red-50' : 'text-slate-400')}`}>{d.day}</span>
                          {!d.member && <div className="w-2 h-2 bg-red-400 rounded-full no-print" title="未排班"></div>}
                       </div>
                       
                       <div className="mt-2">
                          <select 
                            value={d.member} 
                            onChange={(e) => handleDayChange(d.dateStr, e.target.value)} 
                            className={`w-full text-center font-bold bg-transparent outline-none cursor-pointer appearance-none py-1 rounded text-base truncate ${d.member ? 'text-slate-800' : 'text-slate-300'}`}
                            style={{textAlignLast: 'center'}}
                          >
                             <option value="">(空)</option>
                             {teamMembers.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          {d.member && <div className="flex justify-center mt-1"><div className="h-1 w-8 bg-orange-500 rounded-full opacity-50"></div></div>}
                       </div>
                    </>
                 )}
              </div>
           ))}
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span>Green Bud Team</span>
            <span>Generated on {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default SchedulePanel;