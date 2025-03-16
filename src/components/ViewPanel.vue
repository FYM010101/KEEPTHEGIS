<script setup lang="ts">
import { ref, computed } from 'vue';
import useMapStore from '@/store/modules/mapStore';
import { ElMessage } from 'element-plus';
import { Close, VideoPlay, VideoPause } from '@element-plus/icons-vue';

const mapStore = useMapStore();

interface ViewConfig {
  id: string;
  name: string;
  position: any;
  heading: number;
  pitch: number;
  roll: number;
}

const handleSave = () => {
  if (!mapStore.viewer) return;

  const camera = mapStore.viewer.camera;
  const position = camera.position.clone();
  const heading = camera.heading;
  const pitch = camera.pitch;
  const roll = camera.roll;

  mapStore.addViewConfig({
    name: `视图-${mapStore.viewConfigs.length + 1}`,
    position,
    heading,
    pitch,
    roll
  });
};
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
});
const emit = defineEmits(['close']);
// 关闭面板
const close = () => {
  emit('close');
};
// 添加响应式引用
const viewConfigs = computed({
  get: () => mapStore.viewConfigs,
  set: (value) => mapStore.reorderViews(value) // 这里直接调用排序方法
});
const handleDragEnd = () => {
  // mapStore.reorderViews(viewConfigs);
};
// 新增拖拽状态管理
const dragStartIndex = ref(-1)
const draggingIndex = ref(-1)

const handleDragStart = (index: any) => {
  dragStartIndex.value = index
  draggingIndex.value = index
}

const handleDragOver = (index: any) => {
  if (draggingIndex.value !== index) {
    const items = [...mapStore.viewConfigs]
    const draggedItem = items[draggingIndex.value]

    // 交换位置
    items.splice(draggingIndex.value, 1)
    items.splice(index, 0, draggedItem)

    // 更新视图
    mapStore.reorderViews(items)
    draggingIndex.value = index
  }
}

const handleDrop = () => {
  dragStartIndex.value = -1
  draggingIndex.value = -1
}

// 漫游控制相关方法
const startTour = () => {
  if (mapStore.viewConfigs.length < 2) {
    ElMessage.warning('至少需要两个视角点才能开始漫游');
    return;
  }
  mapStore.startCameraTour();
};

const pauseResumeTour = () => {
  if (mapStore.isPaused) {
    mapStore.resumeCameraTour();
  } else {
    mapStore.pauseCameraTour();
  }
};

const stopTour = () => {
  mapStore.stopCameraTour();
};

// 漫游速度控制
const tourSpeed = ref(1.0);
const handleSpeedChange = (val: number) => {
  mapStore.setTourSpeed(val);
};

