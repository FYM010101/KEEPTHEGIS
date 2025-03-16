<template>
  <div class="side-charts-container">
    <!-- 左侧图表 -->
    <div class="left-charts">
      <SideChartPanel 
        v-for="chart in leftCharts" 
        :key="chart.id"
        :title="chart.title"
        :chart-type="chart.type"
        :chart-data="chart.data"
        position="left"
        :style="{ top: `${20 + chart.index * 280}px` }"
        closable
        @close="removeChart('left', chart.id)"
      />
    </div>
    
    <!-- 右侧图表 -->
    <div class="right-charts">
      <SideChartPanel 
        v-for="chart in rightCharts" 
        :key="chart.id"
        :title="chart.title"
        :chart-type="chart.type"
        :chart-data="chart.data"
        position="right"
        :style="{ top: `${20 + chart.index * 280}px` }"
        closable
        @close="removeChart('right', chart.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SideChartPanel from './SideChartPanel.vue';

// 图表类型定义
type ChartType = 'pie' | 'bar' | 'line' | 'horizontalBar' | 'scrollList' | 'filterList';

// 图表数据接口
interface ChartItem {
  id: string;
  title: string;
  type: ChartType;
  data: any;
  index: number;
}

// 左侧图表数据
const leftChartsData = ref<ChartItem[]>([
  {
    id: 'left-1',
    title: '城市人口分布',
    type: 'pie',
    index: 0,
    data: {
      pieData: [
        { value: 1048, name: '城区' },
        { value: 735, name: '郊区' },
        { value: 580, name: '开发区' },
        { value: 484, name: '工业区' },
        { value: 300, name: '其他' }
      ]
    }
  },
  {
    id: 'left-2',
    title: '月度用水量',
    type: 'bar',
    index: 1,
    data: {
      xAxisData: ['1月', '2月', '3月', '4月', '5月', '6月'],
      barData: [320, 332, 301, 334, 390, 330]
    }
  },
  {
    id: 'left-3',
    title: '项目类型分布',
    type: 'filterList',
    index: 2,
    data: {
      categories: ['全部', '类型A', '类型B', '类型C'],
      selectedCategory: '全部',
      listData: [
        { name: '智慧交通', value: 1048, category: '类型A' },
        { name: '智慧水务', value: 735, category: '类型B' },
        { name: '智慧能源', value: 580, category: '类型A' },
        { name: '智慧环保', value: 484, category: '类型C' },
        { name: '智慧安防', value: 300, category: '类型B' },
        { name: '智慧医疗', value: 200, category: '类型C' },
        { name: '智慧教育', value: 150, category: '类型A' },
        { name: '智慧社区', value: 100, category: '类型B' }
      ]
    }
  }
]);

// 右侧图表数据
const rightChartsData = ref<ChartItem[]>([
  {
    id: 'right-1',
    title: '区域分布',
    type: 'horizontalBar',
    index: 0,
    data: {
      yAxisData: ['商业区', '住宅区', '工业区', '绿化区', '其他'],
      horizontalBarData: [320, 302, 301, 334, 190]
    }
  },
  {
    id: 'right-2',
    title: '年度温度变化',
    type: 'line',
    index: 1,
    data: {
      xAxisData: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      lineData: [3, 5, 10, 15, 22, 27, 32, 30, 25, 18, 10, 5]
    }
  },
  {
    id: 'right-3',
    title: '项目监控列表',
    type: 'scrollList',
    index: 2,
    data: {
      listData: [
        { name: '智慧城市项目', value: 1048, status: '正常' },
        { name: '水资源监测', value: 735, status: '异常' },
        { name: '交通管理系统', value: 580, status: '正常' },
        { name: '环境监测网络', value: 484, status: '警告' },
        { name: '能源管理平台', value: 300, status: '正常' },
        { name: '安防监控系统', value: 200, status: '异常' },
        { name: '公共设施管理', value: 150, status: '正常' },
        { name: '应急指挥系统', value: 100, status: '警告' },
        { name: '市政工程管理', value: 95, status: '正常' },
        { name: '园区管理平台', value: 80, status: '异常' }
      ]
    }
  }
]);

// 计算属性：左侧图表（带索引）
const leftCharts = computed(() => {
  return leftChartsData.value.map((chart, index) => ({
    ...chart,
    index
  }));
});

// 计算属性：右侧图表（带索引）
const rightCharts = computed(() => {
  return rightChartsData.value.map((chart, index) => ({
    ...chart,
    index
  }));
});

// 移除图表
const removeChart = (position: 'left' | 'right', id: string) => {
  if (position === 'left') {
    leftChartsData.value = leftChartsData.value.filter(chart => chart.id !== id);
  } else {
    rightChartsData.value = rightChartsData.value.filter(chart => chart.id !== id);
  }
};

// 添加图表方法（可以导出供外部使用）
const addChart = (position: 'left' | 'right', chart: Omit<ChartItem, 'index'>) => {
  const newChart = { ...chart, index: 0 };
  if (position === 'left') {
    leftChartsData.value.push(newChart);
  } else {
    rightChartsData.value.push(newChart);
  }
};

// 导出添加图表方法，供外部组件调用
defineExpose({
  addChart
});
</script>

<style scoped lang="scss">
.side-charts-container {
  position: absolute;
  top: $base-menu-height;
  left: 0px;
  width: 100%;
  height: calc(100vh - $base-menu-height);
  pointer-events: none;
  z-index: 1000;
  
  .left-charts, .right-charts {
    position: absolute;
    top: 0px;
    bottom: 0px;
    width: 350px;
    pointer-events: all;
  }
  
  .left-charts {
    left: 0;
  }
  
  .right-charts {
    right: 0;
  }
}
</style>