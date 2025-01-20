<script setup lang="ts">
//获取父组件传递过来的地图信息
defineProps(['mapInfo']);
</script>
<template>
    <div class="info-panel">
        <p>经度: {{ mapInfo.mouseLongitude }}°, 纬度: {{ mapInfo.mouseLatitude }}° ; 相机参数:  高度:  {{ mapInfo.cameraHeight }} 米,
            方位角:  
            {{ mapInfo.heading }}°, 俯仰角:  {{ mapInfo.pitch }}°, 滚动角:  {{ mapInfo.roll }}°</p>
    </div>
</template>

<style scoped>
.info-panel {
    /* text-align: right; */
    position: absolute;
    /* bottom: 10px; */
    right: 10px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 3px;
    border-radius: 5px;
    font-size: 12px;
}
</style>