// 计算漫游状态
const isTourRunning = computed(() => mapStore.isTourRunning);
const isPaused = computed(() => mapStore.isPaused);
const tourProgress = computed(() => mapStore.tourProgress);
</script>
<template>
  <div class="cameraView-panel" v-show="visible">
    <div class="titleHeader">
      <h3>视图管理</h3>
      <el-button type="primary" size="small" @click="handleSave">保存当前视图</el-button>
      <el-button type="text" @click="close" class="close-btn">
        <el-icon>
          <Close />
        </el-icon>
      </el-button>
    </div>
    <div class="draggable-container">
      <div v-for="(item, index) in mapStore.viewConfigs" :key="item.id" class="cameraView-item" draggable="true"
        @dragstart="handleDragStart(index)" @dragover.prevent="handleDragOver(index)" @dragend="handleDragEnd"
        @drop="handleDrop()">
        <span>{{ item.name }}</span>
        <div class="actions">
          <el-button type="success" size="small" @click="mapStore.flyToView(item.id)">定位</el-button>
          <el-button type="danger" size="small" @click="mapStore.removeViewConfig(item.id)">删除</el-button>
        </div>
      </div>

      <div v-if="mapStore.viewConfigs.length === 0" class="empty-tip">
        <el-empty description="暂无保存的视角" :image-size="80" />
      </div>
    </div>
    <!-- 漫游控制面板 -->
    <div class="tour-control-panel">
      <h4>漫游控制</h4>
      <div class="tour-buttons">
        <el-button type="primary" size="small" @click="startTour" :disabled="isTourRunning && !isPaused">
          <el-icon><VideoPlay /></el-icon>
          <span>开始</span>
        </el-button>
        <el-button type="warning" size="small" @click="pauseResumeTour" :disabled="!isTourRunning">
          <el-icon v-if="isPaused"><VideoPlay /></el-icon>
          <el-icon v-else><VideoPause /></el-icon>
          <span>{{ isPaused ? '继续' : '暂停' }}</span>
        </el-button>
        <el-button type="danger" size="small" @click="stopTour" :disabled="!isTourRunning">
          <span>停止</span>
        </el-button>
      </div>
      
      <div class="tour-speed-control">
        <span>速度控制:</span>
        <el-slider v-model="tourSpeed" :min="0.1" :max="5" :step="0.1" @change="handleSpeedChange" />
      </div>
      
      <div class="tour-progress" v-if="isTourRunning">
        <span>漫游进度:</span>
        <el-progress :percentage="tourProgress" :stroke-width="10" :show-text="false" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.cameraView-panel {
  position: fixed;
  right: 400px;
  top: 80px;
  width: 300px;
  background: rgba(4, 25, 37, 0.85);
  border-radius: 8px;
  padding: 15px;
  border: 1px solid rgba(0, 191, 255, 0.3);
  box-shadow: 0 0 15px rgba(0, 191, 255, 0.4);
  z-index: 2000;

  .titleHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;

    h3 {
      color: #00e5ff;
      text-shadow: 0 0 8px rgba(0, 229, 255, 0.5);
      margin-right: 15px;
    }

    .el-button {
      background: rgba(0, 90, 130, 0.7);
      border: 1px solid rgba(0, 191, 255, 0.4);
      color: #00e5ff;

      &:hover {
        background: rgba(0, 120, 170, 0.8);
      }
    }
  }
  
  // 漫游控制面板样式
  .tour-control-panel {
    margin-bottom: 20px;
    padding: 12px;
    background: rgba(0, 45, 65, 0.5);
    border: 1px solid rgba(0, 191, 255, 0.2);
    border-radius: 6px;
    
    h4 {
      color: #00e5ff;
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 16px;
      text-shadow: 0 0 5px rgba(0, 229, 255, 0.4);
    }
    
    .tour-buttons {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      
      .el-button {
        flex: 1;
        margin-right: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:last-child {
          margin-right: 0;
        }
        
        .el-icon {
          margin-right: 4px;
        }
      }
    }
    
    .tour-speed-control {
      margin-bottom: 12px;
      
      span {
        display: block;
        color: #7fd8ff;
        margin-bottom: 8px;
        font-size: 14px;
      }
      
      :deep(.el-slider) {
        .el-slider__runway {
          background-color: rgba(0, 60, 80, 0.5);
        }
        
        .el-slider__bar {
          background-color: rgba(0, 191, 255, 0.6);
        }
        
        .el-slider__button {
          border-color: #00e5ff;
          background-color: #00a0c0;
        }
      }
    }
    
    .tour-progress {
      span {
        display: block;
        color: #7fd8ff;
        margin-bottom: 8px;
        font-size: 14px;
      }
      
      :deep(.el-progress-bar__outer) {
        background-color: rgba(0, 60, 80, 0.5);
      }
      
      :deep(.el-progress-bar__inner) {
        background-color: rgba(0, 191, 255, 0.8);
      }
    }
  }

  .draggable-container {
    min-height: 60px;
    max-height: 40vh;
    overflow-x: hidden;
    overflow-y: auto;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(0, 30, 45, 0.2);
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 191, 255, 0.4);
      border-radius: 3px;
    }

    // &:hover {
    //   filter: drop-shadow(0 0 8px rgba(0, 191, 255, 0.2));
    // }

    .cameraView-item {
      padding: 12px;
      margin: 8px 0;
      background: rgba(0, 45, 65, 0.6);
      border: 1px solid rgba(0, 191, 255, 0.2);
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      transition: all 0.3s ease;

      span {
        color: #7fd8ff;
      }

      &:hover {
        transform: scale(1.02);
        box-shadow: 0 0 8px rgba(0, 191, 255, 0.3);
        background: rgba(0, 65, 95, 0.7);
      }

      .actions {
        .el-button {
          padding: 6px 12px;
          border-radius: 4px;

          &--success {
            background: rgba(0, 150, 100, 0.6);
            border-color: #00ff88;
          }

          &--danger {
            background: rgba(150, 0, 0, 0.6);
            border-color: #ff4444;
          }
        }
      }
    }
  }
}
</style>