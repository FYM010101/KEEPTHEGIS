<template>
  <SideChartPanel :title="title" position="right" class="buffer-panel">
    <div class="control-container">
      <div class="control-item">
        <span class="label">缓冲半径:</span>
        <el-slider v-model="radius" :min="100" :max="1000" :step="50" show-input />
      </div>
      <div class="control-item">
        <span class="label">单位:</span>
        <el-select v-model="unit" size="small" style="width: 100px">
          <el-option label="米" value="meters" />
          <el-option label="千米" value="kilometers" />
        </el-select>
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
    default: '缓冲区分析'
  },
  features: {
    type: Array as () => Array<GeoJSON.Feature>,
    default: () => []
  }
});

const radius = ref(500);
const unit = ref('meters');

watch([radius, unit], () => {
  performBufferAnalysis();
});

const performBufferAnalysis = () => {
  // 调用Turf.js进行缓冲区计算
  const buffered = window.turf.buffer({
    type: 'FeatureCollection',
    features: props.features
  }, radius.value, { units: unit.value });
  
  // 更新地图显示
  window.mapInstance.bufferLayer?.updateFeatures(buffered);
};
</script>

<style scoped lang="scss">
.buffer-panel {
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

      .el-select {
        margin-left: 15px;
      }
    }
  }
}
</style>