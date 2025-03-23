<template>
  <div class="side-chart-panel" :class="position">
    <div class="panel-header">
      <span class="title">{{ title }}</span>
      <!-- <el-button v-if="closable" type="text" @click="close" class="close-btn">
        <el-icon>
          <Close />
        </el-icon>
      </el-button> -->
    </div>
    <div v-if="chartType === 'filterList'" class="filter-container">
      <el-select v-model="selectedCategory" placeholder="请选择类别" size="small" @change="handleCategoryChange">
        <el-option 
          v-for="category in chartData.categories || ['全部', '类型A', '类型B', '类型C']"
          :key="category"
          :label="category"
          :value="category"
        />
      </el-select>
    </div>
    <div class="chart-container" ref="chartContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, nextTick, PropType } from 'vue';
import * as echarts from 'echarts';
import { Close } from '@element-plus/icons-vue';

// 图表类型定义
type ChartType = 'pie' | 'bar' | 'line' | 'horizontalBar' | 'scrollList' | 'filterList';

const props = defineProps({
  title: {
    type: String,
    default: '数据统计'
  },
  chartType: {
    type: String as PropType<ChartType>,
    default: 'bar'
  },
  chartData: {
    type: Object,
    default: () => ({})
  },
  position: {
    type: String as PropType<'left' | 'right'>,
    default: 'left'
  },
  closable: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const chartContainer = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

// 筛选列表的选中类别
const selectedCategory = ref(props.chartData.selectedCategory || '全部');

// 处理类别变化
const handleCategoryChange = (value: string) => {
  selectedCategory.value = value;
  updateChart();
};

// 关闭面板
const close = () => {
  emit('close');
};

// 初始化图表
const initChart = () => {
  if (chartContainer.value && !chartInstance) {
    chartInstance = echarts.init(chartContainer.value);
    updateChart();
  }
};

// 创建饼图配置
const createPieChartOption = () => {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      backgroundColor: 'rgba(4, 25, 37, 0.9)',
      borderColor: '#0a5e7d',
      textStyle: {
        color: '#8fd4d4'
      }
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: {
        color: '#8fd4d4'
      }
    },
    series: [
      {
        name: props.title,
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: 'rgba(4, 25, 37, 0.85)',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '14',
            fontWeight: 'bold',
            color: '#8fd4d4'
          }
        },
        labelLine: {
          show: false
        },
        data: props.chartData.pieData || [
          { value: 1048, name: '类别A' },
          { value: 735, name: '类别B' },
          { value: 580, name: '类别C' },
          { value: 484, name: '类别D' },
          { value: 300, name: '类别E' }
        ]
      }
    ]
  };
};

// 创建柱状图配置
const createBarChartOption = () => {
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 25, 37, 0.9)',
      borderColor: '#0a5e7d',
      textStyle: {
        color: '#8fd4d4'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.chartData.xAxisData || ['类别A', '类别B', '类别C', '类别D', '类别E'],
      axisLine: {
        lineStyle: {
          color: 'rgba(143, 212, 212, 0.5)'
        }
      },
      axisLabel: {
        color: '#7abfbf'
      }
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
        name: props.title,
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 229, 255, 0.8)' },
            { offset: 1, color: 'rgba(0, 229, 255, 0.3)' }
          ])
        },
        data: props.chartData.barData || [320, 332, 301, 334, 390]
      }
    ]
  };
};

// 创建水平柱状图配置
const createHorizontalBarChartOption = () => {
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 25, 37, 0.9)',
      borderColor: '#0a5e7d',
      textStyle: {
        color: '#8fd4d4'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
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
    yAxis: {
      type: 'category',
      data: props.chartData.yAxisData || ['类别A', '类别B', '类别C', '类别D', '类别E'],
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
        name: props.title,
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: 'rgba(0, 229, 255, 0.3)' },
            { offset: 1, color: 'rgba(0, 229, 255, 0.8)' }
          ])
        },
        data: props.chartData.horizontalBarData || [320, 332, 301, 334, 390]
      }
    ]
  };
};

