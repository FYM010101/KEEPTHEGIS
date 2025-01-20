<script setup lang="ts">
import * as Cesium from 'cesium';
import useMapStore from '../store/modules/mapStore';
const mapStore = useMapStore();

const rotateCamera = (direction: string) => {
    const viewer = mapStore.viewer;
    if (!viewer) return;

    const camera = viewer.camera;
    switch (direction) {
        case "N": // 向北旋转
            camera.rotateUp(Cesium.Math.toRadians(10));
            break;
        case "S": // 向南旋转
            camera.rotateDown(Cesium.Math.toRadians(10));
            break;
        case "W": // 向西旋转
            camera.rotateLeft(Cesium.Math.toRadians(10));
            break;
        case "E": // 向东旋转
            camera.rotateRight(Cesium.Math.toRadians(10));
            break;
    }
};

const resetCamera = () => {
    const viewer = mapStore.viewer;
    if (!viewer) return;

    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
        orientation: {
            heading: 0,
            pitch: Cesium.Math.toRadians(-90),
            roll: 0,
        },
        duration: 2, // 动画持续时间
    });
};
</script>
<template>
    <div class="compass">
        <!-- 上 -->
        <button class="compass-button north" @click="rotateCamera('N')">N</button>
        <!-- 中心 -->
        <button class="compass-center" @click="resetCamera"></button>
        <!-- 左 -->
        <button class="compass-button west" @click="rotateCamera('W')">W</button>
        <!-- 下 -->
        <button class="compass-button south" @click="rotateCamera('S')">S</button>
        <!-- 右 -->
        <button class="compass-button east" @click="rotateCamera('E')">E</button>
    </div>
</template>

<style scoped>
.compass {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 100px;
    height: 100px;
    background-color: #0f4c75;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;

    .compass-button {
        position: absolute;
        width: 30px;
        height: 30px;
        background-color: #3282b8;
        color: white;
        border-radius: 50%;
        text-align: center;
        line-height: 30px;
        font-weight: bold;
        cursor: pointer;
        border: none;
    }

    .compass-button:hover {
        background-color: #bbe1fa;
    }

    .compass-center {
        width: 40px;
        height: 40px;
        background-color: #1b262c;
        border-radius: 50%;
        position: absolute;
        text-align: center;
        line-height: 40px;
        cursor: pointer;
    }

    .compass-center:hover {
        background-color: #bbe1fa;
    }

    .north {
        top: 10px;
    }

    .south {
        bottom: 10px;
    }

    .west {
        left: 10px;
    }

    .east {
        right: 10px;
    }
}
</style>