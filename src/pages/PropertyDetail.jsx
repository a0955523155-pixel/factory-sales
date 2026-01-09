import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore'; // 引入讀取「單筆」資料的指令

import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Specs from '../components/Specs';
import Features from '../components/Features';
import Gallery from '../components/Gallery';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

const PropertyDetail = () => {
  const { id } = useParams(); // 取得網址上的 ID
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSingleProperty = async () => {
      try {
        const docRef = doc(db, "properties", id); // 鎖定該 ID 的文件
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setData(docSnap.data());
        } else {
          console.log("找不到該文件！");
        }
      } catch (error) {
        console.error("讀取錯誤:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSingleProperty();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center">載入中...</div>;

  if (!data) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">找不到此案場 (可能已被刪除)</h2>
        <Link to="/" className="text-red-600 underline">回首頁</Link>
      </div>
    );
  }

  // 確保資料結構存在，避免報錯 (Optional Chaining)
  return (
    <div className="font-sans antialiased text-gray-900 pb-16 md:pb-0">
      <Navbar phone={data.basicInfo?.agentPhone} />
      
      <Hero data={data} />
      {/* 這裡要確保你的 Admin 儲存時有存 specs 和 features 陣列，不然會是空的 */}
      <Specs specs={data.specs || []} />
      <Features features={data.features || []} />
      <Gallery images={data.images || []} />
      
      <Contact 
        agentName={data.basicInfo?.agentName}
        agentPhone={data.basicInfo?.agentPhone}
        lineId={data.basicInfo?.lineId}
      />
      
      <Footer />
    </div>
  );
};

export default PropertyDetail;