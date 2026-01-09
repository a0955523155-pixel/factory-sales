import React from 'react';

const Specs = ({ specs }) => {
  return (
    <section className="py-20 bg-slate-950 border-t border-slate-900">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-end gap-4 mb-10 border-b border-slate-800 pb-4">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            Technical <span className="text-slate-600">Specs</span>
          </h2>
          <span className="font-mono text-orange-500 text-sm mb-1">// 物件詳細規格表</span>
        </div>

        {/* 表格排版 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-slate-800">
          {specs.map((item, index) => (
            <div key={index} className="border-r border-b border-slate-800 p-8 hover:bg-slate-900/50 transition duration-300 group">
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2 group-hover:text-orange-500 transition">
                {item.label}
              </p>
              <p className="text-3xl font-bold text-white font-mono">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Specs;