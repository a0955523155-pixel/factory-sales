import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';

const Contact = ({ agentName, agentPhone, lineId }) => {
  return (
    <section id="contact" className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-8">有興趣嗎？立即預約賞屋</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 shadow-sm">
          <p className="text-xl mb-6">專案負責人：<span className="font-bold text-2xl text-gray-800">{agentName}</span></p>
          
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <a href={`tel:${agentPhone}`} className="flex items-center justify-center gap-2 bg-red-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-red-700 transition">
              <Phone /> 撥打電話 {agentPhone}
            </a>
            <a href={`https://line.me/ti/p/${lineId}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-[#06C755] text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#05b34c] transition">
              <MessageCircle /> 加 LINE 詢問
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;