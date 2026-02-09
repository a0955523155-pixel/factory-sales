// src/utils/adminHelpers.js

export const safeStr = (val) => (val === undefined || val === null) ? "" : String(val);

export const compressImage = (file) => {
  const watermarkText = "綠芽團隊0800666738.com";
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxWidth = 1000; 
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const fontSize = width * 0.03;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'right';
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 2;
        ctx.fillText(watermarkText, width - 15, height - 15);
        resolve(canvas.toDataURL('image/webp', 0.7));
      };
    };
  });
};