// 创建折线图配置
const createLineChartOption = () => {
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 25, 37, 0.9)',
      borderColor: '#0a5e7d',
      textStyle: {
        color: '#8fd4d4'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.chartData.xAxisData || ['类别A', '类别B', '类别C', '类别D', '类别E'],
      axisLine: {
        lineStyle: {
          color: 'rgba(143, 212, 212, 0.5)'
        }
      },
      axisLabel: {
        color: '#7abfbf'
      }
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
        name: props.title,
        type: 'line',
        smooth: true,
        lineStyle: {
          width: 3,
          color: 'rgba(0, 229, 255, 0.8)'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 229, 255, 0.5)' },
            { offset: 1, color: 'rgba(0, 229, 255, 0.1)' }
          ])
        },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: '#00e5ff',
          borderColor: '#fff',
          borderWidth: 2
        },
        data: props.chartData.lineData || [120, 132, 101, 134, 90]
      }
    ]
  };
};

// 创建滚动列表配置
const createScrollListOption = () => {
  const listData = props.chartData.listData || [
    { name: '项目A', value: 1048, status: '正常' },
    { name: '项目B', value: 735, status: '异常' },
    { name: '项目C', value: 580, status: '正常' },
    { name: '项目D', value: 484, status: '警告' },
    { name: '项目E', value: 300, status: '正常' },
    { name: '项目F', value: 200, status: '异常' },
    { name: '项目G', value: 150, status: '正常' },
    { name: '项目H', value: 100, status: '警告' },
    { name: '项目I', value: 95, status: '正常' },
    { name: '项目J', value: 80, status: '异常' }
  ];

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 25, 37, 0.9)',
      borderColor: '#0a5e7d',
      textStyle: {
        color: '#8fd4d4'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
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
    yAxis: {
      type: 'category',
      data: listData.map(item => item.name),
      axisLine: {
        lineStyle: {
          color: 'rgba(143, 212, 212, 0.5)'
        }
      },
      axisLabel: {
        color: '#7abfbf'
      }
    },
    dataZoom: [{
      type: 'slider',
      show: true,
      yAxisIndex: [0],
      width: 10,
      right: 10,
      start: 0,
      end: 50,  // 显示50%的数据
      borderColor: 'rgba(0, 191, 255, 0.3)',
      backgroundColor: 'rgba(4, 25, 37, 0.5)',
      fillerColor: 'rgba(0, 229, 255, 0.3)',
      handleStyle: {
        color: '#00e5ff'
      },
      textStyle: {
        color: '#7abfbf'
      }
    }, {
      type: 'inside',
      yAxisIndex: [0],
      start: 0,
      end: 50
    }],
    series: [{
      name: props.title,
      type: 'bar',
      barWidth: '60%',
      itemStyle: {
        color: (params: any) => {
          // 根据状态设置不同颜色
          const status = listData[params.dataIndex].status;
          if (status === '正常') return 'rgba(0, 229, 255, 0.8)';
          if (status === '警告') return 'rgba(255, 191, 0, 0.8)';
          if (status === '异常') return 'rgba(255, 77, 79, 0.8)';
          return 'rgba(0, 229, 255, 0.8)';
        }
      },
      label: {
        show: true,
        position: 'right',
        formatter: (params: any) => {
          const status = listData[params.dataIndex].status;
          return `{status|${status}} {value|${params.value}}`;
        },
        rich: {
          value: {
            color: '#8fd4d4',
            fontWeight: 'bold'
          },
          status: {
            color: (params: any) => {
              const status = listData[params.dataIndex].status;
              if (status === '正常') return '#52c41a';
              if (status === '警告') return '#faad14';
              if (status === '异常') return '#ff4d4f';
              return '#8fd4d4';
            }
          }
        }
      },
      data: listData.map(item => item.value)
    }],
    // 自动滚动效果
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicInOut',
    animationDelay: (idx: number) => idx * 100
  };
};

