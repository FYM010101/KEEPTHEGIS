<script setup lang="ts">
// import { onMounted } from 'vue';
import { useCesiumScale } from '../hooks/useCesiumScale';

// onMounted(() => {
    // 使用比例尺 Hook
    const { scaleText } = useCesiumScale();
// });
</script>
<template>
    <div class="scale_control">
        <div class="scale_text">{{ scaleText }}</div>
        <div class="scale_bar"></div>
    </div>
</template>

<style scoped>
.scale_control {
    /* position: absolute; */
    /* bottom: 20px;
    left: 20px; */
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 3px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    display: flex;
    /* 垂直排列 */
    flex-direction: column;
    /* 水平居中 */
    align-items: center;
    /* 子元素之间的间距 */
    gap: 1px;

    .scale_bar {
        width: 100px;
        height: 2px;
        background: white;
    }
    
    .scale_text {
        white-space: nowrap;
    }
}
</style>