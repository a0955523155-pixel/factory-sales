import { Factory, Truck, Zap, Maximize } from 'lucide-react';

export const properties = [
  {
    id: "jiuda", // 網址識別碼
    basicInfo: {
      title: "【九大工業城】仁武稀有大面寬廠房",
      subtitle: "核心工業地段，物流交通樞紐",
      price: "8,800 萬",
      address: "高雄市仁武區九大路",
      agentName: "陳經理",
      agentPhone: "0912-345-678",
      lineId: "factory_king",
      thumb: "https://images.unsplash.com/photo-1565514020176-db79388f6356?auto=format&fit=crop&q=80&w=800", // 列表縮圖
    },
    specs: [
      { label: "總建坪", value: "320 坪" },
      { label: "地坪", value: "250 坪" },
      { label: "面寬", value: "18 米" },
    ],
    features: [
      { icon: Factory, title: "挑高設計", desc: "滴水9米，空間好利用" },
      { icon: Truck, title: "大車進出", desc: "40呎貨櫃可直接進廠" },
      { icon: Zap, title: "大電配置", desc: "已申請動力電" },
      { icon: Maximize, title: "附贈天車", desc: "5噸天車兩部" },
    ],
    images: [
      "https://images.unsplash.com/photo-1565514020176-db79388f6356?auto=format&fit=crop&q=80&w=1920",
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1920",
    ]
  },
  {
    id: "dacheng",
    basicInfo: {
      title: "【大成工業城】鳳山大寮交界傳產首選",
      subtitle: "傳統產業聚落，招工容易，機能完善",
      price: "6,500 萬",
      address: "高雄市大寮區大成路",
      agentName: "林專員",
      agentPhone: "0988-111-222",
      lineId: "factory_lin",
      thumb: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=800",
    },
    specs: [
      { label: "總建坪", value: "180 坪" },
      { label: "地坪", value: "150 坪" },
      { label: "面寬", value: "10 米" },
    ],
    features: [
      { icon: Factory, title: "方正格局", desc: "無虛坪，好規劃" },
      { icon: Truck, title: "臨路寬敞", desc: "15米路寬，拖車可入" },
      { icon: Zap, title: "汙水處理", desc: "區內有汙水處理廠" },
      { icon: Maximize, title: "合法三照", desc: "工廠登記無虞" },
    ],
    images: [
      "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=1920",
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=1920",
    ]
  },
  {
    id: "huafu",
    basicInfo: {
      title: "【華富工業城】小港全新鋼構廠房",
      subtitle: "臨近港區與國道七號預定地，增值潛力高",
      price: "1 億 2000 萬",
      address: "高雄市小港區華富路",
      agentName: "王店長",
      agentPhone: "0955-999-888",
      lineId: "factory_boss",
      thumb: "https://images.unsplash.com/photo-1605218427306-633ba84e9715?auto=format&fit=crop&q=80&w=800",
    },
    specs: [
      { label: "總建坪", value: "500 坪" },
      { label: "地坪", value: "450 坪" },
      { label: "面寬", value: "25 米" },
    ],
    features: [
      { icon: Factory, title: "全新完工", desc: "無須整理直接進駐" },
      { icon: Truck, title: "雙面臨路", desc: "角地優勢，動線佳" },
      { icon: Zap, title: "太陽能頂", desc: "屋頂已租賃太陽能" },
      { icon: Maximize, title: "腹地廣大", desc: "有空地可做倉儲" },
    ],
    images: [
      "https://images.unsplash.com/photo-1605218427306-633ba84e9715?auto=format&fit=crop&q=80&w=1920",
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1920",
    ]
  }
];