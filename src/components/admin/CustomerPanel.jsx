import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trash2 } from 'lucide-react';

const CustomerPanel = () => {
  const [customers, setCustomers] = useState([]);
  const [teamMembers, setTeamMembers] = useState(["余珮婷", "侯彥旭", "李晙揚", "蘇昱誠"]); // 預設值

  const fetchCustomers = async () => {
    try {
      const snap = await getDocs(collection(db, "customers"));
      const list = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCustomers(list);
    } catch (e) {}
  };

  // ★★★ 新增：抓取最新的團隊名單 ★★★
  const fetchTeamMembers = async () => {
    try {
      const docSnap = await getDoc(doc(db, "settings", "team"));
      if (docSnap.exists() && docSnap.data().members) {
        setTeamMembers(docSnap.data().members);
      }
    } catch (e) {}
  };

  useEffect(() => { 
    fetchCustomers(); 
    fetchTeamMembers(); 
  }, []);

  const handleAssign = async (id, member) => {
    if(!window.confirm(`確定指派給 ${member} 嗎？`)) return;
    await updateDoc(doc(db, "customers", id), { assignedTo: member });
    fetchCustomers();
  };

  const handleDelete = async (id) => {
    if(!window.confirm("確定刪除此客戶資料？")) return;
    await deleteDoc(doc(db, "customers", id));
    fetchCustomers();
  };

  return (
    <div className="p-6 md:p-10 w-full max-w-7xl mx-auto overflow-y-auto">
      <h1 className="text-2xl md:text-3xl font-black mb-8">客戶諮詢資料表</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
            <tr><th className="p-5">日期</th><th className="p-5">姓名</th><th className="p-5">電話</th><th className="p-5">需求</th><th className="p-5">負責人員</th><th className="p-5 text-right">操作</th></tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-orange-50/50 transition">
                <td className="p-5 font-mono text-slate-400">{new Date(c.createdAt?.seconds * 1000).toLocaleDateString()}</td>
                <td className="p-5 font-bold text-slate-800">{c.name}</td>
                <td className="p-5 text-orange-600 font-bold">{c.phone}</td>
                <td className="p-5"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">{c.needs}</span></td>
                <td className="p-5">
                  <select value={c.assignedTo || '未指派'} onChange={(e)=>handleAssign(c.id, e.target.value)} className={`bg-transparent font-bold cursor-pointer outline-none ${c.assignedTo ? 'text-blue-600' : 'text-slate-400'}`}>
                    <option value="未指派">未指派</option>
                    {teamMembers.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </td>
                <td className="p-5 text-right"><button onClick={()=>handleDelete(c.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerPanel;