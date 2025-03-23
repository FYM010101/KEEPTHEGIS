<template>
  <SideChartPanel :title="title" position="left" class="heatmap-panel">
    <div class="control-container">
      <div class="control-item">
        <span class="label">半径:</span>
        <el-slider v-model="radius" :min="10" :max="100" show-input />
      </div>
      <div class="control-item">
        <span class="label">透明度:</span>
        <el-slider v-model="opacity" :min="0" :max="1" :step="0.1" show-input />
      </div>
      <div class="control-item">
        <span class="label">渐变颜色:</span>
        <el-color-picker v-model="gradient[0]" show-alpha />
        <el-color-picker v-model="gradient[1]" show-alpha />
        <el-color-picker v-model="gradient[2]" show-alpha />
      </div>
    </div>
  </SideChartPanel>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import SideChartPanel from './SideChartPanel.vue';

const props = defineProps({
  title: {
    type: String,
    default: '热力图参数调节'
  },
  points: {
    type: Array as () => Array<[number, number, number]>,
    default: () => []
  }
});

const radius = ref(50);
const opacity = ref(0.8);
const gradient = ref(['rgba(0, 255, 255, 0.6)', 'rgba(0, 191, 255, 0.8)', 'rgba(0, 127, 255, 1)']);

watch([radius, opacity, gradient], () => {
  // 更新地图热力图图层
  updateHeatmapLayer();
});

const updateHeatmapLayer = () => {
  // 调用地图实例更新热力图参数
  window.mapInstance.heatmapLayer?.updateOptions({
    radius: radius.value,
    opacity: opacity.value,
    gradient: gradient.value
  });
};
</script>

<style scoped lang="scss">
.heatmap-panel {
  :deep(.chart-container) {
    padding: 15px;

    .control-item {
      margin-bottom: 15px;
      display: flex;
      align-items: center;

      .label {
        width: 80px;
        color: #8fd4d4;
        font-size: 14px;
      }

      .el-slider {
        flex: 1;
        margin-left: 15px;
      }

      .el-color-picker {
        margin-left: 10px;
      }
    }
  }
}
</style>