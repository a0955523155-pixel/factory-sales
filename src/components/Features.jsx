import React from 'react';
import { Star } from 'lucide-react'; // 預設圖標

const Features = ({ features }) => {
  return (
    <section className="py-20 bg-slate-900">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-12 text-center">
          Key <span className="text-orange-600">Features</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center p-6 bg-slate-950 border border-slate-800 hover:border-orange-500/30 transition duration-500 group">
              <div className="w-16 h-16 rounded-full border-2 border-slate-700 flex items-center justify-center mb-6 group-hover:border-orange-500 group-hover:text-orange-500 text-slate-400 transition duration-500">
                <Star size={28} /> {/* 這裡簡化處理，如果要動態圖標需要另外寫 mapping */}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{item.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;