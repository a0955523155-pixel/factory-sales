import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { safeStr, compressImage } from '../../utils/adminHelpers';
// FIX: 加入 Upload
import { 
  Trash2, FileText, Sparkles, GripVertical, ChevronUp, ChevronDown, RefreshCcw, Copy, Globe, Image as ImageIcon, MessageSquare, Upload 
} from 'lucide-react';

// ★★★ 1. 引入 ReactQuill 編輯器與樣式 ★★★
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const AI_ENGINE = {
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  generateTitles: (baseTopic, category) => {
    if (category === 'academy') return [`【房產小學堂】${baseTopic} 是什麼？`, `買房必看！${baseTopic} 注意事項`, `新手誤區！關於 ${baseTopic}，你可能想錯了`];
    if (category === 'news_project') return [`【熱銷捷報】${baseTopic} 詢問度破表`, `${baseTopic} 為什麼這麼紅？`, `震撼登場！${baseTopic} 打造區域新地標`];
    return [`【區域利多】${baseTopic} 建設啟動`, `交通大躍進！${baseTopic} 將帶動周邊發展`, `產業進駐！${baseTopic} 成為南台灣新亮點`];
  },
  // 修改生成內容為 HTML 格式
  generateContent: (title, category) => `<p><strong>【${title.replace(/<[^>]*>?/gm, '')}】</strong></p><p><br></p><p><span style="background-color: rgb(255, 255, 0);"><em>(AI 自動生成草稿)</em></span></p><p>隨著市場需求增加，本區域關注度持續上升。詳細內容請補充...</p>`,
  generateImagePrompt: (title, category) => `High quality architectural photography of ${title.replace(/<[^>]*>?/gm, '')}, cinematic lighting, 4k`
};

