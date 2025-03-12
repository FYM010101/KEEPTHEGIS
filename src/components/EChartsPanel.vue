<template>
  <div class="echarts-panel" v-show="visible">
    <div class="panel-header">
      <span class="title">{{ title }}</span>
      <el-button type="text" @click="close" class="close-btn">
        <el-icon><Close /></el-icon>
      </el-button>
    </div>
    <div class="chart-container" ref="chartContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import { Close } from '@element-plus/icons-vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '区域统计数据'
  },
  regionName: {
    type: String,
    default: ''
  },
  chartData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'update:visible']);

const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

// 关闭面板
const close = () => {
  emit('update:visible', false);
  emit('close');
};

// 初始化图表
const initChart = () => {
  if (chartContainer.value) {
    chartInstance = echarts.init(chartContainer.value);
    updateChart();
  }
};

// 更新图表数据
const updateChart = () => {
  if (!chartInstance) return;
  
  const option = {
    title: {
      text: `${props.regionName}统计数据`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['人口', 'GDP', '面积'],
      bottom: 10
    },
    xAxis: {
      type: 'category',
      data: props.chartData.years || ['2018', '2019', '2020', '2021', '2022']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '人口',
        type: 'bar',
        data: props.chartData.population || generateRandomData(5, 500, 1000)
      },
      {
        name: 'GDP',
        type: 'line',
        data: props.chartData.gdp || generateRandomData(5, 2000, 5000)
      },
      {
        name: '面积',
        type: 'bar',
        data: props.chartData.area || generateRandomData(5, 100, 500)
      }
    ]
  };
  
  chartInstance.setOption(option);
};

// 生成随机数据(用于演示)
const generateRandomData = (count: number, min: number, max: number) => {
  return Array.from({ length: count }, () => 
    Math.floor(Math.random() * (max - min + 1)) + min
  );
};

// 监听数据变化
watch(() => props.chartData, () => {
  updateChart();
}, { deep: true });

watch(() => props.regionName, () => {
  updateChart();
});

// 监听可见性变化
watch(() => props.visible, (newVal) => {
  if (newVal && !chartInstance && chartContainer.value) {
    initChart();
  }
});

// 组件挂载时初始化
onMounted(() => {
  if (props.visible) {
    initChart();
  }
});

// 组件销毁时释放资源
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});

// 窗口大小变化时重新调整图表大小
window.addEventListener('resize', () => {
  if (chartInstance) {
    chartInstance.resize();
  }
});
</script>

<style scoped lang="scss">
.echarts-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 400px;
  height: 300px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid #eee;
    
    .title {
      font-weight: bold;
      font-size: 16px;
    }
    
    .close-btn {
      padding: 2px;
    }
  }
  
  .chart-container {
    flex: 1;
    width: 100%;
  }
}
</style>