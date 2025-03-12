// 区域数据服务
import { reactive } from 'vue';

// 区域数据类型
export interface RegionData {
  name: string;
  id: string;
  years: string[];
  population: number[];
  gdp: number[];
  area: number[];
}

// 模拟数据库
const regionDatabase: Record<string, RegionData> = {};

// 初始化一些模拟数据
const initMockData = () => {
  const years = ['2018', '2019', '2020', '2021', '2022'];
  
  // 生成随机数据的辅助函数
  const generateRandomTrend = (base: number, variance: number, count: number) => {
    const result = [];
    let current = base;
    
    for (let i = 0; i < count; i++) {
      current += Math.random() * variance - variance / 3;
      result.push(Math.round(current));
    }
    
    return result;
  };
  
  // 为每个省份生成模拟数据
  const provinces = [
    { name: '北京市', id: '110000' },
    { name: '天津市', id: '120000' },
    { name: '河北省', id: '130000' },
    { name: '山西省', id: '140000' },
    { name: '内蒙古自治区', id: '150000' },
    { name: '辽宁省', id: '210000' },
    { name: '吉林省', id: '220000' },
    { name: '黑龙江省', id: '230000' },
    { name: '上海市', id: '310000' },
    { name: '江苏省', id: '320000' },
    { name: '浙江省', id: '330000' },
    { name: '安徽省', id: '340000' },
    { name: '福建省', id: '350000' },
    { name: '江西省', id: '360000' },
    { name: '山东省', id: '370000' },
    { name: '河南省', id: '410000' },
    { name: '湖北省', id: '420000' },
    { name: '湖南省', id: '430000' },
    { name: '广东省', id: '440000' },
    { name: '广西壮族自治区', id: '450000' },
    { name: '海南省', id: '460000' },
    { name: '重庆市', id: '500000' },
    { name: '四川省', id: '510000' },
    { name: '贵州省', id: '520000' },
    { name: '云南省', id: '530000' },
    { name: '西藏自治区', id: '540000' },
    { name: '陕西省', id: '610000' },
    { name: '甘肃省', id: '620000' },
    { name: '青海省', id: '630000' },
    { name: '宁夏回族自治区', id: '640000' },
    { name: '新疆维吾尔自治区', id: '650000' },
    { name: '台湾省', id: '710000' },
    { name: '香港特别行政区', id: '810000' },
    { name: '澳门特别行政区', id: '820000' }
  ];
  
  provinces.forEach(province => {
    regionDatabase[province.id] = {
      name: province.name,
      id: province.id,
      years,
      population: generateRandomTrend(1000 + Math.random() * 5000, 200, years.length),
      gdp: generateRandomTrend(2000 + Math.random() * 8000, 500, years.length),
      area: generateRandomTrend(100 + Math.random() * 400, 20, years.length)
    };
  });
};

// 初始化模拟数据
initMockData();

// 区域数据状态
export const regionState = reactive({
  currentRegion: null as RegionData | null,
  showChart: false
});

// 获取区域数据
export const getRegionData = (regionId: string): RegionData | null => {
  return regionDatabase[regionId] || null;
};

// 设置当前区域
export const setCurrentRegion = (regionId: string) => {
  const data = getRegionData(regionId);
  if (data) {
    regionState.currentRegion = data;
    regionState.showChart = true;
    return true;
  }
  return false;
};

// 关闭图表
export const closeChart = () => {
  regionState.showChart = false;
};

export default {
  getRegionData,
  setCurrentRegion,
  closeChart,
  regionState
};