import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';

const FloatingCTA = ({ phone, lineId }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full z-50 flex md:hidden">
      <a href={`tel:${phone}`} className="flex-1 bg-red-600 text-white py-4 flex justify-center items-center gap-2 font-bold">
        <Phone size={20} /> 撥打電話
      </a>
      <a href={`https://line.me/ti/p/${lineId}`} className="flex-1 bg-green-500 text-white py-4 flex justify-center items-center gap-2 font-bold">
        <MessageCircle size={20} /> 加LINE詢問
      </a>
    </div>
  );
};

export default FloatingCTA;