const ArticlePanel = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [editArticleId, setEditArticleId] = useState(null);
  const [articleForm, setArticleForm] = useState({ category: 'news_local', title: '', content: '', date: '', image: '' });
  
  const [aiTitleSuggestions, setAiTitleSuggestions] = useState([]);
  const [aiImagePrompt, setAiImagePrompt] = useState('');
  
  const dragItem = useRef(); 
  const dragOverItem = useRef();

  // ★★★ 2. 設定編輯器的工具列模組 ★★★
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }], 
      [{ 'size': ['small', false, 'large', 'huge'] }], 
      ['bold', 'italic', 'underline', 'strike'], 
      [{ 'color': [] }, { 'background': [] }], 
      [{ 'list': 'ordered'}, { 'list': 'bullet' }], 
      ['clean'] 
    ]
  };

  // 標題專用的簡單工具列
  const titleModules = {
    toolbar: [
      ['bold'], 
      [{ 'size': ['large', 'huge'] }], 
      ['clean']
    ]
  };

  const fetchArticles = async () => { 
      try { 
          const snap = await getDocs(collection(db, "articles")); 
          const list = []; 
          snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() })); 
          list.sort((a, b) => { if (a.order !== undefined && b.order !== undefined) return a.order - b.order; return (b.createdAt || 0) - (a.createdAt || 0); }); 
          setArticles(list); 
      } catch (e) {} 
  };

  useEffect(() => { fetchArticles(); }, []);

  const handleUpload = async (e, callback) => { 
      const file = e.target.files[0]; if (!file) return; 
      setCompressing(true); 
      try { const compressed = await compressImage(file); callback(compressed); } catch (e) {} 
      setCompressing(false); 
  };

  const loadEditArticle = (item) => { 
      setEditArticleId(item.id); setArticleForm({ ...item }); setAiTitleSuggestions([]); setAiImagePrompt(''); 
  };

  const handleArticleSubmit = async (e) => { 
      e.preventDefault(); setLoading(true); 
      const payload = { ...articleForm, createdAt: Date.now(), updatedAt: new Date(), order: -Date.now() }; 
      if (editArticleId) { delete payload.order; await updateDoc(doc(db, "articles", editArticleId), payload); } else { await addDoc(collection(db, "articles"), payload); } 
      alert("發布成功"); setArticleForm({ category: 'news_local', title: '', content: '', date: '', image: '' }); setEditArticleId(null); fetchArticles(); setLoading(false); 
  };

  const handleDeleteArticle = async (id) => { 
      if (!window.confirm("刪除？")) return; await deleteDoc(doc(db, "articles", id)); fetchArticles(); 
  };

  const handleGenerateTitles = () => { 
    // 去除標題中的 HTML 標籤再生成
    const plainTitle = articleForm.title.replace(/<[^>]*>?/gm, '') || "房地產";
    setAiTitleSuggestions(AI_ENGINE.generateTitles(plainTitle, articleForm.category)); 
  };
  const handleGenerateContent = () => { 
    if (!articleForm.title) return alert("請先輸入標題"); 
    setArticleForm(prev => ({ ...prev, content: AI_ENGINE.generateContent(articleForm.title, articleForm.category) })); 
  };
  const handleGenerateImagePrompt = () => { 
    if (!articleForm.title) return alert("請先輸入標題"); 
    setAiImagePrompt(AI_ENGINE.generateImagePrompt(articleForm.title, articleForm.category)); 
  };
  
  const handleArticleMaterialSearch = () => {
    const title = articleForm.title.replace(/<[^>]*>?/gm, '') || "房地產";
    let query = articleForm.category === 'academy' ? `${title} 法規 懶人包 稅制 解釋函令` : articleForm.category === 'news_project' ? `${title} 接待中心 示意圖 房價` : `${title} 建設 完工示意圖 重劃區`;
    window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, '_blank');
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
  };

  const moveArticle = async (index, direction) => { 
      const newItems = [...articles]; 
      if (direction === 'up' && index > 0) { [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]]; } 
      else if (direction === 'down' && index < newItems.length - 1) { [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]; } 
      else { return; } 
      setArticles(newItems); saveOrder(newItems); 
  };
  
  const saveOrder = async (items) => { 
      try { const batch = writeBatch(db); items.forEach((item, index) => { const ref = doc(db, "articles", item.id); batch.update(ref, { order: index }); }); await batch.commit(); } catch (e) {} 
  };
  
  const resetOrderToDate = async () => { 
      if (!window.confirm("重排？")) return; 
      const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date)); 
      setArticles(sorted); saveOrder(sorted); 
  };
  
  const handleDragStart = (e, position) => { dragItem.current = position; };
  const handleDragEnter = (e, position) => { dragOverItem.current = position; };
  const handleDragEnd = async () => { 
      const copyListItems = [...articles]; 
      const dragItemContent = copyListItems[dragItem.current]; 
      copyListItems.splice(dragItem.current, 1); 
      copyListItems.splice(dragOverItem.current, 0, dragItemContent); 
      dragItem.current = null; dragOverItem.current = null; 
      setArticles(copyListItems); saveOrder(copyListItems); 
  };

  const inputStyle = "w-full bg-white border border-slate-300 text-slate-800 p-3 md:p-2.5 text-base md:text-sm focus:outline-none focus:border-orange-500 rounded-lg shadow-sm transition placeholder:text-slate-300";
  const labelStyle = "block text-xs font-bold text-slate-500 mb-1.5 tracking-wider uppercase";

  return (
    <div className="flex flex-col md:flex-row h-full">
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 bg-white p-4 overflow-y-auto shrink-0 max-h-[40vh] md:max-h-full">
            <button onClick={() => {setEditArticleId(null); setArticleForm({ category: 'news_local', title: '', content: '', date: '', image: '' });}} className="w-full bg-slate-900 text-white py-3 rounded-lg mb-4 text-sm font-bold shadow hover:bg-black transition">+ 撰寫新文章</button>
            <div className="space-y-2">
            <div className="flex justify-between items-center mb-2 px-1"><p className="text-xs text-slate-400">排序</p><button onClick={resetOrderToDate} className="text-[10px] flex items-center gap-1 text-blue-500 hover:underline"><RefreshCcw size={10}/> 重排</button></div>
            {articles.map((a, index) => (
                <div key={a.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragEnter={(e) => handleDragEnter(e, index)} onDragEnd={handleDragEnd} onClick={()=>loadEditArticle(a)} className={`p-3 border mb-2 rounded-xl cursor-grab active:cursor-grabbing transition relative group flex items-center gap-3 ${editArticleId===a.id ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-slate-300'}`}>
                <div className="flex flex-col gap-1 md:hidden"><button onClick={(e) => { e.stopPropagation(); moveArticle(index, 'up'); }} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><ChevronUp size={12}/></button><button onClick={(e) => { e.stopPropagation(); moveArticle(index, 'down'); }} className="p-1 bg-slate-100 rounded hover:bg-slate-200"><ChevronDown size={12}/></button></div><GripVertical size={16} className="text-slate-300 hidden md:block"/>
                {/* 列表標題使用 dangerouslySetInnerHTML 以正確顯示樣式 */}
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full text-white font-bold inline-block mb-1 ${a.category==='academy'?'bg-purple-500':a.category==='news_project'?'bg-green-500':'bg-blue-500'}`}>{a.category==='academy'?'小學堂':a.category==='news_project'?'建案':'新聞'}</span>
                  <div className="font-bold text-slate-800 line-clamp-1 text-sm" dangerouslySetInnerHTML={{ __html: a.title }} />
                </div>
                <button onClick={(e) => {e.stopPropagation(); handleDeleteArticle(a.id);}} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
            ))}
            </div>
        </div>
        
        <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-50">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-8"><h2 className="text-2xl md:text-3xl font-black">{editArticleId ? '編輯文章' : '新增文章'}</h2><button onClick={handleArticleSubmit} disabled={loading} className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-500 shadow-lg transition text-sm">{loading ? "發布中..." : "確認發布"}</button></div>
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelStyle}>文章分類</label>
                        <select value={articleForm.category} onChange={e=>setArticleForm({...articleForm, category: e.target.value})} className={inputStyle}>
                            <option value="news_local">最新消息-地方新聞</option>
                            <option value="news_project">最新消息-建案新訊</option>
                            <option value="academy">房地產小學堂 (QA)</option>
                        </select>
                    </div>
                    <div><label className={labelStyle}>發布日期</label><input type="date" value={articleForm.date} onChange={e=>setArticleForm({...articleForm, date: e.target.value})} className={inputStyle}/></div>
                </div>
                
                <div>
                    <label className={labelStyle}>文章標題 (支援粗體與大小)</label>
                    <div className="bg-white rounded-lg border border-slate-300 overflow-hidden mb-2">
                      <ReactQuill 
                        theme="snow" 
                        modules={titleModules}
                        value={articleForm.title || ''} 
                        onChange={(val) => setArticleForm({...articleForm, title: val})} 
                        placeholder="請輸入標題..."
                      />
                    </div>
                    <button onClick={handleGenerateTitles} className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition flex items-center gap-1 text-xs"><Sparkles size={14}/> AI 靈感標題</button>
                    
                    {aiTitleSuggestions.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-2 bg-purple-50 p-3 rounded-xl border border-purple-100">
                        <span className="text-xs font-bold text-purple-800 flex items-center gap-1"><Sparkles size={12}/> AI 推薦標題 (點擊帶入)</span>
                        {aiTitleSuggestions.map((t, i) => (
                        <button key={i} onClick={() => { setArticleForm({...articleForm, title: t}); setAiTitleSuggestions([]); }} className="text-left text-sm text-slate-700 hover:text-purple-700 hover:bg-white p-2 rounded transition border border-transparent hover:border-purple-200">{t}</button>
                        ))}
                    </div>
                    )}
                </div>

                <div className="relative"> 
                    <div className="flex justify-between items-center mb-1"> 
                    <label className={labelStyle}>文章內容</label> 
                    <div className="flex gap-2">
                        <button type="button" onClick={handleArticleMaterialSearch} className="text-xs bg-blue-50 text-blue-600 font-bold px-3 py-1 rounded flex items-center gap-1 hover:bg-blue-100"><Globe size={12}/> 找素材</button>
                        <button type="button" onClick={handleGenerateContent} className="text-xs bg-purple-50 text-purple-600 font-bold px-3 py-1 rounded flex items-center gap-1 hover:bg-purple-100"><MessageSquare size={12}/> 生成文案</button>
                    </div>
                    </div> 

                    <div className="bg-white rounded-lg border border-slate-300 overflow-hidden">
                      <ReactQuill 
                        theme="snow" 
                        modules={quillModules}
                        value={articleForm.content || ''} 
                        onChange={(content) => setArticleForm({...articleForm, content: content})} 
                        style={{ height: '400px', marginBottom: '40px' }} 
                        placeholder="輸入內容，可使用上方工具列調整粗體、顏色與標題大小..."
                      />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <label className={labelStyle}>封面圖片 (自動壓浮水印)</label>
                    <div className="mb-2 flex items-center gap-2">
                        <button onClick={handleGenerateImagePrompt} className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1 rounded flex items-center gap-1 hover:bg-green-100 border border-green-200"><ImageIcon size={12}/> 生成中文詠唱詞 (Gemini/Midjourney)</button>
                    </div>
                    {aiImagePrompt && (
                    <div className="bg-slate-800 text-slate-300 p-3 rounded-lg text-xs font-mono mb-4 relative group">
                        {aiImagePrompt}
                        <button onClick={()=>{navigator.clipboard.writeText(aiImagePrompt); alert("已複製！");}} className="absolute top-2 right-2 bg-white/10 p-1.5 rounded hover:bg-white/20 text-white"><Copy size={12}/></button>
                    </div>
                    )}
                    <div className="flex items-center gap-4"><label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-bold text-slate-600 transition"><Upload size={16}/> 上傳圖片 <input type="file" className="hidden" onChange={e=>handleUpload(e, (url)=>setArticleForm({...articleForm, image: url}))}/></label>{articleForm.image && <img src={articleForm.image} className="h-20 w-32 object-cover rounded-lg border border-slate-200 shadow-sm"/>}</div>
                </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ArticlePanel;