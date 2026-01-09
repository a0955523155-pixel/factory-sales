import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { MapPin, ArrowRight } from 'lucide-react';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "properties"));
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setProperties(list);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar phone="0912-345-678" /> 
      
      {/* 頂部標題區 */}
      <div className="pt-32 pb-12 px-6 max-w-7xl mx-auto w-full border-b border-slate-800 mb-12">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight uppercase">
          Available <span className="text-orange-600">Assets</span>
        </h1>
        <p className="text-slate-500 text-lg font-mono max-w-2xl">
          // 嚴選優質工業地產數據庫，為您的企業尋找最佳生產基地。
        </p>
      </div>
      
      <div className="flex-grow px-6 max-w-7xl mx-auto w-full pb-20">
        {loading ? (
          <div className="text-orange-500 font-mono text-xl animate-pulse">LOADING DATA...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((item) => (
              <Link to={`/property/${item.id}`} key={item.id} className="group block bg-slate-900 border border-slate-800 hover:border-orange-500/50 transition duration-500 relative overflow-hidden">
                
                {/* 圖片區塊 - 滑鼠移過去圖片會稍微放大 */}
                <div className="h-64 overflow-hidden relative border-b border-slate-800">
                  <img 
                    src={item.basicInfo?.thumb || "https://via.placeholder.com/400x300?text=No+Image"} 
                    alt={item.basicInfo?.title} 
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-110 filter brightness-90 group-hover:brightness-100"
                  />
                  {/* 價格標籤 */}
                  <div className="absolute top-0 right-0 bg-orange-600 text-white font-mono font-bold px-4 py-2 text-lg">
                    {item.basicInfo?.price}
                  </div>
                  {/* ID 標籤 */}
                  <div className="absolute bottom-0 left-0 bg-slate-950/80 backdrop-blur text-xs text-slate-400 font-mono px-3 py-1 border-t border-r border-slate-700">
                    ID: {item.id.substring(0, 6).toUpperCase()}
                  </div>
                </div>

                {/* 內容區塊 */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-500 transition line-clamp-1">
                    {item.basicInfo?.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-6 border-b border-slate-800 pb-4">
                    <MapPin size={14} />
                    {item.basicInfo?.address}
                  </div>

                  {/* 簡易規格 Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {item.specs && item.specs.slice(0, 2).map((spec, idx) => ( // 只顯示前兩項
                      <div key={idx}>
                         <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{spec.label}</p>
                         <p className="text-lg font-bold text-gray-200 font-mono">{spec.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-sm font-bold text-orange-500 uppercase tracking-widest group-hover:translate-x-2 transition-transform duration-300">
                    View Details <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Home;