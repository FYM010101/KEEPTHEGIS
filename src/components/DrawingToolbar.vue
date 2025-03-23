<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useDrawing, DrawMode } from '@/libs/cesium/hooks/useDrawing';
import useMapStore from '@/store/modules/mapStore';
import CommonButton from './CommonButton.vue';

// 获取地图存储和绘制功能
const mapStore = useMapStore();
const {
  drawMode,
  isDrawing,
  initDrawing,
  startDrawing,
  stopDrawing,
  finishDrawing,
  clearAll
} = useDrawing();

// 当前选中的绘制模式
const currentMode = ref(DrawMode.NONE);

// 绘制工具提示信息
const drawingTips = ref('');

// 初始化绘制功能
const initRetries = ref(5);

// 监听viewer就绪状态
watch(() => mapStore.viewerReady, (newVal) => {
  if (newVal && mapStore.viewer) {
    console.log('检测到viewer就绪，初始化绘制功能');
    initDrawing(mapStore.viewer);
  }
});

// 初始化逻辑
onMounted(() => {
  console.log('绘制组件挂载');
  
  const tryInit = () => {
    if (mapStore.viewer) {
      console.log('初始化绘制功能', mapStore.viewer);
      initDrawing(mapStore.viewer);
    } else if (initRetries.value > 0) {
      initRetries.value--;
      setTimeout(tryInit, 500);
    }
  };
  
  // 立即尝试初始化
  tryInit();
});

// 切换绘制模式
const toggleDrawMode = (mode: DrawMode) => {
  if (currentMode.value === mode) {
    // 如果点击当前模式，则取消选择
    currentMode.value = DrawMode.NONE;
    stopDrawing();
    drawingTips.value = '';
  } else {
    // 切换到新模式
    currentMode.value = mode;
    startDrawing(mode);
    
    // 更新提示信息
    switch (mode) {
      case DrawMode.POINT:
        drawingTips.value = '点击地图添加点位';
        break;
      case DrawMode.LINE:
        drawingTips.value = '点击地图添加线段点位，右键完成绘制';
        break;
      case DrawMode.POLYGON:
        drawingTips.value = '点击地图添加多边形顶点，右键完成绘制';
        break;
    }
  }
};

// 完成当前绘制
const completeDrawing = () => {
  if (isDrawing.value) {
    finishDrawing();
    currentMode.value = DrawMode.NONE;
    drawingTips.value = '';
  }
};

// 清除所有绘制内容
const clearDrawings = () => {
  clearAll();
  currentMode.value = DrawMode.NONE;
  drawingTips.value = '';
};
</script>

<template>
  <div class="drawing-toolbar">
    <div class="toolbar-title">绘制工具</div>
    <div class="toolbar-buttons">
      <CommonButton 
        type="text" 
        size="small" 
        :class="{ active: currentMode === DrawMode.POINT }" 
        @click="toggleDrawMode(DrawMode.POINT)"
      >
        <template #icon>
          <div class="icon-wrapper">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
          </div>
        </template>
        点
      </CommonButton>
      
      <CommonButton 
        type="text" 
        size="small" 
        :class="{ active: currentMode === DrawMode.LINE }" 
        @click="toggleDrawMode(DrawMode.LINE)"
      >
        <template #icon>
          <div class="icon-wrapper">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
        </template>
        线
      </CommonButton>
      
      <CommonButton 
        type="text" 
        size="small" 
        :class="{ active: currentMode === DrawMode.POLYGON }" 
        @click="toggleDrawMode(DrawMode.POLYGON)"
      >
        <template #icon>
          <div class="icon-wrapper">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <polygon points="12,3 22,12 12,21 2,12" fill="none" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
        </template>
        面
      </CommonButton>
      
      <CommonButton 
        type="text" 
        size="small" 
        @click="completeDrawing"
        :disabled="!isDrawing"
      >
        <template #icon>
          <div class="icon-wrapper">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="currentColor" />
            </svg>
          </div>
        </template>
        完成
      </CommonButton>
      
      <CommonButton 
        type="text" 
        size="small" 
        @click="clearDrawings"
      >
        <template #icon>
          <div class="icon-wrapper">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
            </svg>
          </div>
        </template>
        清除
      </CommonButton>
    </div>
    
    <div v-if="drawingTips" class="drawing-tips">
      {{ drawingTips }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.drawing-toolbar {
  display: flex;
  flex-direction: column;
  background: rgba(4, 25, 37, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 30px rgba(0, 102, 255, 0.1);
  border-radius: 4px;
  padding: 8px 12px;
  margin: 0 10px;
  
  .toolbar-title {
    color: #00ffff;
    font-size: 14px;
    margin-bottom: 8px;
    text-align: center;
  }
  
  .toolbar-buttons {
    display: flex;
    gap: 5px;
    
    :deep(.common-button) {
      color: #ffffff;
      padding: 4px 8px;
      
      &:hover, &.active {
        background: linear-gradient(45deg, rgba(10, 94, 125, 0.8), rgba(0, 191, 255, 0.3));
        color: #00ffff;
        text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
      }
      
      &.active {
        animation: glow 1.5s ease-in-out infinite alternate;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
  
  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 4px;
  }
  
  .drawing-tips {
    color: #ffffff;
    font-size: 12px;
    margin-top: 8px;
    text-align: center;
    background: rgba(0, 0, 0, 0.3);
    padding: 4px;
    border-radius: 2px;
  }
}

@keyframes glow {
  from {
    box-shadow: 0 0 5px rgba(0, 255, 255, 0.2),
      0 0 10px rgba(0, 255, 255, 0.1);
  }

  to {
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.4),
      0 0 20px rgba(0, 255, 255, 0.2);
  }
}
</style>