// 创建筛选列表配置
const createFilterListOption = () => {
  const categories = props.chartData.categories || ['全部', '类型A', '类型B', '类型C'];
  const listData = props.chartData.listData || [
    { name: '项目A', value: 1048, category: '类型A' },
    { name: '项目B', value: 735, category: '类型B' },
    { name: '项目C', value: 580, category: '类型A' },
    { name: '项目D', value: 484, category: '类型C' },
    { name: '项目E', value: 300, category: '类型B' },
    { name: '项目F', value: 200, category: '类型C' },
    { name: '项目G', value: 150, category: '类型A' },
    { name: '项目H', value: 100, category: '类型B' }
  ];

  // 根据选择的类别筛选数据
  const filteredData = selectedCategory.value === '全部' 
    ? listData 
    : listData.filter((item: { category: string }) => item.category === selectedCategory.value);

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 25, 37, 0.9)',
      borderColor: '#0a5e7d',
      textStyle: {
        color: '#8fd4d4'
      },
      formatter: (params: any) => {
        const dataIndex = params[0].dataIndex;
        const item = filteredData[dataIndex];
        return `${item.name}<br/>类别: ${item.category}<br/>数值: ${item.value}`;
      }
    },
    legend: {
      data: categories,
      top: 10,
      textStyle: {
        color: '#8fd4d4'
      },
      selected: categories.reduce((acc: any, curr: string) => {
        acc[curr] = curr === selectedCategory.value || selectedCategory.value === '全部';
        return acc;
      }, {})
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '60px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: filteredData.map(item => item.name),
      axisLine: {
        lineStyle: {
          color: 'rgba(143, 212, 212, 0.5)'
        }
      },
      axisLabel: {
        color: '#7abfbf',
        rotate: 45
      }
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
    series: [{
      name: props.title,
      type: 'bar',
      barWidth: '60%',
      itemStyle: {
        color: (params: any) => {
          const category = filteredData[params.dataIndex].category;
          if (category === '类型A') return 'rgba(0, 229, 255, 0.8)';
          if (category === '类型B') return 'rgba(255, 191, 0, 0.8)';
          if (category === '类型C') return 'rgba(92, 219, 148, 0.8)';
          return 'rgba(0, 229, 255, 0.8)';
        }
      },
      data: filteredData.map(item => item.value)
    }]
  };
};

// 根据图表类型获取对应的配置
const getChartOption = () => {
  switch (props.chartType) {
    case 'pie':
      return createPieChartOption();
    case 'bar':
      return createBarChartOption();
    case 'horizontalBar':
      return createHorizontalBarChartOption();
    case 'line':
      return createLineChartOption();
    case 'scrollList':
      return createScrollListOption();
    case 'filterList':
      return createFilterListOption();
    default:
      return createBarChartOption();
  }
};

// 更新图表数据
const updateChart = () => {
  if (!chartInstance) return;
  const option = getChartOption();
  chartInstance.setOption(option);
  
  // 为滚动列表添加自动滚动效果
  if (props.chartType === 'scrollList') {
    let startValue = 0;
    const timer = setInterval(() => {
      if (!chartInstance) {
        clearInterval(timer);
        return;
      }
      
      const listData = props.chartData.listData || [];
      if (listData.length <= 5) {
        clearInterval(timer);
        return;
      }
      
      // 滚动到下一个位置
      startValue = (startValue + 1) % Math.max(1, listData.length - 4);
      
      chartInstance.dispatchAction({
        type: 'dataZoom',
        startValue: startValue,
        endValue: startValue + 4
      });
    }, 3000); // 每3秒滚动一次
    
    // 组件卸载时清除定时器
    onUnmounted(() => {
      clearInterval(timer);
    });
  }
};

// 监听数据变化
watch(() => props.chartData, () => {
  updateChart();
}, { deep: true });

// 监听图表类型变化
watch(() => props.chartType, () => {
  updateChart();
});

// 组件挂载时初始化
onMounted(() => {
  nextTick(() => {
    initChart();
  });
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
.side-chart-panel {
  position: absolute;
  width: 350px;
  height: 250px;
  background: rgba(4, 25, 37, 0.85);
  border: 1px solid rgba(0, 191, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(0, 191, 255, 0.4);
  backdrop-filter: blur(5px);
  z-index: 900;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  &.left {
    left: 20px;
    top: 20px;
  }
  
  &.right {
    right: 20px;
    top: 20px;
  }

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

  .filter-container {
    padding: 10px 15px 0;
    display: flex;
    justify-content: flex-end;
    
    :deep(.el-select) {
      width: 120px;
      
      .el-input__wrapper {
        background: rgba(4, 25, 37, 0.7);
        box-shadow: 0 0 0 1px rgba(0, 191, 255, 0.3);
        
        &.is-focus {
          box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.5);
        }
        
        .el-input__inner {
          color: #8fd4d4;
        }
      }
      
      .el-select__caret {
        color: #8fd4d4;
      }
    }
    
    :deep(.el-select-dropdown) {
      background: rgba(4, 25, 37, 0.95);
      border: 1px solid rgba(0, 191, 255, 0.3);
      
      .el-select-dropdown__item {
        color: #8fd4d4;
        
        &.selected, &.hover {
          background: rgba(0, 229, 255, 0.2);
        }
      }
    }
  }
  
  .chart-container {
    flex: 1;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>