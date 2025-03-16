<template>
  <div class="echarts-panel" v-show="visible">
    <div class="panel-header">
      <span class="title">{{ title }}</span>
      <el-button type="text" @click="close" class="close-btn">
        <el-icon>
          <Close />
        </el-icon>
      </el-button>
    </div>
    <div class="chart-container" ref="chartContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue';
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
  // emit('update:visible', false);
  emit('close');
};

// 初始化图表
const initChart = () => {
  if (chartContainer.value && !chartInstance) {
    chartInstance = echarts.init(chartContainer.value);
    // updateChart();
  }
};

// 创建图表配置
const createChartOption = () => {
  return {
    title: {
      text: `${props.regionName}统计数据`,
      left: 'center',
      textStyle: {
        color: '#2cafaf'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 25, 37, 0.9)',
      borderColor: '#0a5e7d',
      textStyle: {
        color: '#8fd4d4'
      }
    },
    legend: {
      data: ['人口', 'GDP', '面积'],
      bottom: 10,
      textStyle: {
        color: '#8fd4d4'
      }
    },
    xAxis: {
      type: 'category',
      data: props.chartData.years || ['2018', '2019', '2020', '2021', '2022']
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: 'rgba(143, 212, 212, 0.5)'
        }
      },
      axisLabel: {
        color: '#7abfbf'
      }
    },
    series: [
      {
        name: '人口',
        type: 'bar',
        itemStyle: {
          color: 'rgba(44, 175, 175, 0.6)'
        },
        data: props.chartData.population || generateRandomData(5, 500, 1000)
      },
      {
        name: 'GDP',
        type: 'line',
        lineStyle: {
          color: '#4fd1d1',
          width: 2
        },
        itemStyle: {
          color: '#4fd1d1'
        },
        data: props.chartData.gdp || generateRandomData(5, 2000, 5000)
      },
      {
        name: '面积',
        type: 'bar',
        itemStyle: {
          color: 'rgba(79, 209, 209, 0.4)'
        },
        data: props.chartData.area || generateRandomData(5, 100, 500)
      }
    ]
  };
};

// 更新图表数据
const updateChart = () => {
  if (!chartInstance || !props.chartData) return;

  chartInstance.setOption(createChartOption());
  // chartInstance.resize();
};

// 生成随机数据(用于演示)
const generateRandomData = (count: number, min: number, max: number) => {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * (max - min + 1)) + min
  );
};
// 监听可见性变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      initChart();
      if (chartInstance) chartInstance.resize();
    });
  }
});
// 监听数据变化
watch(() => props.chartData, () => {
  updateChart();
}, { deep: true });

watch(() => props.regionName, () => {
  updateChart();
});

// 组件挂载时初始化
onMounted(() => {
  console.log('弹窗初始化')
  // if (props.visible) {
  initChart();
  // }
});

// 组件销毁时释放资源
onUnmounted(() => {
  console.log('弹窗销毁')
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
  top: 80px;
  left: 400px;
  width: 450px;
  height: 350px;
  background: rgba(4, 25, 37, 0.85);
  border: 1px solid rgba(0, 191, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(0, 191, 255, 0.4);
  backdrop-filter: blur(5px);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid #418f99;

    .title {
      font-weight: bold;
      font-size: 16px;
      background: linear-gradient(45deg, #00e5ff, #00b3ff);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      text-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
    }

    .close-btn {
      background: rgba(0, 90, 130, 0.7);
      border: 1px solid rgba(0, 191, 255, 0.4);
      border-radius: 4px;
      padding: 5px;
      transition: all 0.3s;

      &:hover {
        background: rgba(0, 120, 170, 0.8);
        box-shadow: 0 0 8px rgba(0, 229, 255, 0.3);
      }

      .el-icon {
        color: #00e5ff;
        font-size: 18px;
      }
    }
  }

  .chart-container {
    flex: 1;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    /* 滚动条样式 */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(4, 25, 37, 0.3);
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 191, 255, 0.5);
      border-radius: 3px;
    }
  }
}
</style>