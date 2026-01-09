import React from 'react';

const Hero = ({ data }) => {
  return (
    <div className="relative h-[80vh] w-full bg-gray-900 text-white">
      {/* 背景圖 (建議加上遮罩讓文字更清楚) */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: `url(${data.images[0]})` }}
      />
      <div className="absolute inset-0 bg-black/40" /> {/* 黑色遮罩 */}

      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-wider">
          {data.basicInfo.title}
        </h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-8">
          {data.basicInfo.subtitle}
        </p>
        <div className="flex gap-4">
          <a href="#contact" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold transition">
            預約賞屋
          </a>
          <span className="bg-white/20 backdrop-blur px-8 py-3 rounded-lg font-bold border border-white/30">
            售價：{data.basicInfo.price}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Hero;