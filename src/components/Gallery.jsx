import React from 'react';

const Gallery = ({ images }) => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-10">廠房實景</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 這裡先用簡單的 map 顯示圖片，如果沒有圖片連結會顯示灰色區塊 */}
          {images.map((img, index) => (
            <div key={index} className="aspect-video bg-gray-300 rounded-xl overflow-hidden shadow-lg relative">
               {/* 實際使用時這裡會是 <img src={img} ... /> */}
               <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                 圖片 {index + 1} (需放入 public/images 資料夾)
               </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;